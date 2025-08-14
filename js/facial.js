
async function telaRegistroPonto() {

    const acumulado = `

    <div style="${vertical}">
        <div class="botaoSuperiorLogin" onclick="telaLogin()">
            <img src="imagens/cracha.png">
            <span>Voltar para a tela de Acesso</span>
        </div>
        <div class="loginBloco">
            <span>Informe o seu PIN de 4 dígitos</span>
            <input type="number" name="pin" placeholder="Máximo de 4 dígitos">
            <button onclick="verificarColaborador()">Avançar</butto>
        </div>
    </div>
    `

    tela.innerHTML = acumulado

}

async function verificarColaborador() {

    overlayAguarde()
    const pin = document.querySelector('[name="pin"]')

    const resposta = await colaboradorPin(pin)

    console.log(resposta)

    removerOverlay()

}

async function colaboradorPin(pin) {
    try {
        const requisicao = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ pin, servidor: 'RECONST' })
        };

        const response = await fetch("https://leonny.dev.br/colaborador", requisicao);

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (err) {
        return { err };
    }
}

async function validarFacial() {

    const acumulado = `
        <div class="wrap">
            <h1>Registro de Ponto — Face Match</h1>

            <div class="grid">
                <div class="card">
                    <div class="row" style="justify-content:space-between;margin-bottom:8px">
                        <div>
                            <div class="muted" style="font-size:12px">Foto cadastral</div>
                            <input id="refInput" type="file" accept="image/*" />
                        </div>
                        <div class="row">
                            <div class="muted" style="font-size:12px">Limite</div>
                            <input id="threshold" class="slider" type="range" min="0.3" max="0.8" step="0.01" value="0.5" />
                            <span id="thVal" class="muted">0.50</span>
                        </div>
                    </div>
                    <img id="refImg" alt="Referencia" />
                    <div id="refStatus" class="status muted">Carregue uma foto com um rosto</div>
                </div>

                <div class="card">
                    <div class="row" style="justify-content:space-between;margin-bottom:8px">
                        <div class="row">
                            <button id="startCam" class="btn">Iniciar câmera</button>
                            <button id="stopCam" class="btn ghost" disabled>Parar</button>
                        </div>
                        <button id="checkIn" class="btn" disabled>Bater ponto</button>
                    </div>
                    <video id="video" autoplay muted playsinline></video>
                    <canvas id="overlay"></canvas>
                    <div id="liveStatus" class="status muted">Câmera parada</div>
                </div>
            </div>

            <div class="card" style="margin-top:16px">
                <div class="row" style="justify-content:space-between;margin-bottom:8px">
                    <div class="muted">Registros</div>
                    <button id="limpar" class="btn ghost">Limpar registros</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Data/Hora</th>
                            <th>Resultado</th>
                            <th>Distância</th>
                        </tr>
                    </thead>
                    <tbody id="logs"></tbody>
                </table>
            </div>
        </div>
    `

    tela.innerHTML = acumulado

    await iniciarServico()
}

async function iniciarServico() {

    const el = (id) => document.getElementById(id)
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
    const refInput = el('refInput');
    const refImg = el('refImg');
    const refStatus = el('refStatus');
    const startCam = el('startCam');
    const stopCam = el('stopCam');
    const checkIn = el('checkIn');
    const thresholdEl = el('threshold');
    const thVal = el('thVal');
    const video = el('video');
    const overlay = el('overlay');
    const liveStatus = el('liveStatus');
    const logsEl = el('logs');
    const limpar = el('limpar');

    let stream = null;
    let refDescriptor = null;
    let modelsReady = false;

    thresholdEl.addEventListener('input', () => { thVal.textContent = Number(thresholdEl.value).toFixed(2); });

    refInput.addEventListener('change', async (e) => {
        if (!modelsReady) await loadModels();
        const file = e.target.files?.[0];
        if (!file) { refDescriptor = null; setStatus(refStatus, 'Carregue uma foto com um rosto', 'muted'); return; }
        refImg.src = URL.createObjectURL(file);
        refImg.onload = async () => {
            setStatus(refStatus, 'Processando referência…', 'muted');
            const desc = await computeDescriptorFromImage(refImg);
            if (!desc) { refDescriptor = null; setStatus(refStatus, 'Nenhum rosto detectado', 'err'); checkIn.disabled = true; return; }
            refDescriptor = desc;
            setStatus(refStatus, 'Referência pronta', 'ok');
            checkIn.disabled = !stream;
        };
    });

    startCam.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            video.srcObject = stream;
            video.onloadedmetadata = () => video.play();
            overlay.width = 0; overlay.height = 0;
            setStatus(liveStatus, 'Câmera ativa', 'ok');
            startCam.disabled = true; stopCam.disabled = false; checkIn.disabled = !refDescriptor;
        } catch (e) { setStatus(liveStatus, 'Falha ao iniciar câmera', 'err'); }
    });

    stopCam.addEventListener('click', () => {
        if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
        video.srcObject = null; setStatus(liveStatus, 'Câmera parada', 'warn'); startCam.disabled = false; stopCam.disabled = true; checkIn.disabled = true;
    });

    checkIn.addEventListener('click', async () => {
        if (!modelsReady) await loadModels();
        if (!refDescriptor) { setStatus(liveStatus, 'Cadastre a foto de referência', 'err'); return; }
        setStatus(liveStatus, 'Verificando…', 'muted');
        const liveDesc = await grabLiveDescriptor();
        if (!liveDesc) { setStatus(liveStatus, 'Rosto não detectado no vídeo', 'err'); addLog(false, null); return; }
        const dist = faceapi.euclideanDistance(refDescriptor, liveDesc);
        const ok = dist <= Number(thresholdEl.value);
        setStatus(liveStatus, ok ? `Autorizado (dist ${dist.toFixed(4)})` : `Negado (dist ${dist.toFixed(4)})`, ok ? 'ok' : 'err');
        addLog(ok, dist);
    });

    limpar.addEventListener('click', () => { localStorage.removeItem('registros_face'); logsEl.innerHTML = ''; });

    restoreLogs();

}

function fmtDate(d) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Bahia' }).format(d) }
function addLog(ok, dist) {
    const tr = document.createElement('tr');
    const dh = document.createElement('td');
    const rs = document.createElement('td');
    const di = document.createElement('td');
    dh.textContent = fmtDate(new Date());
    const span = document.createElement('span');
    span.className = 'pill ' + (ok ? 'ok' : 'err');
    span.textContent = ok ? 'Autorizado' : 'Negado';
    rs.appendChild(span);
    di.textContent = (dist ?? '—').toString().slice(0, 5);
    tr.append(dh, rs, di);
    logsEl.prepend(tr);
    const data = JSON.parse(localStorage.getItem('registros_face') || '[]');
    data.unshift({ ts: Date.now(), ok, dist });
    localStorage.setItem('registros_face', JSON.stringify(data.slice(0, 1000)));
}

function restoreLogs() {
    const data = JSON.parse(localStorage.getItem('registros_face') || '[]');
    data.forEach(x => addLog(x.ok, x.dist));
}

async function loadModels() {
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    modelsReady = true;
}

async function computeDescriptorFromImage(img) {
    const det = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })).withFaceLandmarks().withFaceDescriptor();
    return det ? det.descriptor : null;
}

async function grabLiveDescriptor() {
    const c = document.createElement('canvas');
    c.width = video.videoWidth; c.height = video.videoHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(video, 0, 0, c.width, c.height);
    const det = await faceapi.detectSingleFace(c, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })).withFaceLandmarks().withFaceDescriptor();
    return det ? det.descriptor : null;
}

function setStatus(el, msg, cls) { el.className = 'status ' + (cls || ''); el.textContent = msg; }
