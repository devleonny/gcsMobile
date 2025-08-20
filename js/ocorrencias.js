let anexosProvisorios = {}
let sistemas = {}
let tipos = {}
let prioridades = {}
let empresas = {}
let correcoes = {}
let dados_clientes = {}

const labelBotao = (name, nomebase, id, nome) => {

    return `
        <div style="${horizontal}; justify-content: start; gap: 5px;">
            <span class="fechar" onclick="removerCampo(this)">×</span>
            <label 
            class="campos" 
            name="${name}"
            ${id ? `id="${id}"` : ''} 
            onclick="cxOpcoes('${name}', '${nomebase}')">
                ${nome ? nome : 'Selecione'} 
            </label>
        </div>
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
        <div class="painel-superior-cadastros">
            ${bases.map(base => `<button onclick="carregarBasesAuxiliares('${base}')">${inicialMaiuscula(base)}</button>`).join('')}
        </div>
        <br>
        <div class="telaInferior"></div>
    `

    telaInterna.innerHTML = acumulado

}

function dtAuxOcorrencia(dt) {

    if (!dt || '') return '--'

    const [ano, mes, dia] = dt.split('-')

    return `${dia}/${mes}/${ano}`
}

async function gerarCorrecoes(idOcorrencia, dadosCorrecoes, ativarRelatorio) {

    const correcoes = await recuperarDados('correcoes')
    let correcoesDiv = ''
    let pagina = 1
    for (const [idCorrecao, recorte] of Object.entries(dadosCorrecoes)) {

        correcoesDiv += `
            <div id="${idOcorrencia}_${pagina}" name="${idCorrecao}" style="${horizontal}; align-items: start; display: ${pagina == 1 ? 'flex' : 'none'}; width: 100%;">

                <div style="${vertical}; gap: 5px; width: ${ativarRelatorio ? '50%' : '100%'};">

                    <div style="${horizontal}; justify-content: right; gap: 5px; width: 100%;">
                        ${botaoImg('lapis', `formularioCorrecao('${idOcorrencia}', '${idCorrecao}')`)}
                        ${botaoImg('fechar', `confirmarExclusao('${idOcorrencia}', '${idCorrecao}')`)}
                    </div>

                    ${modeloCampos('Solicitante > Executor', `<label style="white-space: nowrap;">${recorte?.solicitante || '??'} > ${recorte?.executor || '??'}</label>`)}
                    ${modeloCampos('Status Correção', correcoes?.[recorte?.tipoCorrecao]?.nome || '??')}
                    ${modeloCampos('Início', dtAuxOcorrencia(recorte.dataInicio))}
                    ${modeloCampos('Término', dtAuxOcorrencia(recorte.dataTermino))}
                    ${modeloCampos('Descrição', recorte.descricao)}
                </div>

                ${ativarRelatorio
                ? `<div id="${idCorrecao}" class="fundoTec">
                        <div style="${horizontal}; gap: 5px;">
                            <img src="gifs/loading.gif" style="width: 5vw;">
                            <label>Carregando...</label>
                        </div>
                    </div>`
                : ''}

            </div>
            `

        pagina++
    }

    const acumulado = `
        <div style="${vertical}; align-items: center; background-color: white; width: 100%;">
            ${correcoesDiv}

            <div style="${horizontal}; gap: 5px; margin-bottom: 1vh; margin-top: 1vh;">
                <img onclick="ir(this, 'voltar', '${idOcorrencia}')" src="imagens/esq.png" style="width: 1.5vw; cursor: pointer;">
                <label>1</label>
                <label>de</label>
                <label>${pagina - 1}</label>
                <img onclick="ir(this, 'avancar', '${idOcorrencia}')" src="imagens/dir.png" style="width: 1.5vw; cursor: pointer;">
            </div>
        </div>
        `

    return acumulado
}

async function criarLinhaOcorrencia(idOcorrencia, ocorrencia) {

    const status = correcoes[ocorrencia?.tipoCorrecao]?.nome || 'Não analisada'
    const linha = `
        <tr id="${idOcorrencia}">
            
            <td style="background-color: white;">
              
                <div style="${vertical}; gap: 5px; width: 100%; position: relative;">

                    <div style="${horizontal}; justify-content: end; width: 90%; gap: 5px; padding: 5px;">
                        ${botao('Incluir Correção', `formularioCorrecao('${idOcorrencia}')`, '#e47a00')}
                        ${botaoImg('lapis', `formularioOcorrencia('${idOcorrencia}')`)}
                        ${botaoImg('fechar', `confirmarExclusao('${idOcorrencia}')`)}
                    </div>

                    ${modeloCampos('Última Correção', status)}
                    ${modeloCampos('Data Registro', ocorrencia?.dataRegistro || '')}
                    ${modeloCampos('Quem abriu', ocorrencia?.solicitante || '')}
                    ${modeloCampos('Dt Limt Execução', dtAuxOcorrencia(ocorrencia?.dataLimiteExecucao))}
                    ${modeloCampos('Número', idOcorrencia)}
                    ${modeloCampos('Tipo', tipos?.[ocorrencia?.tipo]?.nome || '...')}
                    ${modeloCampos('Und Manutenção', dados_clientes?.[ocorrencia?.unidade]?.nome || '...')}
                    ${modeloCampos('Sistema', sistemas?.[ocorrencia?.sistema]?.nome || '...')}
                    ${modeloCampos('Prioridade', prioridades?.[ocorrencia?.prioridade]?.nome || '...')}
                    ${modeloCampos('Descrição ', ocorrencia?.descricao || '...')}
                    <br>
                </div>

            </td>
            
            ${ocorrencia.correcoes
            ? `<td style="background-color: white;">${await gerarCorrecoes(idOcorrencia, ocorrencia.correcoes)}</td>`
            : `<td>
                    <div style="${horizontal}; border-radius: 3px;">
                        <img src="imagens/BG.png" class="img-logo-td">
                    </div>
                </td>`}
        </tr>
    `

    const trExistente = document.getElementById(idOcorrencia)
    if (trExistente) return trExistente.innerHTML = linha

    document.getElementById('body').insertAdjacentHTML('beforeend', linha)
}

async function telaOcorrencias() {

    esconderMenus()
    overlayAguarde()

    const dados_ocorrencias = await recuperarDados('dados_ocorrencias')
    empresas = await recuperarDados('empresas')
    sistemas = await recuperarDados('sistemas')
    tipos = await recuperarDados('tipos')
    prioridades = await recuperarDados('prioridades')
    correcoes = await recuperarDados('correcoes')
    dados_clientes = await recuperarDados('dados_clientes')

    titulo.textContent = empresas[acesso.empresa].nome

    const acumulado = `
    
        <div style="${vertical};">
            <div class="painelBotoes">
                <div class="botoes">
                    <div class="pesquisa">
                        <input oninput="pesquisar(this, 'body')" placeholder="Pesquisar" style="width: 100%;">
                        <img src="imagens/pesquisar2.png">
                    </div>
                    <div style="${horizontal}; gap: 5px;">
                        ${botao('Nova Ocorrência', 'formularioOcorrencia()')}
                    </div>
                    <img class="atualizar" src="imagens/atualizar.png" onclick="atualizarOcorrencias()">
                </div>
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

    const basesAuxiliares = ['empresas', 'sistemas', 'prioridades', 'correcoes', 'tipos']

    for (const base of basesAuxiliares) await sincronizarDados(base, true)

    const resposta = await baixarOcorrencias()
    await sincronizarSetores()
    await inserirDados(resposta.ocorrencias, 'dados_ocorrencias', resposta.resetar)
    await inserirDados(resposta.clientes, 'dados_clientes', resposta.resetar)
    titulo.textContent = resposta.empresa
    acesso = await recuperarDado('lista_setores', acesso.usuario)

    removerOverlay()
}

async function baixarOcorrencias() {

    const timestampOcorrencia = await maiorTimestamp('dados_ocorrencias')
    const timestampCliente = await maiorTimestamp('dados_clientes')

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
            body: JSON.stringify({ usuario: acesso.usuario, timestampOcorrencia, timestampCliente })
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

            ${modelo('Unidade de Manutenção', labelBotao('unidade', 'dados_clientes', oc?.unidade, dados_clientes[oc?.unidade]?.nome))}
            ${modelo('Sistema', labelBotao('sistema', 'sistemas', oc?.sistema, sistemas[oc?.sistema]?.nome))}
            ${modelo('Prioridade', labelBotao('prioridade', 'prioridades', oc?.prioridade, prioridades[oc?.prioridade]?.nome))}
            ${modelo('Tipo', labelBotao('tipo', 'tipos', oc?.tipo, tipos[oc?.tipo]?.nome))}
            ${modelo('Solicitante', labelBotao('solicitante', 'dados_setores', oc?.solicitante, dados_setores[oc?.solicitante]?.nome_completo))}
            ${modelo('Descrição', `<textarea rows="7" style="width: 100%;" name="descricao" class="campos">${oc?.descricao || ''}</textarea>`)}
            ${modelo('Executor / Responsável', labelBotao('executor', 'dados_setores', oc?.executor, dados_setores[oc?.executor]?.nome_completo))}
            ${modelo('Data / Hora', `<label class="campos">${new Date().toLocaleString('pt-BR')}</label>`)}
            ${modelo('Data Limite para a Execução', `<input name="dataLimiteExecucao" class="campos" type="date" value="${oc?.dataLimiteExecucao || ''}">`)}
            ${modelo('Anexos', `
                    <label class="campos">
                        Clique aqui
                        <input type="file" style="display: none;" onchange="anexosOcorrencias(this, '${idOcorrencia ? idOcorrencia : 'novo'}')">
                    </label>
                `)}
            <div id="anexos" style="${vertical};">
                ${Object.entries(oc?.anexos || {}).map(([idAnexo, anexo]) => criarAnexoVisual(anexo.nome, anexo.link, `removerAnexo(this, '${idAnexo}', '${idOcorrencia}')`)).join('')}
            </div>

            ${oc.correcoes
            ? `<hr style="width: 100%;">
                <label>CORREÇÕES</label>
                ${await gerarCorrecoes(idOcorrencia, oc.correcoes, true)}`
            : ''}

        </div>
        <div style="${horizontal}; justify-content: start; background-color: #a0a0a0ff; padding: 5px; gap: 1vw;">
            ${botao('Salvar', funcao)}
        </div>
   `

    popup(acumulado, 'Gerenciar ocorrência')

    carregarRoteiro(idOcorrencia, Object.keys(oc?.correcoes || {})[0])

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

            ${modelo('Status da Correção', labelBotao('tipoCorrecao', 'correcoes', correcoes?.tipoCorrecao, correcoes[correcao?.tipoCorrecao]?.nome))}
            ${modelo('Data/Hora', `
                    <input name="dataInicio" class="campos" type="date" value="${correcao?.dataInicio || ''}">
                    <input name="horaInicio" class="campos" type="time" value="${correcao?.horaInicio || ''}">
                `)}
            ${modelo('Término', `
                    <input name="dataTermino" class="campos" type="date" value="${correcao?.dataTermino || ''}">
                    <input name="horaTermino" class="campos" type="time" value="${correcao?.horaTermino || ''}">
                `)}
        
            ${modelo('Solicitante', labelBotao('solicitante', 'dados_setores', correcao?.solicitante, dados_setores[correcao?.solicitante]?.nome_completo))}
            ${modelo('Executor / Responsável', labelBotao('executor', 'dados_setores', correcao?.executor, dados_setores[correcao?.executor]?.nome_completo))}
            ${modelo('Descrição', `<textarea name="descricao" rows="7" class="campos">${correcao?.descricao || ''}</textarea>`)}

            <div style="${horizontal}; gap: 5px;">
                <label>Equipamentos usados</label>
                <img src="imagens/baixar.png" style="width: 1.5vw; cursor: pointer;" onclick="maisLabel()">
            </div>
            
            <div style="${vertical}; gap: 2px;" id="equipamentos">
                ${equipamentos}
            </div>

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
        <div style="${horizontal}; justify-content: start; background-color: #a0a0a0ff; padding: 5px; gap: 1vw;">
            ${botao('Salvar', funcao)}
        </div>
   `

    popup(acumulado, 'CORREÇÃO')

}

async function maisLabel({ codigo, quantidade, unidade } = {}) {

    let div = document.getElementById('equipamentos')
    const opcoes = ['UND', 'METRO', 'CX'].map(op => `<option ${unidade == op ? `selected` : ''}>${op}</option>`).join('')
    const temporario = ID5digitos()
    let nome = 'Clique aqui'
    if (codigo) {
        const produto = await recuperarDado('equipamentos', codigo)
        nome = produto.descricao
    }

    const label = `
        <div style="${horizontal}; gap: 5px; width: 100%;">
            <input class="campos" type="number" placeholder="quantidade" value="${quantidade || ''}">
            <select class="campos">${opcoes}</select>
            <label class="campos" name="${temporario}" ${codigo ? `id="${codigo}"` : ''} onclick="caixaOpcoes('${temporario}', 'equipamentos')">${nome}</label>
            <img src="imagens/cancel.png" style="width: 1.5vw; cursor: pointer;" onclick="this.parentElement.remove()">
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
        dataInicio: obter('dataInicio', 'value'),
        horaInicio: obter('horaInicio', 'value'),
        dataTermino: obter('dataTermino', 'value'),
        horaTermino: obter('horaTermino', 'value'),
        dataRegistro: new Date().toLocaleString('pt-BR'),
        descricao: obter('descricao', 'value')
    })

    correcao.anexos = {
        ...correcao.anexos,
        ...anexosProvisorios
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

async function carregarRoteiro(idOcorrencia, idCorrecao) {

    let painel = document.getElementById(idCorrecao)
    if (!painel) return

    const mensagem = (texto) => `<div style="${horizontal}; width: 100%;">${texto}</div>`

    const ocorrencia = await recuperarDado('dados_ocorrencias', idOcorrencia)
    const correcao = ocorrencia.correcoes[idCorrecao]
    const dadosUsuario = await recuperarDado('dados_setores', correcao.executor)
    const usuarioMobi7 = dadosUsuario?.mobi7 || ''
    const dtInicial = correcao.dataInicio
    const dtFinal = correcao.dataTermino
    const hrInicial = correcao.horaInicio
    const hrFinal = correcao.horaTermino

    if (usuarioMobi7 == '' || dtInicial == '' || dtFinal == '') return painel.innerHTML = mensagem('Correção sem dados de Inicio/Final e/ou Executor')

    const roteiro = await mobi7({ usuarioMobi7, dtInicial, dtFinal, hrInicial, hrFinal })

    if (roteiro.length == 0) return painel.innerHTML = mensagem('Sem Dados')

    const modelo = (valor1, valor2) => `
        <div style="${horizontal}; gap: 5px;">
            <label style="font-size: 0.7vw;"><strong>${valor1}</strong></label>
            <label style="font-size: 0.7vw; text-align: left;">${valor2}</label>
        </div>
    `

    let locais = ''
    for (const registro of roteiro.reverse()) {

        const partida = registro.startLocation
        const dtPartida = new Date(registro.startPosition.date).toLocaleString('pt-BR')

        const chegada = registro.endLocation
        const dtChegada = new Date(registro.endPosition.date).toLocaleString('pt-BR')

        locais += `
            <div style="${horizontal}; gap: 1vw; width: 100%;">
                <div style="${vertical}; width: 50%;">
                    ${modelo('Bairro', partida.district)}
                    ${modelo('Rua', partida.street)}
                    ${modelo('Saída', dtPartida)}
                </div>

                <div style="${vertical}; width: 50%;">
                    ${modelo('Bairro', chegada.district)}
                    ${modelo('Rua', chegada.street)}
                    ${modelo('Saída', dtChegada)}
                </div>
            </div>
            <br>
        `
    }

    painel.innerHTML = locais

}

function ir(img, acao, idOcorrencia) {
    const tabelas = document.querySelectorAll(`[id^='${idOcorrencia}_']`)
    const paginaAtual = img.closest('div').querySelectorAll('label')[0]
    if (!paginaAtual) return

    const numeroAtual = Number(paginaAtual.textContent)
    const proximoNumero = acao === 'avancar' ? numeroAtual + 1 : numeroAtual - 1
    const novaPagina = document.querySelectorAll(`[id=${idOcorrencia}_${proximoNumero}]`)
    if (!novaPagina[0]) return
    const idCorrecao = novaPagina[0].getAttribute('name')

    if (novaPagina.length == 0) return

    for (const tabela of tabelas) tabela.style.display = 'none'
    novaPagina.forEach(pag => pag.style.display = 'flex')
    paginaAtual.textContent = proximoNumero

    carregarRoteiro(idOcorrencia, idCorrecao)
}

function obter(name, propriedade) {
    const elemento = document.querySelector(`[name=${name}]`)
    return elemento[propriedade] ? elemento[propriedade] : ''
}

async function salvarOcorrencia(idOcorrencia) {

    overlayAguarde()

    const campos = ['unidade', 'sistema', 'prioridade', 'tipo', 'solicitante', 'executor']
    let ocorrencia = {}

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

    if (idOcorrencia) {
        const ocorrenciaAtual = await recuperarDado('dados_ocorrencias', idOcorrencia)
        await inserirDados({ [idOcorrencia]: { ...ocorrenciaAtual, ...ocorrencia } }, 'dados_ocorrencias')
        await enviar(`dados_ocorrencias/${idOcorrencia}`, ocorrencia)
    } else {
        await enviar('dados_ocorrencias/0000', ocorrencia)
        await atualizarOcorrencias()
    }

    anexosProvisorios = {}
    
    await criarLinhaOcorrencia(idOcorrencia, ocorrencia)

    removerPopup()
}