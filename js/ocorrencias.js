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
    titulo.textContent = nomeBase
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
            ${bases.map(base => `<button onclick="carregarBasesAuxiliares('${base}')">${base}</button>`).join('')}
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
            <div id="${idOcorrencia}_${pagina}" name="${idCorrecao}" style="${horizontal}; display: ${pagina == 1 ? 'flex' : 'none'}; width: 100%;">

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

async function telaOcorrencias() {

    esconderMenus()
    overlayAguarde()

    titulo.textContent = 'Ocorrências'

    const dados_ocorrencias = await recuperarDados('dados_ocorrencias')
    const sistemas = await recuperarDados('sistemas')
    const tipos = await recuperarDados('tipos')
    const prioridades = await recuperarDados('prioridades')
    const dados_empresas = await recuperarDados('dados_empresas')
    const correcoes = await recuperarDados('correcoes')

    let linhas = ''

    for (const [idOcorrencia, ocorrencia] of Object.entries(dados_ocorrencias).reverse()) {

        const status = correcoes[ocorrencia?.tipoCorrecao]?.nome || 'Não analisada'

        linhas += `
        <tr>
            
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
                    ${modeloCampos('Und Manutenção', dados_empresas?.[ocorrencia?.unidade]?.nome || '...')}
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
    }

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
                        ${botao('Atualizar', `atualizarOcorrencias()`)}
                    </div>
                </div>
            </div>

            <div style="height: max-content; width: 85vw; max-height: 70vh; overflow: auto;">
                <table class="tabela1">
                    <tbody id="body">${linhas}</tbody>
                </table>
            </div>

            <div class="rodapeTabela"></div>
        </div>
    `

    const telaInterna = document.querySelector('.telaInterna')
    telaInterna.innerHTML = acumulado

    removerOverlay()

}

async function atualizarOcorrencias() {

    overlayAguarde()

    const basesAuxiliares = ['empresas', 'sistemas', 'prioridades', 'correcoes', 'tipos']

    for (const base of basesAuxiliares) await sincronizarDados(base, true)

    const resposta = await baixarOcorrencias()

    await inserirDados(resposta.ocorrencias, 'dados_ocorrencias', resposta.resetar)
    await inserirDados(resposta.clientes, 'dados_empresas', resposta.resetar)
    titulo.textContent = resposta.empresa

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

    const ocorrencia = idOcorrencia ? await recuperarDado('dados_ocorrencias', idOcorrencia) : {}
    const funcao = idOcorrencia ? `salvarOcorrencia('${idOcorrencia}')` : 'salvarOcorrencia()'

    const acumulado = `
        <div class="painelCadastro">

            ${modelo('Unidade de Manutenção', labelBotao('unidade', 'dados_empresas', ocorrencia.unidade))}
            ${modelo('Sistema', labelBotao('sistema', 'sistemas', ocorrencia.sistema))}
            ${modelo('Prioridade', labelBotao('prioridade', 'prioridades'))}
            ${modelo('Tipo', labelBotao('tipo', 'tipos'))}
            ${modelo('Solicitante', labelBotao('solicitante', 'dados_setores'))}
            ${modelo('Descrição', `<textarea rows="7" style="width: 100%;" name="descricao" class="campos">${ocorrencia?.descricao || ''}</textarea>`)}
            ${modelo('Executor / Responsável', labelBotao('executor', 'dados_setores'))}
            ${modelo('Data / Hora', `<label class="campos">${new Date().toLocaleString('pt-BR')}</label>`)}
            ${modelo('Data Limite para a Execução', `<input name="dataLimiteExecucao" class="campos" type="date" value="${ocorrencia?.dataLimiteExecucao || ''}">`)}
            ${modelo('Anexos', `
                    <label class="campos">
                        Clique aqui
                        <input type="file" style="display: none;" onchange="anexosOcorrencias(this, '${idOcorrencia ? idOcorrencia : 'novo'}')">
                    </label>
                `)}
            <div id="anexos" style="${vertical};">
                ${Object.entries(ocorrencia?.anexos || {}).map(([idAnexo, anexo]) => criarAnexoVisual(anexo.nome, anexo.link, `removerAnexo(this, '${idAnexo}', '${idOcorrencia}')`)).join('')}
            </div>

            ${ocorrencia.correcoes
            ? `<hr style="width: 100%;">
                <label>CORREÇÕES</label>
                ${await gerarCorrecoes(idOcorrencia, ocorrencia.correcoes, true)}`
            : ''}

            <button onclick="${funcao}">Salvar</button>
        </div>
   `

    popup(acumulado, 'Gerenciar ocorrência')

    carregarRoteiro(idOcorrencia, Object.keys(ocorrencia?.correcoes || {})[0])

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