let usuarioLogado = {}
async function loadModels() {
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
}

async function computeDescriptorFromImage(img) {
    const det = await faceapi
        .detectSingleFace(img, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();
    return det ? det.descriptor : null;
}

async function grabLiveDescriptor() {
    const video = document.getElementById('video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const det = await faceapi
        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

    return det ? det.descriptor : null;
}

async function telaRegistroPonto() {

    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'))

    if (usuarioLogado && usuarioLogado.pin && usuarioLogado.nome) {
        return verificarColaborador(usuarioLogado.pin, usuarioLogado.nome)
    }

    const acumulado = `
        <div style="${vertical}">
            <div class="botaoSuperiorLogin" onclick="telaLogin()">
                <img src="imagens/cracha.png">
                <span>Voltar para a tela de Acesso</span>
            </div>
            <div class="loginBloco">
                <span>Informe o seu PIN de 4 dígitos</span>
                <input type="text" maxlength="4" name="pin" placeholder="Máximo de 4 dígitos">
                <button onclick="verificarColaborador()">Avançar</butto>
            </div>
        </div>
    `

    tela.innerHTML = acumulado

}

async function verificarColaborador(pinSalvo, nomeSalvo) {

    overlayAguarde()
    const pin = document.querySelector('[name="pin"]')

    const resposta = await colaboradorPin(pinSalvo ? pinSalvo : pin.value)

    if (resposta.mensagem) return popup(mensagem(resposta.mensagem), 'Alerta', true)

    if (pinSalvo && !resposta.nome == nomeSalvo) {
        localStorage.removeItem('usuarioLogado')
        await telaRegistroPonto()
        popup(mensagem('Usuário logado sofreu altereções e será necessário reinformar o PIN.'), 'Alerta')
    }

    const fotoUrl = `${api}/uploads/RECONST/${resposta.foto}`

    usuarioLogado = {
        pin: pinSalvo ? pinSalvo : pin.value,
        idColaborador: resposta.idColaborador,
        nome: resposta.nome
    }

    removerOverlay()
    await validarFacial(fotoUrl)

}

async function colaboradorPin(pin) {
    try {

        const url = `${api}/colaborador`
        const requisicao = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ pin, servidor: 'RECONST' })
        };

        const response = await fetch(url, requisicao);

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (err) {
        return { err };
    }
}

let refDescriptor = null;

function mostrarStatus(msg, cls) {
    const liveStatus = document.getElementById('liveStatus');
    liveStatus.textContent = msg;
    liveStatus.className = 'status ' + (cls || '');
}

async function validarFacial(fotoUrl) {
    const acumulado = `
        <div class="wrap">
            <div class="card">
                <div class="row" style="justify-content:space-between;margin-bottom:8px">
                    <div class="row">
                        <button onclick="iniciarCam()" class="btn">Iniciar câmera</button>
                        <button onclick="pararCam()" class="btn ghost" id="stopBtn" disabled>Parar</button>
                    </div>
                    <button onclick="baterPonto()" class="btn" id="checkInBtn" disabled>Bater ponto</button>
                </div>
                <video id="video" autoplay muted playsinline></video>
                <canvas style="display:none;"></canvas>
                <div id="liveStatus" class="status muted">Câmera parada</div>
            </div>
        </div>
    `;
    tela.innerHTML = acumulado;

    await loadModels();

    const refImg = new Image();
    refImg.crossOrigin = "anonymous"; // garante que seja carregada sem problemas de CORS
    refImg.src = fotoUrl;

    refImg.onload = async () => {
        mostrarStatus('Processando referência…', 'warn');
        refDescriptor = await computeDescriptorFromImage(refImg);
        if (!refDescriptor) {
            mostrarStatus('Nenhum rosto detectado na foto', 'err');
        } else {
            mostrarStatus('Referência pronta', 'ok');
            document.getElementById('checkInBtn').disabled = !stream;
        }
    };

    refImg.onerror = () => {
        mostrarStatus('Erro ao carregar a foto de referência', 'err');
    };
}

async function iniciarCam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        const video = document.getElementById('video');
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        mostrarStatus('Câmera ativa', 'ok');
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('checkInBtn').disabled = !refDescriptor;
    } catch {
        mostrarStatus('Falha ao iniciar câmera', 'err');
    }
}

function pararCam() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    const video = document.getElementById('video');
    video.srcObject = null;
    mostrarStatus('Câmera parada', 'warn');
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('checkInBtn').disabled = true;
}

async function baterPonto() {
    if (!refDescriptor) {
        mostrarStatus('Sem referência facial', 'err');
        return;
    }
    if (!stream) {
        mostrarStatus('Câmera não iniciada', 'err');
        return;
    }

    mostrarStatus('Verificando…', 'warn');
    const liveDesc = await grabLiveDescriptor();
    if (!liveDesc) {
        mostrarStatus('Rosto não detectado no vídeo', 'err');
        return;
    }

    const dist = faceapi.euclideanDistance(refDescriptor, liveDesc);
    const ok = dist <= 0.5;

    if (ok) {
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado))
        pararCam()
        telaLogin()
        popup(mensagem('Registro realizado com sucesso!'), 'Alerta')
    } else {
        mostrarStatus(`Negado (dist ${dist.toFixed(4)})`, 'err');
    }

}
