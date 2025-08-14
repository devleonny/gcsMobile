const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

async function loadModels() {
    const MODEL_URL = '/models';
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
}

async function telaRegistroPonto() {

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

async function verificarColaborador() {

    overlayAguarde()
    const pin = document.querySelector('[name="pin"]')

    const resposta = await colaboradorPin(pin.value)

    if (resposta.mensagem) return popup(mensagem(resposta.mensagem), 'Alerta', true)

    const fotoUrl = `${api}/uploads/RECONST/${resposta}`;
    
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

function mostrarStatus(mensagem) {
    const liveStatus = document.getElementById('liveStatus')
    liveStatus.textContent = mensagem
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
                    <button onclick="baterPonto()" class="btn" id="checkInBtn">Bater ponto</button>
                </div>
                <video id="video" autoplay muted playsinline></video>
                <canvas style="display: none;"></canvas>
                <div id="liveStatus" class="status muted">Câmera parada</div>
            </div>
        </div>
    `;
    tela.innerHTML = acumulado;

    await loadModels();

    // carregar referência facial da foto enviada
    const refImg = new Image();
    refImg.src = `${fotoUrl}`;
    refImg.onload = async () => {
       mostrarStatus('Processando referência…');
        refDescriptor = await computeDescriptorFromImage(refImg);
        if (!refDescriptor) {
            mostrarStatus('Nenhum rosto detectado na foto');
        } else {
            mostrarStatus('Referência pronta');
            document.getElementById('checkInBtn').disabled = !stream;
        }
    };
}

// variáveis compartilhadas
let refDescriptor = null;

async function iniciarCam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        const video = document.getElementById('video');
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        mostrarStatus('Câmera ativa');
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('checkInBtn').disabled = !refDescriptor;
    } catch {
        mostrarStatus('Falha ao iniciar câmera');
    }
}

function pararCam() {
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }
    document.getElementById('video').srcObject = null;
    mostrarStatus('Câmera parada')
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('checkInBtn').disabled = true;
}

async function baterPonto() {
    if (!refDescriptor) {
        mostrarStatus('Sem referência facial', 'err');
        return;
    }
    mostrarStatus('Verificando…');
    const liveDesc = await grabLiveDescriptor();
    if (!liveDesc) {
        mostrarStatus('Rosto não detectado no vídeo');
        return;
    }
    const dist = faceapi.euclideanDistance(refDescriptor, liveDesc);
    const ok = dist <= 0.5; // threshold fixo
    mostrarStatus(
        ok ? `Autorizado (dist ${dist.toFixed(4)})` : `Negado (dist ${dist.toFixed(4)})`,
        ok ? 'ok' : 'err'
    );
}
