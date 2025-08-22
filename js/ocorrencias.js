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

const labelBotao = (name, nomebase, id, nome) => `
        <label 
        class="campos" 
        name="${name}"
        ${id ? `id="${id}"` : ''} 
        onclick="cxOpcoes('${name}', '${nomebase}')">
            ${nome ? nome : 'Selecione'} 
        </label>
    `

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

                    <div style="${horizontal}; gap: 5px; width: 100%;">
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

async function criarLinhaOcorrencia(idOcorrencia, ocorrencia) {

    const status = correcoes[ocorrencia?.tipoCorrecao]?.nome || 'Não analisada'
    const linha = `
        <tr id="${idOcorrencia}">
            
            <td style="background-color: white;">
              
                <div style="${vertical}; gap: 5px; width: 100%; position: relative;">

                    <div style="${horizontal}; width: 90%; gap: 5px; padding: 5px;">
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

    if(!evitarEsconder) esconderMenus()
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
                        ${botao('Nova Ocorrência', 'formularioOcorrencia()')}
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

    const basesAuxiliares = ['empresas', 'sistemas', 'prioridades', 'correcoes', 'tipos']

    for (const base of basesAuxiliares) await sincronizarDados(base, true)

    const resposta = await baixarOcorrencias()
    await sincronizarSetores()
    await inserirDados(resposta.ocorrencias, 'dados_ocorrencias', resposta.resetar)
    await inserirDados(resposta.clientes, 'dados_clientes', resposta.resetar)
    titulo.textContent = resposta.empresa

    await telaOcorrencias(true)

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
    const correcao = ocorrencia?.correcoes[idCorrecao] || {}
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

    removerPopup()
    
    if (idOcorrencia) {
        const ocorrenciaAtual = await recuperarDado('dados_ocorrencias', idOcorrencia)
        await inserirDados({ [idOcorrencia]: { ...ocorrenciaAtual, ...ocorrencia } }, 'dados_ocorrencias')
        await enviar(`dados_ocorrencias/${idOcorrencia}`, ocorrencia)
        await atualizarOcorrencias()
    } else {
        await enviar('dados_ocorrencias/0000', ocorrencia)
        await atualizarOcorrencias()
        await criarLinhaOcorrencia(idOcorrencia, ocorrencia)
    }

    anexosProvisorios = {}
    
}

async function dashboard(dadosFiltrados, evitarEsconder) {

    if(!evitarEsconder) esconderMenus()
    overlayAguarde()

    const dados_ocorrencias = dadosFiltrados ? dadosFiltrados : await recuperarDados('dados_ocorrencias')
    const dados_empresas = await recuperarDados('dados_empresas')
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
                <td>${dados_empresas?.[ocorrencia?.unidade]?.nome || '...'}</td>
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
    if(tabelaRelatorio) return tabelaRelatorio.innerHTML = tabela

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