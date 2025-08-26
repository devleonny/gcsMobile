let anexosProvisorios = {}
let sistemas = {}
let tipos = {}
let prioridades = {}
let empresas = {}
let correcoes = {}
let dados_clientes = {}
let opcoesValidas = {
    solicitante: new Set(),
    executor: new Set(),
    tipoCorrecao: new Set(),
    finalizado: new Set()
}

const labelBotao = (name, nomebase, id, nome) => {
    
    return `
        <label 
        class="campos" 
        name="${name}"
        ${id ? `id="${id}"` : ''}
        onclick="cxOpcoes('${name}', '${nomebase}')">
            ${nome ? nome : 'Selecione'} 
        </label>
    `
}

async function carregarElementosPagina(nomeBase, colunas, tela) {

    overlayAguarde()
    const dados = await recuperarDados(nomeBase)
    const telaInterna = document.querySelector(`.${tela ? tela : 'telaInterna'}`)
    telaInterna.innerHTML = modeloTabela(colunas, nomeBase)
    for (const [id, objeto] of Object.entries(dados)) criarLinha(objeto, id, nomeBase)
    removerOverlay()

}

async function carregarBasesAuxiliares(nomeBase) {
    titulo.textContent = inicialMaiuscula(nomeBase)
    const colunas = ['Nome', '']
    await carregarElementosPagina(nomeBase, colunas, 'telaInferior')
}

async function telaCadastros() {
    esconderMenus()
    titulo.textContent = 'Cadastros'
    const telaInterna = document.querySelector('.telaInterna')
    const bases = ['empresas', 'tipos', 'sistemas', 'prioridades', 'correcoes']
    const acumulado = `
        <div class="painel-cadastro">
            <div class="painel-superior-cadastros">
                ${bases.map(base => `<button onclick="carregarBasesAuxiliares('${base}')">${inicialMaiuscula(base)}</button>`).join('')}
            </div>
            <div class="telaInferior"></div>
        </div>
    `

    telaInterna.innerHTML = acumulado

}

function pararCam() {
    const cameraDiv = document.querySelector('.cameraDiv');
    if (cameraDiv) cameraDiv.style.display = 'none'

    try {
        if (stream) stream.getTracks().forEach(t => t.stop());
        stream = null;
        const video = document.getElementById('video');
        if (!video) return
        video.srcObject = null;
    } catch (err) {
        popup(mensagem(`Falha no plugin: ${err}`))
    }
}

function blocoAuxiliarFotos(fotos) {

    const imagens = Object.entries(fotos)
        .map(([link, foto]) => `<img name="foto" data-salvo="sim" id="${link}" src="${api}/uploads/GCS/${link}" class="foto" onclick="ampliarImagem(this, '${link}')">`)
        .join('')

    const acumulado = `
        <div style="${vertical}; gap: 3px;">
            <div class="fotos">${imagens}</div>
            <div class="capturar" onclick="abrirCamera()">
                <img src="imagens/camera.png" class="olho">
                <span>Capturar Imagem</span>
            </div>
            <div class="cameraDiv">
                <video autoplay playsinline></video>
                <canvas style="display: none;"></canvas>
            </div>
        </div>
    `

    return acumulado
}

async function abrirCamera() {
    const cameraDiv = document.querySelector('.cameraDiv');
    const video = cameraDiv.querySelector('video');

    setInterval(pararCam, 5 * 60 * 1000);

    if (cameraDiv.style.display == 'flex') return tirarFoto() // Caso já esteva visível, tire uma foto;

    try {
        const modo = isAndroid ? { facingMode: { exact: "environment" } } : true
        stream = await navigator.mediaDevices.getUserMedia({ video: modo });
        video.srcObject = stream;
        cameraDiv.style.display = 'flex';

    } catch (err) {
        popup(mensagem('Erro ao acessar a câmera: ' + err.message), 'Alerta', true);
    }
}

function visibilidadeFotos() {
    const fotos = document.querySelector('.fotos')
    const qtd = fotos.querySelectorAll('img')
    fotos.style.display = qtd.length == 0 ? 'none' : 'grid'
}

async function tirarFoto() {

    const fotos = document.querySelector('.fotos')
    const cameraDiv = document.querySelector('.cameraDiv');
    const canvas = cameraDiv.querySelector('canvas');
    const video = cameraDiv.querySelector('video');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const idFoto = ID5digitos()
    const foto = `<img name="foto" id="${idFoto}" src="${canvas.toDataURL('image/png')}" class="foto" onclick="ampliarImagem(this, '${idFoto}')">`
    fotos.insertAdjacentHTML('beforeend', foto)

    visibilidadeFotos()

}

function removerImagem(id) {
    removerPopup()
    const img = document.getElementById(id)
    if (img) img.remove()

    visibilidadeFotos()
}

function ampliarImagem(img, idFoto) {

    const acumulado = `
        <div style="position: relative; background-color: #d2d2d2;">
            <button style="position: absolute; top: 10px; left: 10px;" onclick="removerImagem('${idFoto}')">Remover Imagem</button>
            <img style="width: 95%;" src="${img.src}">
        </div>
    `

    popup(acumulado, 'Imagem', true)

}

function dtAuxOcorrencia(dt) {

    if (!dt || '') return '--'

    const [ano, mes, dia] = dt.split('-')

    return `${dia}/${mes}/${ano}`
}

function confirmarExclusao(idOcorrencia, idCorrecao) {

    const funcao = idCorrecao ? `excluirCorrecao('${idOcorrencia}', '${idCorrecao}')` : `excluirOcorrenciaCorrecao('${idOcorrencia}')`

    const acumulado = `
        <div style="background-color: #d2d2d2; ${horizontal}; padding: 2vw; gap: 1vw;">

            <label>Você tem certeza que deseja excluir?</label>

            ${botao('Confirmar', funcao, 'green')}

        </div>
    
    `
    popup(acumulado, 'ALERTA', true)
}

async function excluirOcorrenciaCorrecao(idOcorrencia, idCorrecao) {

    removerPopup()
    overlayAguarde()
    let ocorrencia = await recuperarDado('dados_ocorrencias', idOcorrencia)

    if (idCorrecao) {
        delete ocorrencia.correcoes[idCorrecao]
        await deletar(`dados_ocorrencias/${idOcorrencia}/correcoes/${idCorrecao}`)
        await inserirDados({ [idOcorrencia]: ocorrencia }, 'dados_ocorrencias')
    } else {
        await deletar(`dados_ocorrencias/${idOcorrencia}`)
        await deletarDB('dados_ocorrencias', idOcorrencia)
    }

    await carregarOcorrencias()

    removerOverlay()

}

async function gerarCorrecoes(idOcorrencia, dadosCorrecoes) {

    const correcoes = await recuperarDados('correcoes')
    let correcoesDiv = ''
    let pagina = 1
    for (const [idCorrecao, recorte] of Object.entries(dadosCorrecoes)) {

        const data = new Date(Number(Object.keys(recorte.datas)[0])).toLocaleString('pt-BR')

        correcoesDiv += `
            <div id="${idOcorrencia}_${pagina}" name="${idCorrecao}" style="${horizontal}; align-items: start; display: ${pagina == 1 ? 'flex' : 'none'}; width: 100%;">

                <div style="${vertical}; gap: 5px; width: 100%;">

                    <div style="${horizontal}; gap: 5px; width: 100%;">
                        ${botaoImg('lapis', `formularioCorrecao('${idOcorrencia}', '${idCorrecao}')`)}
                        ${botaoImg('fechar', `confirmarExclusao('${idOcorrencia}', '${idCorrecao}')`)}
                    </div>

                    ${modeloCampos('Solicitante', `<label style="white-space: nowrap;">${recorte?.solicitante || '??'}</label>`)}
                    ${modeloCampos('Executor', `<label style="white-space: nowrap;">${recorte?.executor || '??'}</label>`)}
                    ${modeloCampos('Status', correcoes?.[recorte?.tipoCorrecao]?.nome || '??')}
                    ${modeloCampos('Início', data)}
                    ${modeloCampos('Descrição', recorte.descricao)}

                </div>

            </div>
            `

        pagina++
    }

    const acumulado = `
        <div style="${vertical}; align-items: center; background-color: white; width: 100%;">
            ${correcoesDiv}

            <div class="paginacao">
                <img onclick="ir(this, 'voltar', '${idOcorrencia}')" src="imagens/esq.png">
                <label>1</label>
                <label>de</label>
                <label>${pagina - 1}</label>
                <img onclick="ir(this, 'avancar', '${idOcorrencia}')" src="imagens/dir.png">
            </div>
        </div>
        `

    return acumulado
}

async function gerenciarCliente(idCliente) {

    const cliente = await recuperarDado('dados_clientes', idCliente)

    console.log(cliente);

    const acumulado = `
        <div class="painelCadastro">
            ${modelo('Nome', cliente.nome)}
            ${modelo('CNPJ', cliente.cnpj)}
            ${modelo('Cidade', cliente.cidade)}
            ${modelo('Endereço', cliente.bairro)}
            ${modelo('Cep', cliente.cep)}
        <div>
    `

    popup(acumulado, 'Gerenciar Cliente')

}

async function criarLinhaOcorrencia(idOcorrencia, ocorrencia) {

    const status = correcoes[ocorrencia?.tipoCorrecao]?.nome || 'Não analisada'
    const linha = `
        <tr id="${idOcorrencia}">
            
            <td style="background-color: white;">
              
                <div style="${vertical}; gap: 5px; width: 100%; position: relative;">

                    <div style="${horizontal}; width: 90%; gap: 5px; padding: 5px;">
                        ${botao('INCLUIR CORREÇÃO', `formularioCorrecao('${idOcorrencia}')`, '#e47a00')}
                        ${botaoImg('lapis', `formularioOcorrencia('${idOcorrencia}')`)}
                        ${botaoImg('fechar', `confirmarExclusao('${idOcorrencia}')`)}
                    </div>

                    ${modeloCampos('Empresa', empresas[ocorrencia?.empresa]?.nome || '--')}
                    ${modeloCampos('Número', idOcorrencia)}
                    ${modeloCampos('Última Correção', status)}
                    ${modeloCampos('Data Registro', ocorrencia?.dataRegistro || '')}
                    ${modeloCampos('Data Limite', dtAuxOcorrencia(ocorrencia?.dataLimiteExecucao))}
                    ${modeloCampos('Solicitante', ocorrencia?.solicitante || '')}
                    ${modeloCampos('Executor', ocorrencia?.executor || '')}
                    ${modeloCampos('Tipo', tipos?.[ocorrencia?.tipo]?.nome || '...')}
                    ${modeloCampos('Unidade', dados_clientes?.[ocorrencia?.unidade]?.nome || '...')}
                    ${modeloCampos('Sistema', sistemas?.[ocorrencia?.sistema]?.nome || '...')}
                    ${modeloCampos('Prioridade', prioridades?.[ocorrencia?.prioridade]?.nome || '...')}
                    ${modeloCampos('Descrição ', ocorrencia?.descricao || '...')}
                    <br>
                </div>

            </td>
            
            ${ocorrencia.correcoes
            ? `<td style="background-color: white;">${await gerarCorrecoes(idOcorrencia, ocorrencia.correcoes)}</td>`
            : `<td style="background-color: #0000005e">
                    <img src="imagens/BG.png" class="img-logo-td">
                </td>`}
        </tr>
    `

    const trExistente = document.getElementById(idOcorrencia)
    if (trExistente) return trExistente.innerHTML = linha

    document.getElementById('body').insertAdjacentHTML('beforeend', linha)
}

async function telaOcorrencias(evitarEsconder) {

    if (!evitarEsconder) esconderMenus()
    overlayAguarde()

    const dados_ocorrencias = await recuperarDados('dados_ocorrencias')
    empresas = await recuperarDados('empresas')
    sistemas = await recuperarDados('sistemas')
    tipos = await recuperarDados('tipos')
    prioridades = await recuperarDados('prioridades')
    correcoes = await recuperarDados('correcoes')
    dados_clientes = await recuperarDados('dados_clientes')

    titulo.textContent = empresas[acesso?.empresa]?.nome || 'Desatualizado'

    const acumulado = `
    
        <div class="tela-ocorrencias">
            <div class="painelBotoes">
                <div class="botoes">
                    <div class="pesquisa">
                        <input oninput="pesquisar(this, 'body')" placeholder="Pesquisar" style="width: 100%;">
                        <img src="imagens/pesquisar2.png">
                    </div>
                    <div style="${horizontal}; gap: 5px;">
                        ${botao('NOVA OCORRÊNCIA', 'formularioOcorrencia()')}
                    </div>
                </div>
                <img class="atualizar" src="imagens/atualizar.png" onclick="atualizarOcorrencias()">
            </div>

            <div class="tabela1">
                <table>
                    <tbody id="body"></tbody>
                </table>
            </div>

            <div class="rodapeTabela"></div>
        </div>
    `

    const telaInterna = document.querySelector('.telaInterna')
    telaInterna.innerHTML = acumulado

    for (const [idOcorrencia, ocorrencia] of Object.entries(dados_ocorrencias).reverse()) {
        await criarLinhaOcorrencia(idOcorrencia, ocorrencia)
    }

    removerOverlay()

}

async function atualizarOcorrencias() {

    overlayAguarde()

    const basesAuxiliares = ['empresas', 'dados_clientes', 'sistemas', 'prioridades', 'correcoes', 'tipos']

    for (const base of basesAuxiliares) {
        await sincronizarDados(base, true)
    }

    let resposta = await baixarOcorrencias()
    let dados_ocorrencias = await recuperarDados('dados_ocorrencias')

    if (acesso.empresa !== '0') {
        for (let [id, ocorrencia] of Object.entries(dados_ocorrencias)) {
            if (ocorrencia.empresa !== acesso.empresa) delete dados_ocorrencias[id]
        }
    }

    resposta = {
        ...dados_ocorrencias,
        ...resposta
    }

    await inserirDados(resposta, 'dados_ocorrencias', true) // True pra resetar o armazenamento;
    await sincronizarSetores()
    titulo.textContent = resposta.empresa

    await telaOcorrencias(true)

    removerOverlay()
}

async function baixarOcorrencias() {

    const timestampOcorrencia = await maiorTimestamp('dados_ocorrencias')

    async function maiorTimestamp(nomeBase) {

        let timestamp = 0
        const dados = await recuperarDados(nomeBase)
        for (const [id, objeto] of Object.entries(dados)) {
            if (objeto.timestamp && objeto.timestamp > timestamp) timestamp = objeto.timestamp
        }

        return timestamp
    }

    return new Promise((resolve, reject) => {
        fetch(`${api}/ocorrencias`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: acesso.usuario, timestampOcorrencia })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => reject(error));

    })
}

async function telaUnidades() {

    esconderMenus()
    titulo.textContent = 'Unidades'
    const colunas = ['CNPJ', 'Cidade', 'Nome', '']
    await carregarElementosPagina('dados_clientes', colunas)
}

async function telaEquipamentos() {

    esconderMenus()
    titulo.textContent = 'Equipamentos'
    const colunas = ['Código', 'Descrição', 'Unidade', 'Modelo', 'Fabricante', '']
    await carregarElementosPagina('dados_composicoes', colunas)
}

async function formularioOcorrencia(idOcorrencia) {

    const oc = idOcorrencia ? await recuperarDado('dados_ocorrencias', idOcorrencia) : {}
    const funcao = idOcorrencia ? `salvarOcorrencia('${idOcorrencia}')` : 'salvarOcorrencia()'

    const acumulado = `
        <div class="painelCadastro">
            ${modelo('Empresa', labelBotao('empresa', 'empresas', oc?.empresa, empresas[oc?.empresa]?.nome))}
            ${modelo('Unidade de Manutenção', labelBotao('unidade', 'dados_clientes', oc?.unidade, dados_clientes[oc?.unidade]?.nome))}
            ${modelo('Sistema', labelBotao('sistema', 'sistemas', oc?.sistema, sistemas[oc?.sistema]?.nome))}
            ${modelo('Prioridade', labelBotao('prioridade', 'prioridades', oc?.prioridade, prioridades[oc?.prioridade]?.nome))}
            ${modelo('Tipo', labelBotao('tipo', 'tipos', oc?.tipo, tipos[oc?.tipo]?.nome))}
            ${modelo('Solicitante', labelBotao('solicitante', 'dados_setores', oc?.solicitante, dados_setores[oc?.solicitante]?.nome_completo))}
            ${modelo('Descrição', `<textarea rows="7" style="width: 100%;" name="descricao" class="campos">${oc?.descricao || ''}</textarea>`)}
            ${modelo('Executor / Responsável', labelBotao('executor', 'dados_setores', oc?.executor, dados_setores[oc?.executor]?.nome_completo))}
            ${modelo('Data Limite para a Execução', `<input name="dataLimiteExecucao" class="campos" type="date" value="${oc?.dataLimiteExecucao || ''}">`)}
            
            <br>
            ${blocoAuxiliarFotos(oc?.fotos || {})}
            <br>

            ${modelo('Anexos', `
                    <label class="campos">
                        Clique aqui
                        <input type="file" style="display: none;" onchange="anexosOcorrencias(this, '${idOcorrencia ? idOcorrencia : 'novo'}')">
                    </label>
                `)}
            <div id="anexos" style="${vertical};">
                ${Object.entries(oc?.anexos || {}).map(([idAnexo, anexo]) => criarAnexoVisual(anexo.nome, anexo.link, `removerAnexo(this, '${idAnexo}', '${idOcorrencia}')`)).join('')}
            </div>

            ${oc?.correcoes
            ? `<hr style="width: 100%;">
                <label>CORREÇÕES</label>
                ${await gerarCorrecoes(idOcorrencia, oc.correcoes, true)}`
            : ''}

        </div>
        <div class="rodape-formulario">
            ${botao('Salvar', funcao)}
            <span style="margin-left: 5vw;" name="timer"></span>
        </div>
   `

    popup(acumulado, 'Gerenciar ocorrência')

    dispararTimer()
    visibilidadeFotos()

}

async function formularioCorrecao(idOcorrencia, idCorrecao) {

    const dados_setores = await recuperarDados('dados_setores')
    const ocorrencia = await recuperarDado('dados_ocorrencias', idOcorrencia)
    const correcoes = await recuperarDados('correcoes')
    const correcao = ocorrencia?.correcoes?.[idCorrecao] || {}
    const funcao = idCorrecao ? `salvarCorrecao('${idOcorrencia}', '${idCorrecao}')` : `salvarCorrecao('${idOcorrencia}')`

    let equipamentos = ''
    for (const [id, equip] of Object.entries(correcao?.equipamentos || {})) equipamentos += await maisLabel(equip)

    const acumulado = `
        <div class="painelCadastro">

            ${modelo('Status da Correção', labelBotao('tipoCorrecao', 'correcoes', correcao?.tipoCorrecao, correcoes[correcao?.tipoCorrecao]?.nome))}        
            ${modelo('Solicitante', labelBotao('solicitante', 'dados_setores', correcao?.solicitante, dados_setores[correcao?.solicitante]?.nome_completo))}
            ${modelo('Executor / Responsável', labelBotao('executor', 'dados_setores', correcao?.executor, dados_setores[correcao?.executor]?.nome_completo))}
            ${modelo('Descrição', `<textarea name="descricao" rows="7" class="campos">${correcao?.descricao || ''}</textarea>`)}

            <div style="${horizontal}; gap: 5px;">
                <label>Equipamentos usados</label>
                <img src="imagens/baixar.png" class="olho" onclick="maisLabel()">
            </div>
            
            <div style="${vertical}; gap: 2px;" id="equipamentos">
                ${equipamentos}
            </div>

            <br>
            ${blocoAuxiliarFotos(correcao?.fotos || {})}
            <br>

            ${modelo('Anexos', `
                    <label class="campos">
                        Clique aqui
                        <input type="file" style="display: none;" onchange="anexosOcorrencias(this, '${idOcorrencia}', '${idCorrecao ? idCorrecao : 'novo'}')">
                    </label>
                `)}

            <div id="anexos" style="${vertical};">
                ${Object.entries(correcao?.anexos || {}).map(([idAnexo, anexo]) => criarAnexoVisual(anexo.nome, anexo.link, `removerAnexo(this, '${idAnexo}', '${idOcorrencia}', '${idCorrecao}')`)).join('')}
            </div>

        </div>
        <div class="rodape-formulario">
            ${botao('Salvar', funcao)}
            <span style="margin-left: 5vw;" name="timer"></span>
        </div>
   `

    popup(acumulado, 'Gerenciar Correção')

    dispararTimer()
    visibilidadeFotos()

}

function dispararTimer() {
    const timer = document.querySelector('[name="timer"]')

    if (timer) {
        setInterval(() => {
            timer.textContent = new Date().toLocaleString('pt-BR')
        }, 1000)
    }
}

async function maisLabel({ codigo, quantidade, unidade } = {}) {

    let div = document.getElementById('equipamentos')
    const opcoes = ['UND', 'METRO', 'CX'].map(op => `<option ${unidade == op ? `selected` : ''}>${op}</option>`).join('')
    const temporario = ID5digitos()
    let nome = 'Selecionar'
    if (codigo) {
        const produto = await recuperarDado('equipamentos', codigo)
        nome = produto.descricao
    }

    const label = `
        <div style="${horizontal}; gap: 5px;">
            <img src="imagens/cancel.png" class="olho" onclick="this.parentElement.remove()">
            <div style="${vertical}; gap: 5px;">
                <label class="campos" name="${temporario}" ${codigo ? `id="${codigo}"` : ''} onclick="cxOpcoes('${temporario}', 'dados_composicoes')">${nome}</label>
                <div style="${horizontal}; gap: 5px; width: 100%;">
                    <input style="width: 100%;" class="campos" type="number" value="${quantidade || ''}">
                    <select class="campos">${opcoes}</select>
                </div>
            </div>
        </div> 
    `
    if (codigo) return label

    div.insertAdjacentHTML('beforeend', label)
}

async function salvarCorrecao(idOcorrencia, idCorrecao) {

    overlayAguarde()

    if (!idCorrecao) idCorrecao = ID5digitos()

    let ocorrencia = await recuperarDado('dados_ocorrencias', idOcorrencia)

    if (!ocorrencia.correcoes) ocorrencia.correcoes = {}

    if (!ocorrencia.correcoes[idCorrecao]) ocorrencia.correcoes[idCorrecao] = {}

    let correcao = ocorrencia.correcoes[idCorrecao]

    Object.assign(correcao, {
        solicitante: obter('solicitante', 'id'),
        executor: obter('executor', 'id'),
        tipoCorrecao: obter('tipoCorrecao', 'id'),
        usuario: acesso.usuario,
        descricao: obter('descricao', 'value')
    })

    const local = await capturarLocalizacao()
    if (isAndroid && !local) return popup(mensagem(`É necessário autorizar o uso do GPS`), 'Alerta', true)

    if (!correcao.datas) correcao.datas = {}
    const data = new Date().getTime()
    correcao.datas[data] = {
        latitude: local.latitude,
        longitude: local.longitude
    }

    correcao.anexos = {
        ...correcao.anexos,
        ...anexosProvisorios
    }

    const fotos = document.querySelector('.fotos')
    const imgs = fotos.querySelectorAll('img')
    if (imgs.length > 0) {
        if (!correcao.fotos) correcao.fotos = {}
        for (const img of imgs) {
            if (img.dataset && img.dataset.salvo == 'sim') continue
            const foto = await importarAnexos({ foto: img.src })
            correcao.fotos[foto[0].link] = foto[0]
        }
    }

    const equipamentos = document.getElementById('equipamentos')

    if (equipamentos) {

        const divs = equipamentos.querySelectorAll('div')
        correcao.equipamentos = {}

        for (const div of divs) {

            const campos = div.querySelectorAll('.campos')
            const idEquip = ID5digitos()
            correcao.equipamentos[idEquip] = {
                quantidade: Number(campos[0].value),
                unidade: campos[1].value,
                codigo: campos[2].id
            }
        }
    }

    ocorrencia.tipoCorrecao = correcao.tipoCorrecao // Atualiza no objeto principal também;

    await enviar(`dados_ocorrencias/${idOcorrencia}/correcoes/${idCorrecao}`, correcao)
    await enviar(`dados_ocorrencias/${idOcorrencia}/tipoCorrecao`, correcao.tipoCorrecao)
    await inserirDados({ [idOcorrencia]: ocorrencia }, 'dados_ocorrencias')
    await criarLinhaOcorrencia(idOcorrencia, ocorrencia)

    anexosProvisorios = {}
    removerPopup()

}

function ir(img, acao, idOcorrencia) {
    const tabelas = document.querySelectorAll(`[id^='${idOcorrencia}_']`)
    const paginaAtual = img.closest('div').querySelectorAll('label')[0]
    if (!paginaAtual) return

    const numeroAtual = Number(paginaAtual.textContent)
    const proximoNumero = acao === 'avancar' ? numeroAtual + 1 : numeroAtual - 1
    const novaPagina = document.querySelectorAll(`[id=${idOcorrencia}_${proximoNumero}]`)
    if (!novaPagina[0] || novaPagina.length == 0) return

    for (const tabela of tabelas) tabela.style.display = 'none'
    novaPagina.forEach(pag => pag.style.display = 'flex')
    paginaAtual.textContent = proximoNumero

}

function obter(name, propriedade) {
    const elemento = document.querySelector(`[name=${name}]`)
    return elemento[propriedade] ? elemento[propriedade] : ''
}

async function salvarOcorrencia(idOcorrencia) {

    overlayAguarde()

    try {

        const campos = ['unidade', 'sistema', 'empresa', 'prioridade', 'tipo', 'solicitante', 'executor']
        let ocorrencia = idOcorrencia ? await recuperarDado('dados_ocorrencias', idOcorrencia) : {}

        for (const campo of campos) {
            const resultado = obter(campo, 'id')

            if (resultado == '') return popup(mensagem(`Preencha o campo ${inicialMaiuscula(campo)}`), 'ALERTA', true)

            ocorrencia[campo] = resultado
        }

        ocorrencia.anexos = {
            ...ocorrencia.anexos,
            ...anexosProvisorios
        }
        ocorrencia.usuario = acesso.usuario
        ocorrencia.dataRegistro = new Date().toLocaleString('pt-BR')
        ocorrencia.dataLimiteExecucao = obter('dataLimiteExecucao', 'value')
        ocorrencia.descricao = obter('descricao', 'value')

        if (!ocorrencia.fotos) ocorrencia.fotos = {}

        const fotos = document.querySelector('.fotos')
        const imgs = fotos.querySelectorAll('img')
        if (imgs.length > 0) {
            for (const img of imgs) {
                if (img.dataset && img.dataset.salvo == 'sim') continue
                const foto = await importarAnexos({ foto: img.src })
                ocorrencia.fotos[foto[0].link] = foto[0]
            }
        }

        removerPopup()

        if (idOcorrencia) {
            await inserirDados({ [idOcorrencia]: ocorrencia }, 'dados_ocorrencias')
            await enviar(`dados_ocorrencias/${idOcorrencia}`, ocorrencia)
            await criarLinhaOcorrencia(idOcorrencia, ocorrencia)
        } else {
            await enviar('dados_ocorrencias/0000', ocorrencia)
            await atualizarOcorrencias()
        }

    } catch (err) {
        popup(mensagem(err), 'Alerta', true)
    }

    anexosProvisorios = {}

}

async function dashboard(dadosFiltrados, evitarEsconder) {

    if (!evitarEsconder) esconderMenus()
    overlayAguarde()

    const dados_ocorrencias = dadosFiltrados ? dadosFiltrados : await recuperarDados('dados_ocorrencias')
    const dados_clientes = await recuperarDados('dados_clientes')
    const correcoes = await recuperarDados('correcoes')

    let linhas = ''
    let contador = {
        abertos: 0,
        atrasados: 0,
        finalizados: 0
    }

    const totalOcorrencias = Object.keys(dados_ocorrencias).length

    const balao = (valor1, valor2) => `
        <div class="balaoOcorrencias">
            <div class="balaoSolicitante">${valor1 || '--'}</div>
            <div class="balaoExecutor">${valor2 || '--'}</div>
        </div>
    `

    for (const [idOcorrencia, ocorrencia] of Object.entries(dados_ocorrencias)) {

        let dtTermino = ''
        let baloes = ''

        for (const [idCorrecao, correcao] of Object.entries(ocorrencia?.correcoes || {})) {
            if (correcao.dataTermino !== '') dtTermino = correcao.dataTermino

            const solicitante = correcao?.solicitante || 'Em Branco'
            const executor = correcao?.executor || 'Em Branco'

            baloes += balao(solicitante, executor)

            if (!opcoesValidas.solicitante[solicitante]) opcoesValidas.solicitante[solicitante] = solicitante
            if (!opcoesValidas.executor[executor]) opcoesValidas.executor[executor] = executor

        }

        if (!ocorrencia.correcoes) baloes += balao('--', '--')

        const dias = diferencaEmDias(ocorrencia.dataLimiteExecucao, dtTermino)

        if (dias > 0 && dtTermino !== '') {
            contador.finalizados++
        } else if (dias < 0 && dtTermino !== '') {
            contador.atrasados++
        } else if (dtTermino == '') {
            contador.abertos++
        }

        const tipoCorrecao = ocorrencia?.tipoCorrecao || 'Em Branco'
        const nomeCorrecao = correcoes?.[tipoCorrecao]?.nome || 'Em Branco'

        if (!opcoesValidas.tipoCorrecao[tipoCorrecao]) opcoesValidas.tipoCorrecao[tipoCorrecao] = nomeCorrecao

        const statusFinalizacao = dias == 0 ? 'Em Aberto' : dias > 0 ? 'Finalizados no Prazo' : 'Atrasados'
        if (!opcoesValidas.finalizado[statusFinalizacao]) opcoesValidas.finalizado[statusFinalizacao] = statusFinalizacao

        linhas += `
            <tr>
                <td>${idOcorrencia}</td>
                <td>${dados_clientes?.[ocorrencia?.unidade]?.nome || '...'}</td>
                <td>${ocorrencia.dataRegistro.split(',')[0]}</td>
                <td>${dtAuxOcorrencia(ocorrencia.dataLimiteExecucao)}</td>
                <td>${dtAuxOcorrencia(dtTermino)}</td>
                <td style="text-align: center;">
                    <label class="${dias < 0 ? 'negativo' : ''}">${dias}</label>
                </td>
                <td>${nomeCorrecao}</td>
                <td>
                    <div style="${vertical}; gap: 2px;">
                        ${baloes}
                    </div>
                </td>
                <td style="text-align: center;">
                    <img src="imagens/pesquisar2.png" onclick="formularioOcorrencia('${idOcorrencia}')">
                </td>
            </tr>
        `
    }

    let cabecalho = { th: '', thPesquisa: '' }
    const colunas = ['Chamado', 'Loja', 'Data Abertura', 'Data Limite', 'Data Execução', 'Dias', 'Status Correção', 'Solicitante > Executor', '']
        .map(op => {
            cabecalho.th += `<th>${op}</th>`
        })

    const totaisLabel = (porc, texto, total, cor) => `
        <div class="totalBox" style="background-color: ${cor ? cor : '#222'};">
            <label>${porc}</label>
            <label>${texto}</label>
            <label><strong>${total}</strong></label>
        </div>
    `

    const modelo = (titulo, html, name) => {

        html = html ? html : `
            <label class="campos" onclick="caixaOpcoesRelatorio('${name}')">Selecionar</label>
            <br>
            <div name="${name}"></div>
        `
        const bloco = `
            <div class="blocoFiltro">
                <label>${titulo}</label>
                ${html}
            </div>
       `
        return bloco
    }

    const porcentagem = (valor) => `${((valor / totalOcorrencias) * 100).toFixed(0)}%`

    const tabela = `
        <div class="tabelaRelatorio">
            <table class="tabela">
                <thead>
                    <tr>${cabecalho.th}</tr>
                </thead>
                <tbody id="bodyOcorrencias">${linhas}</tbody>
            </table>
        </div>
    `

    const acumulado = `

        <div class="tela-dashboard">

            <div class="painelBotoes">
                <div class="tituloDashboard"><label>Relatório de Chamados</label></div>
                <div class="pesquisa">
                    <input oninput="pesquisar(this, 'bodyOcorrencias')" placeholder="Pesquisar" style="width: 100%;">
                    <img src="imagens/pesquisar2.png">
                </div>
            </div>

            <div class="painel-dashboard">
                <div class="painel-dashboard-1">
                    ${modelo('Dt Início & Término', `
                        <input class="campos" type="date">
                        <input class="campos" type="date">
                        `)}
                    ${modelo('Solicitante', false, 'solicitante')}
                    ${modelo('Executor', false, 'executor')}
                    ${modelo('Status da Correção', false, 'tipoCorrecao')}
                    ${modelo('Status de Finalização', false, 'finalizado')}
                </div>
                <div class="painel-dashboard-2">
                    ${totaisLabel('', 'Total de Chamados', Object.entries(dados_ocorrencias).length, '#00563f')}
                    ${totaisLabel(porcentagem(contador.finalizados), 'Finalizados no Prazo', contador.finalizados, 'green')}
                    ${totaisLabel(porcentagem(contador.abertos), 'Em Aberto', contador.abertos, '#a28409')}
                    ${totaisLabel(porcentagem(contador.atrasados), 'Atrasados', contador.atrasados, '#B12425')}
                </div>
                ${tabela}
            </div>

        </div>
        <div class="rodapeTabela"></div>
    `

    removerOverlay()

    const tabelaRelatorio = document.querySelector('.tabelaRelatorio')
    if (tabelaRelatorio) return tabelaRelatorio.innerHTML = tabela

    const telaInicial = document.querySelector('.telaInterna')
    telaInicial.innerHTML = acumulado

}

function diferencaEmDias(data1, data2) {

    if (data1 == '' || data2 == '') return 0
    const dt1 = new Date(data1)
    const dt2 = new Date(data2)

    const diffMs = dt1 - dt2
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    return diffDias
}

async function caixaOpcoesRelatorio(name) {

    let base = opcoesValidas[name]

    const bloco = document.querySelector(`[name='${name}']`)
    const permitidos = []
    if (bloco) {
        const labels = bloco.querySelectorAll('label')
        for (const label of labels) if (!permitidos.includes(label.id)) permitidos.push(label.id)
    }

    let opcoesDiv = `
        <div class="atalhosRelatorio">
            <input type="checkbox" onclick="marcarTodosVisiveis(this, 'itensFiltro')">
            <label>Todos</label>
        </div>
    `

    for ([cod, dado] of Object.entries(base)) {

        opcoesDiv += `
            <div name="camposOpcoes" class="atalhosRelatorio">
                <input ${permitidos.includes(cod) ? 'checked' : ''} name="itensFiltro" id="${cod}" type="checkbox">
                <label id="${cod}">${dado}</label>
            </div>`
    }

    const acumulado = `
        <div class="cabecalho-pesquisa">

            <div class="pesquisa">
                <input oninput="pesquisarOp(this)" placeholder="Pesquisar" style="width: 100%;">
                <img src="imagens/pesquisar2.png">
            </div>

            <button onclick="filtrarRelatorio('${name}')">Confirmar</button>
            
        </div>
        <div style="padding: 1vw; gap: 5px; ${vertical}; background-color: #d2d2d2; max-height: 40vh; height: max-content; overflow-y: auto; overflow-x: hidden;">
            ${opcoesDiv}
        </div>
    `

    popup(acumulado, 'Selecione o item', true)

}

function pesquisarOp(input, tituloAtual) {

    const termoPesquisa = String(input.value).toLowerCase()

    const divs = document.querySelectorAll(`[name=${tituloAtual ? `psq_${tituloAtual}` : 'camposOpcoes'}]`)

    for (const div of divs) {

        const termoDiv = String(div.textContent).toLocaleLowerCase()

        div.style.display = (termoDiv.includes(termoPesquisa) || termoPesquisa == '') ? '' : 'none'
    }
}

function marcarTodosVisiveis(input, tituloAtual) {

    let inputs = document.querySelectorAll(`[name='${tituloAtual}']`)

    inputs.forEach((inputTab, i) => {

        const div = inputTab.parentElement
        const marcar = div.style.display !== 'none'
        if (marcar) inputTab.checked = input.checked

    })

}

async function filtrarRelatorio(nameBloco) {

    let bloco = document.querySelector(`[name='${nameBloco}']`)

    console.log(nameBloco);


    if (bloco) {

        bloco.innerHTML = ''
        const checkboxes = document.querySelectorAll(`[name='itensFiltro']`)

        for (const input of checkboxes) {

            if (input.checked) {
                const labels = input.parentElement.querySelectorAll('label')
                const item = `
                    <label name="${nameBloco}_filtros" id="${labels[0].id}" class="itemFiltro">
                        <img src="imagens/cancel.png" onclick="this.parentElement.remove(); processarFiltros()">
                        <span>${labels[0].textContent}</span>
                    </label>
                `
                bloco.insertAdjacentHTML('beforeend', item)
            }
        }
    }

    await processarFiltros()
    removerPopup()
}

async function processarFiltros() {

    let dados_ocorrencias = await recuperarDados('dados_ocorrencias')
    let dadosFiltrados = {}

    let permitidos = {
        solicitante: [],
        executor: [],
        tipoCorrecao: [],
        finalizado: []
    }

    for (let [nameBloco, objeto] of Object.entries(permitidos)) {
        const bloco = document.querySelector(`[name='${nameBloco}']`)

        if (bloco) {
            const labels = bloco.querySelectorAll('label')
            for (const label of labels) if (!objeto.includes(label.id)) objeto.push(label.id)
        }
    }

    const vazio = () => {

        let estaVazio = true
        for (const [name, lista] of Object.entries(permitidos)) {
            if (lista.length > 0) estaVazio = false
        }

        return estaVazio
    }

    const filtrado = (lista1, lista2) => {

        let exibir = true
        for (const item of lista1) {
            if (!lista2.includes(item)) exibir = false
        }

        return exibir
    }

    for (const [idOcorrencia, ocorrencia] of Object.entries(dados_ocorrencias)) {

        let campos = {
            solicitante: new Set(),
            executor: new Set(),
            tipoCorrecao: new Set(),
            finalizado: new Set()
        }

        let dtTermino = ''
        for (const [idCorrecao, correcao] of Object.entries(ocorrencia?.correcoes || {})) {
            if (correcao.dataTermino !== '') dtTermino = correcao.dataTermino

            campos.solicitante.add(correcao?.solicitante || 'Em Branco')
            campos.executor.add(correcao?.executor || 'Em Branco')
            campos.tipoCorrecao.add(correcao?.tipoCorrecao || 'Em Branco')
        }

        const dias = diferencaEmDias(ocorrencia.dataLimiteExecucao, dtTermino)
        const statusFinalizacao = dias == 0 ? 'Em Aberto' : dias > 0 ? 'Finalizados no Prazo' : 'Atrasados'
        campos.finalizado.add(statusFinalizacao)

        if (!ocorrencia.correcoes) {
            campos.solicitante.add('Em Branco')
            campos.executor.add('Em Branco')
            campos.tipoCorrecao.add('Em Branco')
        }

        let permSolicitante = filtrado(permitidos.solicitante, [...campos.solicitante])
        let permExecutor = filtrado(permitidos.executor, [...campos.executor])
        let permCorrecao = filtrado(permitidos.tipoCorrecao, [...campos.tipoCorrecao])
        let permFinalizado = filtrado(permitidos.finalizado, [...campos.finalizado])

        if ((permSolicitante && permExecutor && permCorrecao && permFinalizado) || vazio()) {
            dadosFiltrados[idOcorrencia] = ocorrencia
        }

    }

    await dashboard(dadosFiltrados, true)

    removerOverlay()

}