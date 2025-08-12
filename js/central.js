const tela = document.getElementById('tela')
const toolbar = document.querySelector('.toolbar')
const titulo = toolbar.querySelector('span')
const horizontal = `display: flex; align-items: center; justify-content: center;`
const vertical = `display: flex; align-items: start; justify-content: start; flex-direction: column`
const nomeBaseCentral = 'Reconstrular'
const nomeStore = 'Bases'
const filtrosColaboradores = {}
let dados_distritos = {}

const modeloTabela = (colunas, base) => {

    const ths = colunas
        .map(col => `<th>${col}</th>`).join('')

    const thead = (colunas && colunas.length > 0) ? `<thead>${ths}</thead>` : ''

    return `
    <div class="blocoTabela">
        <div class="painelBotoes">
            <div class="pesquisa">
                <input oninput="pesquisarGenerico('0', this.value, filtrosColaboradores, 'body')" placeholder="Pesquisar" style="width: 100%;">
                <img src="imagens/pesquisar2.png">
            </div>
            <img class="atualizar" src="imagens/atualizar.png" onclick="atualizarDados('${base}')">
        </div>
        <div class="recorteTabela">
            <table class="tabela">
                ${thead}
                <tbody id="body"></tbody>
            </table>
        </div>
        <div class="rodapeTabela"></div>
    </div>
`}
const mensagem = (mensagem) => `
    <div class="mensagem">
        <img src="gifs/alerta.gif">
        <label>${mensagem}</label>
    </div>
    `
const btnRodape = (texto, funcao) => `
    <div class="btnRodape" onclick="${funcao}">${texto}</div>
`
const btnPadrao = (texto, funcao) => `
        <span class="btnPadrao" onclick="${funcao}">${texto}</span>
`
const btn = (img, valor, funcao) => `
    <div class="btnLateral" onclick="${funcao}">
        <img src="imagens/${img}.png">
        <div>${valor}</div>
    </div>
`
telaLogin()

function exibirSenha(img) {

    let inputSenha = img.previousElementSibling
    const atual = inputSenha.type == 'password'
    inputSenha.type = atual ? 'text' : 'password'
    img.src = `imagens/${atual ? 'olhoAberto' : 'olhoFechado'}.png`

}

function cadastrar() {

    const campos = ['Nome Completo', 'Usuário', 'Senha', 'E-mail', 'Telefone']

    const modelo = (texto) => `
        <div style="${vertical};">
            <span>${texto}</span>
            <input placeholder="${texto}">
        </div>
    `

    const acumulado = `
        <div class="camposCadastro">
            ${campos.map(campo => `${modelo(campo)}`).join('')}
            <hr style="width: 100%;">
            ${btnPadrao('Criar acesso', 'salvarCadastro()')}
        </div>
        `

    popup(acumulado, 'Cadastro')

}

function acessoLogin() {

    overlayAguarde()
    const divAcesso = document.getElementById('acesso')
    divAcesso.style.display = 'none'

    const inputs = divAcesso.querySelectorAll('input')
    const url = 'https://leonny.dev.br/acesso'

    if (inputs[0].value == '' || inputs[1].value == '') {
        popup(mensagem('Senha e/ou usuário não informado(s)'), 'ALERTA', true)
        divAcesso.style.display = 'flex'

    } else {

        const requisicao = {
            tipoAcesso: 'login',
            servidor: 'RECONST',
            dados: {
                usuario: inputs[0].value,
                senha: inputs[1].value
            }
        }

        const payload = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requisicao)
        }

        fetch(url, payload)

            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(data => {

                if (data.permissao == 'novo') {
                    popup(mensagem('Alguém do setor de SUPORTE precisa autorizar sua entrada!'), 'ALERTA', true)
                } else if (data.permissao !== 'novo') {
                    localStorage.setItem('acesso', JSON.stringify(data));
                    telaPrincipal()
                    removerOverlay()
                }

                divAcesso.style.display = 'flex'

            })
            .catch(data => {
                popup(mensagem(data.erro), 'ALERTA', true);
                divAcesso.style.display = 'flex'
            });

    }
}

// NOVO USUÁRIO ; 

function salvarCadastro() {

    overlayAguarde()

    let camposCadastro = document.querySelector('.camposCadastro')
    let campos = camposCadastro.querySelectorAll('input')
    let nome_completo = campos[0].value
    let usuario = campos[1].value
    let senha = campos[2].value
    let email = campos[3].value
    let telefone = campos[4].value

    if (usuario == "" || senha == "" || email == "") {

        popup(mensagem('Senha, usuário ou e-mail não informado(s)'), 'AVISO', true)

    } else {

        const payload = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                servidor: 'RECONST',
                tipoAcesso: 'cadastro',
                dados: {
                    usuario,
                    senha,
                    email,
                    nome_completo,
                    telefone
                }
            })
        }

        fetch('https://leonny.dev.br/acesso', payload)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(data => {

                switch (true) {
                    case data.erro:
                        popup(mensagem(data.erro), 'AVISO', true);
                        break;
                    case data.permissao == 'novo':
                        popup(mensagem('Seu cadastro foi realizado! Alguém do setor de SUPORTE precisa autorizar sua entrada!'), 'ALERTA')
                        break;
                    default:
                        popup(mensagem('Servidor Offline... fale com o Setor de Programação'), 'AVISO', true);
                }

            })
            .catch(error => {
                popup(mensagem(error.erro), 'AVISO', true);
            });

    }

}

function popup(elementoHTML, titulo, naoRemoverAnteriores) {

    const acumulado = `
        <div id="tempPop" class="overlay">

            <div class="janela_fora">
                
                <div class="toolbarPopup">

                    <span style="width: 90%;">${titulo || 'Popup'}</span>
                    <span style="width: 10%" onclick="removerPopup()">×</span>

                </div>
                
                <div class="janela">

                    ${elementoHTML}

                </div>

            </div>

        </div>`

    removerPopup(naoRemoverAnteriores)
    removerOverlay()
    document.body.insertAdjacentHTML('beforeend', acumulado);

}

async function removerPopup(naoRemoverAnteriores) {

    const popUps = document.querySelectorAll('#tempPop')

    if (naoRemoverAnteriores) return

    if (popUps.length > 1) {
        popUps[popUps.length - 1].remove()

    } else {
        popUps.forEach(pop => {
            pop.remove()
        })
    }

    const aguarde = document.querySelector('.aguarde')
    if (aguarde) aguarde.remove()

}

function removerOverlay() {
    let aguarde = document.querySelector('.aguarde')
    if (aguarde) aguarde.remove()
}

function overlayAguarde() {

    const aguarde = document.querySelector('.aguarde')
    if (aguarde) aguarde.remove()

    const elemento = `
        <div class="aguarde">
            <img src="gifs/loading.gif">
        </div>
    `
    document.body.insertAdjacentHTML('beforeend', elemento)

    let pageHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
    );

    document.querySelector('.aguarde').style.height = `${pageHeight}px`;

}

async function telaPrincipal() {

    toolbar.style.display = 'flex'
    const acesso = JSON.parse(localStorage.getItem('acesso'))
    const acumulado = `

    <div class="menu-container">

        <div class="side-menu" id="sideMenu">

            <span class="nomeUsuario">${acesso.usuario} <strong>${acesso.permissao}</strong></span>

            <div style="${vertical}; justify-content: space-between; height: 100%;">
                
                <div class="botoesMenu">

                    ${btn('pessoas', 'Colaboradores', 'telaPessoas()')}
                    ${btn('obras', 'Obras', 'telaObras()')}
                    ${btn('kanban', 'Acompanhamento', 'acompanhamento()')}
                    ${btn('perfil', 'Usuários', 'usuarios()')}
                    ${btn('sair', 'Desconectar', 'deslogar()')}

                </div>

            </div>
        </div>

        <div class="telaInterna">
            <h1>Reconstrular</h1>
            <p>Seja bem vindo!</p>
        </div>
    </div>
    `

    tela.innerHTML = acumulado

    await sincronizarDados('dados_distritos')
    dados_distritos = await recuperarDados('dados_distritos')
    await sincronizarSetores()

}

function verificarClique(event) {
    const menu = document.getElementById('sideMenu');
    if (menu && menu.classList.contains('active') && !menu.contains(event.target)) menu.classList.remove('active')
}

async function usuarios() {

    esconderMenus()

    const nomeBase = 'dados_setores'
    const acumulado = `
        ${modeloTabela(['Nome', 'Usuário', 'Setor', 'Permissão', ''], nomeBase)}
    `
    titulo.textContent = 'Gerenciar Usuários'
    const telaInterna = document.querySelector('.telaInterna')
    telaInterna.innerHTML = acumulado

    const dados_setores = await recuperarDados(nomeBase)
    for (const [id, usuario] of Object.entries(dados_setores)) criarLinha(usuario, id, nomeBase)

}

async function sincronizarDados(base, overlayOff) {

    if (!overlayOff) overlayAguarde()

    let nuvem = await receber(base) || {}
    await inserirDados(nuvem, base)

    if (!overlayOff) removerOverlay()
}

async function telaObras() {

    esconderMenus()
    const nomeBase = 'dados_obras'
    titulo.textContent = 'Gerenciar Obras'
    const acumulado = `
        ${btnRodape('Adicionar', 'adicionarObra()')}
        ${modeloTabela(['Cliente', 'Distrito', 'Cidade', 'Contacto', 'E-mail', ''], nomeBase)}
    `
    const telaInterna = document.querySelector('.telaInterna')

    telaInterna.innerHTML = acumulado

    const dados_obras = await recuperarDados(nomeBase)
    for (const [idObra, obra] of Object.entries(dados_obras)) criarLinha(obra, idObra, nomeBase)
}

async function atualizarDados(base) {

    overlayAguarde()
    await sincronizarDados(base)

    const dados = await recuperarDados(base)
    for (const [id, objeto] of Object.entries(dados)) criarLinha(objeto, id, base)
    removerOverlay()

}

async function adicionarObra(idObra) {

    const obra = await recuperarDado('dados_obras', idObra)

    const modelo = (texto, elemento) => `
        <div style="${vertical}; gap: 3px;">
            <span style="text-align: left;"><strong>${texto}</strong></span>
            <div>${elemento}</div>
        </div>
    `

    const acumulado = `
        <div class="painelCadastro">

            ${modelo('Distrito', `<select name="distrito" onchange="carregarSelects(this)"></select>`)}
            ${modelo('Cidade', `<select name="cidade"></select>`)}
            ${modelo('Cliente', `<input value="${obra?.cliente || ''}" name="cliente" placeholder="Nome do Cliente">`)}
            ${modelo('Contacto cliente', `<input value="${obra?.contacto || ''}" name="contacto" placeholder="Contacto">`)}
            ${modelo('E-mail cliente', `<input value="${obra?.email || ''}" name="email" placeholder="E-mail">`)}

            <hr style="width: 100%;">

            ${btnPadrao('Salvar', `salvarObra(${idObra ? `'${idObra}'` : ''})`)}

        </div>
    `

    popup(acumulado, 'Cadastro')
    await carregarSelects()

}

async function carregarSelects(select) {
    const dados_distritos = await recuperarDados('dados_distritos');
    const selectDistrito = document.querySelector('[name="distrito"]');
    const selectCidade = document.querySelector('[name="cidade"]');

    if (!select) {
        const opcoesDistrito = Object.entries(dados_distritos)
            .map(([idDistrito, objDistrito]) => `<option value="${idDistrito}">${objDistrito.nome}</option>`)
            .join('');
        selectDistrito.innerHTML = opcoesDistrito;
    }

    const selectAtual = select ? select.value : selectDistrito.value
    const cidades = dados_distritos?.[selectAtual]?.cidades || {};
    const opcoesCidade = Object.entries(cidades)
        .map(([idCidade, objCidade]) => `<option value="${idCidade}">${objCidade.nome}</option>`)
        .join('');

    selectCidade.innerHTML = opcoesCidade;
}


async function salvarObra(idObra) {

    overlayAguarde()

    idObra = idObra || unicoID()

    function obVal(name) {
        const el = document.querySelector(`[name="${name}"]`)
        if (el) return el.value
    }

    let obra = {}
    const camposFixos = ['cliente', 'contacto', 'email', 'distrito', 'cidade']

    for (const campo of camposFixos) obra[campo] = obVal(campo)

    await enviar(`dados_obras/${idObra}`, obra)
    await inserirDados({ [idObra]: obra }, 'dados_obras')

    criarLinha(obra, idObra, 'dados_obras')

    removerPopup()

}

function deslogar() {
    localStorage.removeItem('acesso')
    telaLogin()
}

function esconderMenus() {
    const sideMenu = document.getElementById('sideMenu');
    sideMenu.classList.toggle('active');
}

async function telaPessoas() {

    esconderMenus()
    const nomeBase = 'dados_colaboradores'
    titulo.textContent = 'Gerenciar Colaboradores'
    const acumulado = `
        ${btnRodape('Adicionar', 'adicionarPessoa()')}
        ${modeloTabela(['Nome', 'Telefone', 'Morada', 'Dt Nascimento', 'Apólice', 'Status', 'Especialidade', ''], nomeBase)}
    `
    const telaInterna = document.querySelector('.telaInterna')

    telaInterna.innerHTML = acumulado

    const dados_colaboradores = await recuperarDados(nomeBase)
    for (const [id, colaborador] of Object.entries(dados_colaboradores)) criarLinha(colaborador, id, nomeBase)

}

function criarLinha(dados, id, nomeBase) {

    const modelo = (texto2) => `
        <td>
            <div style="${horizontal}; gap: 5px;">
                <span>${texto2}</span>
            </div>
        </td>
    `
    let tds = ''
    let funcao = ''

    if (nomeBase == 'dados_colaboradores') {
        funcao = `adicionarPessoa('${id}')`

        tds = `
            ${modelo(dados?.nome || '--')}
            ${modelo(dados?.telefone || '--')}
            ${modelo(dados?.morada || '--')}
            ${modelo(dados?.dataNascimento || '--')}
            ${modelo(dados?.apolice || '--')}
            ${modelo(dados?.status || '--')}
            ${modelo(dados?.especialidade || '--')}
        `
    } else if (nomeBase == 'dados_obras') {
        funcao = `adicionarObra('${id}')`
        const distrito = dados_distritos?.[dados?.distrito] || {}
        const cidades = distrito?.cidades?.[dados?.cidade] || {}

        tds = `
            ${modelo(dados?.cliente || '--')}
            ${modelo(distrito?.nome || '--')}
            ${modelo(cidades?.nome || '--')}
            ${modelo(dados?.contacto || '--')}
            ${modelo(dados?.email || '--')}
        `
    } else if (nomeBase == 'dados_setores') {
        funcao = `gerenciarUsuario('${id}')`
        tds = `
            ${modelo(dados?.nome_completo || '--')}
            ${modelo(dados?.usuario || '--')}
            ${modelo(dados?.setor || '--')}
            ${modelo(dados?.permissao || '--')}
        `
    } else if (nomeBase == 'tarefas') {
        funcao = `verAndamento('${id}')`
        tds = `
            ${modelo(dados?.data || '--')}
            ${modelo(dados?.obra || '--')}
            `
    }

    const linha = `
        <tr id="${id}">
            ${tds}
            <td class="detalhes">
                <img onclick="${funcao}" src="imagens/pesquisar.png">
            </td>
        </tr>
    `

    const tr = document.getElementById(id)
    if (tr) return tr.innerHTML = linha
    const body = document.getElementById('body')
    body.insertAdjacentHTML('beforeend', linha)

}

async function gerenciarUsuario(id) {

    const usuario = await recuperarDado('dados_setores', id)

    const modelo = (texto, elemento) => `
        <div style="${vertical}; gap: 3px;">
            <span style="text-align: left;"><strong>${texto}</strong></span>
            <div>${elemento}</div>
        </div>
    `

    const permissoes = ['', 'novo', 'adm', 'user', 'analista']
        .map(op => `<option ${usuario?.permissao == op ? 'selected' : ''}>${op}</option>`).join('')

    const setores = ['', 'SUPORTE', 'GESTÃO', 'LOGÍSTICA']
        .map(op => `<option ${usuario?.setor == op ? 'selected' : ''}>${op}</option>`).join('')

    const acumulado = `
        <div style="${vertical}; gap: 5px; padding: 2vw; background-color: #d2d2d2;">
            ${modelo('Nome', usuario?.nome_completo || '--')}
            ${modelo('E-mail', usuario?.email || '--')}
            ${modelo('Permissão', `<select onchange="configuracoes('${id}', 'permissao', this.value)">${permissoes}</select>`)}
            ${modelo('Setor', `<select onchange="configuracoes('${id}', 'setor', this.value)">${setores}</select>`)}
        </div>
    `

    popup(acumulado, 'Usuário')
}

async function adicionarPessoa(id) {

    const colaborador = await recuperarDado('dados_colaboradores', id)

    const listas = {
        status: ['Ativo', 'Baixa Médica', 'Não Ativo', 'Impedido'],
        documento: ['Cartão de Cidadão', 'Passaporte', 'Título de residência'],
        especialidade: ['Pedreiros', 'Ladrilhadores', 'Pintor', 'Estucador', 'Pavimento Laminado', 'Eletricista Certificado', 'Ajudante', 'Teto Falso e Paredes em Gesso Cartonado', 'Canalizador', 'Carpinteiro']
    }

    const modelo = (texto, elemento) => `
        <div style="${vertical}; gap: 3px;">
            <span style="text-align: left;"><strong>${texto}</strong></span>
            <div>${elemento}</div>
        </div>
    `

    function retornarCaixas(name) {

        const opcoesStatus = listas[name]
            .map(op => `
            <div class="opcaoStatus">
                <input value="${op}" type="radio" name="${name}" ${colaborador?.[name] == op ? 'checked' : ''}>
                <span style="text-align: left;">${op}</span>
            </div>
            `).join('')

        return `
            <div style="${vertical}; gap: 5px;">
                ${opcoesStatus}
            </div>`

    }

    const caixaStatus = retornarCaixas('status')
    const caixaEspecialidades = retornarCaixas('especialidade')
    const caixaDocumentos = `${retornarCaixas('documento')} <input placeholder="Número do documento">`

    const acumulado = `
        <div class="painelCadastro">

            ${modelo('Nome Completo', `<input value="${colaborador?.nome || ''}" name="nome" placeholder="Nome Completo">`)}
            ${modelo('Data de Nascimento', `<input value="${colaborador?.dataNascimento || ''}" type="date" name="dataNascimento">`)}
            ${modelo('Morada', `<input value="${colaborador?.morada || ''}" name="morada" placeholder="Morada">`)}
            ${modelo('Apólice de Seguro', '<input name="apolice" placeholder="Número da Apólice">')}
            ${modelo('Telefone', '<input name="telefone" placeholder="Telefone">')}
            ${modelo('Contrato de Obra', '<input name="contratoObra" type="file">')}
            ${modelo('Documento', caixaDocumentos)}
            ${modelo('Número de Contribuinte', '<input name="numeroContribuinte" type="text" maxlength="9" placeholder="Máximo de 9 dígitos">')}
            ${modelo('Segurança Social', '<input name="segurancaSocial" placeholder="Número Segurança Social">')}
            ${modelo('Exame médico', '<input name="exame" type="file">')}
            ${modelo('Epi’s', '<input name="epi" type="file">')}
            ${modelo('Especialidade', caixaEspecialidades)}
            ${modelo('Status', caixaStatus)}
            ${modelo('Senha de Acesso', '<input name="pin" type="text" maxlength="4" placeholder="Máximo de 4 números">')}
            ${modelo('Foto do Colaborador', '<input name="foto" type="file">')}

            <hr style="width: 100%;">

            ${btnPadrao('Salvar', `salvarColaborador(${id ? `'${id}'` : ''})`)}

        </div>
    `

    popup(acumulado, 'Cadastro')
}

function unicoID() {
    var d = new Date().getTime();
    if (window.performance && typeof window.performance.now === "function") {
        d += performance.now();
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

async function salvarColaborador(idColaborador) {

    overlayAguarde()

    idColaborador = idColaborador || unicoID()

    function obVal(name) {
        const el = document.querySelector(`[name="${name}"]`)
        if (el) return el.value
    }

    let colaborador = {}
    const camposFixos = ['nome', 'dataNascimento', 'morada', 'apolice', 'telefone', 'numeroContribuinte', 'pin']

    for (const campo of camposFixos) colaborador[campo] = obVal(campo)

    const camposRatio = ['status', 'documento', 'especialidade']
    for (const campo of camposRatio) {
        const valor = document.querySelector(`input[name="${campo}"]:checked`)?.value
        colaborador[campo] = valor
    }

    await enviar(`dados_colaboradores/${idColaborador}`, colaborador)
    await inserirDados({ [idColaborador]: colaborador }, 'dados_colaboradores')

    criarLinha(colaborador, idColaborador, 'dados_colaboradores')

    removerPopup()

}

function telaLogin() {

    const acesso = JSON.parse(localStorage.getItem('acesso'))
    if (acesso) return telaPrincipal()

    toolbar.style.display = 'none'

    const acumulado = `
        <div id="acesso" class="login-container">

            <img src="imagens/acesso.png" style="width: 10vw;">

            <div style="display: flex; flex-direction: column; align-items: start; justify-content: center;">

                <label>Usuário</label>
                <input type="text" placeholder="Usuário">

                <label>Senha</label>
                <div style="display: flex; gap: 10px; justify-content: center; align-items: center;">
                    <input type="password" placeholder="Senha">
                    <img src="imagens/olhoFechado.png" style="width: 6vw; cursor: pointer;" onclick="exibirSenha(this)">
                </div>
                <button onclick="acessoLogin()">Entrar</button>

            </div>
            <br>

            <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
                <label>Primeiro acesso?</label>
                <button style="background-color: #097fe6; white-space: nowrap;" onclick="cadastrar()">Cadastre-se</button>
            </div>

        </div>
    `

    tela.innerHTML = acumulado

}

// BASE DE DADOS
async function inserirDados(dados, nomeBase, resetar) {

    const versao = await new Promise((resolve, reject) => {
        const req = indexedDB.open(nomeBaseCentral);
        req.onsuccess = () => {
            const db = req.result;
            const precisaCriar = !db.objectStoreNames.contains(nomeStore);
            const versaoAtual = db.version;
            db.close();
            resolve(precisaCriar ? versaoAtual + 1 : versaoAtual);
        };
        req.onerror = (e) => reject(e.target.error);
    });

    const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open(nomeBaseCentral, versao);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(nomeStore)) {
                db.createObjectStore(nomeStore, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });

    const tx = db.transaction(nomeStore, 'readwrite');
    const store = tx.objectStore(nomeStore);

    let dadosMesclados = {}

    if (!resetar) {

        const antigo = await new Promise((resolve, reject) => {
            const req = store.get(nomeBase);
            req.onsuccess = () => resolve(req.result?.dados || {});
            req.onerror = (e) => reject(e.target.error);
        });

        dadosMesclados = { ...antigo, ...dados };

    } else {
        dadosMesclados = dados
    }

    dadosMesclados = Object.fromEntries(
        Object.entries(dadosMesclados).filter(([_, valor]) => !valor?.excluido)
    );

    await store.put({ id: nomeBase, dados: dadosMesclados });

    await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = reject;
    });

    db.close();
}

async function recuperarDados(nomeBase) {

    const getDadosPorBase = async (base) => {
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open(nomeBaseCentral);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });

        if (!db.objectStoreNames.contains(nomeStore)) {
            return {};
        }

        const tx = db.transaction(nomeStore, 'readonly');
        const store = tx.objectStore(nomeStore);

        const item = await new Promise((resolve, reject) => {
            const req = store.get(base);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });

        db.close();

        return item?.dados || {};
    };

    return await getDadosPorBase(nomeBase);
}

async function recuperarDado(nomeBase, id) {
    const abrirDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(nomeBaseCentral);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    };

    const buscar = async (db, base, id) => {
        if (!db.objectStoreNames.contains(nomeStore)) return null;

        const tx = db.transaction(nomeStore, 'readonly');
        const store = tx.objectStore(nomeStore);

        const registro = await new Promise((resolve, reject) => {
            const req = store.get(base);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });

        return registro?.dados?.[id] || null;
    };

    const db = await abrirDB();
    let resultado = await buscar(db, nomeBase, id);

    db.close();
    return resultado;
}

// API
function enviar(caminho, info) {
    return new Promise((resolve) => {
        let objeto = {
            caminho: caminho,
            valor: info,
            servidor: 'RECONST'
        };

        fetch("https://leonny.dev.br/salvar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objeto)
        })
            .then(data => resolve(data))
            .catch((erro) => {
                console.error(erro);
                salvar_offline(objeto, 'enviar');
                resolve();
            });
    });
}

async function receber(chave) {

    let chavePartes = chave.split('/')
    let timestamp = 0
    let dados = await recuperarDados(chavePartes[0]) || {}

    for (const [id, objeto] of Object.entries(dados)) {
        if (objeto.timestamp && objeto.timestamp > timestamp) timestamp = objeto.timestamp
    }

    let objeto = {
        servidor: 'RECONST',
        chave: chave,
        timestamp: timestamp
    };

    const obs = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(objeto)
    };

    return new Promise((resolve, reject) => {
        fetch("https://leonny.dev.br/dados", obs)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(err => {
                console.log(err);
                offline(2)
                resolve({})
            });
    })
}

function offline(motivo) {

    const motivos = {
        1: 'Você está offline!',
        2: 'O servidor caiu... tente novamente.'
    }

    let acumulado = `
    <div class="telaOffline">
        <div class="mensagemTela">
            <img src="gifs/offline.gif" class="dino">
            <label>${motivos[motivo]}</label>
            ${btn('atualizar', 'Reconectar', `telaPrincipal()`)}
        </div>
    </div>
    `

    tela.innerHTML = acumulado
}

function pesquisarGenerico(coluna, texto, filtro, id) {

    filtro[coluna] = String(texto).toLowerCase().replace('.', '')

    let tbody = document.getElementById(id);
    let trs = tbody.querySelectorAll('tr');

    trs.forEach(function (tr) {
        let tds = tr.querySelectorAll('td');
        let mostrarLinha = true;

        for (var col in filtro) {
            let filtroTexto = filtro[col];

            if (filtroTexto && col < tds.length) {
                let element = tds[col].querySelector('input') || tds[col].querySelector('textarea') || tds[col].querySelector('select') || tds[col].textContent
                let conteudoCelula = element.value ? element.value : element
                let texto_campo = String(conteudoCelula).toLowerCase().replace('.', '')

                if (!texto_campo.includes(filtroTexto)) {
                    mostrarLinha = false;
                    break;
                }
            }
        }

        tr.style.display = mostrarLinha ? '' : 'none';
    });

}

async function cxOpcoes(name, nomeBase, campos, funcaoAux) {

    let base = await recuperarDados(nomeBase)
    let opcoesDiv = ''

    for ([cod, dado] of Object.entries(base)) {

        const labels = campos
            .map(campo => `${(dado[campo] && dado[campo] !== '') ? `<label>${dado[campo]}</label>` : ''}`)
            .join('')

        opcoesDiv += `
            <div name="camposOpcoes" class="atalhos" onclick="selecionar('${name}', '${cod}', '${dado[campos[0]]}' ${funcaoAux ? `, '${funcaoAux}'` : ''})" style="${vertical}; gap: 2px; max-width: 40vw;">
                ${labels}
            </div>`
    }

    const acumulado = `
        <div style="${horizontal}; justify-content: left; background-color: #b1b1b1;">
            <div style="${horizontal}; padding-left: 1vw; padding-right: 1vw; margin: 5px; background-color: white; border-radius: 10px;">
                <input oninput="pesquisarCX(this)" placeholder="Pesquisar itens" style="width: 100%;">
                <img src="imagens/pesquisar2.png" style="width: 1.5vw;">
            </div>
        </div>
        <div style="padding: 1vw; gap: 5px; ${vertical}; background-color: #d2d2d2; width: 30vw; max-height: 40vh; height: max-content; overflow-y: auto; overflow-x: hidden;">
            ${opcoesDiv}
        </div>
    `

    popup(acumulado, 'Selecione o item', true)

}

async function selecionar(name, id, termo, funcaoAux) {
    const elemento = document.querySelector(`[name='${name}']`)
    elemento.textContent = termo
    elemento.id = id
    removerPopup()

    if (funcaoAux) await eval(funcaoAux)
}

function pesquisarCX(input) {

    const termoPesquisa = String(input.value).toLowerCase()

    const divs = document.querySelectorAll(`[name='camposOpcoes']`)

    for (const div of divs) {

        const termoDiv = String(div.textContent).toLocaleLowerCase()

        div.style.display = (termoDiv.includes(termoPesquisa) || termoPesquisa == '') ? '' : 'none'

    }

}

async function configuracoes(usuario, campo, valor) {

    let dados_usuario = await recuperarDado('dados_setores', usuario)
    dados_usuario[campo] = valor
    await inserirDados({ [usuario]: dados_usuario }, 'dados_setores')
    criarLinha(dados_usuario, usuario, 'dados_setores')

    return new Promise((resolve, reject) => {
        fetch("https://leonny.dev.br/configuracoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, campo, valor, servidor: 'RECONST' })
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
            .catch(err => {
                console.error(err)
                reject()
            });
    })
}

async function sincronizarSetores() {

    dados_setores = await recuperarDados('dados_setores')

    let timestamp = 0
    for (const [usuario, objeto] of Object.entries(dados_setores)) {
        if (objeto.timestamp && objeto.timestamp > timestamp) timestamp = objeto.timestamp
    }

    let nuvem = await listaSetores(timestamp)

    await inserirDados(nuvem, 'dados_setores')
    dados_setores = await recuperarDados('dados_setores')

}

async function listaSetores(timestamp) {
    try {
        const response = await fetch("https://leonny.dev.br/setores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timestamp, servidor: 'RECONST' })
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;

    } catch {
        return {}
    }
}

async function acompanhamento() {

    esconderMenus()
    const nomeBase = 'tarefas'
    titulo.textContent = 'Gerenciar Tarefas'
    const acumulado = `
        <div class="btnRodape">
            <input type="file" id="arquivoExcel" accept=".xls,.xlsx">
            <button onclick="enviarExcel()">Importar</button>
        </div>

        ${modeloTabela(['Data', 'Obra', ''], nomeBase)}
    `
    const telaInterna = document.querySelector('.telaInterna')

    telaInterna.innerHTML = acumulado

    const tarefas = await recuperarDados(nomeBase)
    for (const [idTarefa, tarefa] of Object.entries(tarefas)) criarLinha(tarefa, idTarefa, nomeBase)

}

function porcentagemHtml(valor) {
    valor = conversor(valor)
    const percentual = Math.max(0, Math.min(100, valor)); // limita de 0 a 100
    return `
    <div style="display:flex; align-items:center; gap:4px;">
        <span style="color:#888; font-size:14px;">${percentual}%</span>
        <div class="barra">
            <div style="width:${percentual}%; height:100%; background:#f8b84e;"></div>
        </div>
    </div>
  `;
}

function modeloTR({ ordem, descricao, unidade, porcentagem, quantidade, cor, id, idEtapa, idTarefa }) {

    const idLinha = idTarefa ? idTarefa : idEtapa

    const tr = `
        <tr id="${idLinha}" style="background-color: ${cor ? cor : ''};">
            <td>${ordem}</td>
            <td>
                <div style="${horizontal}; justify-content: space-between;">
                    <span>${descricao}</span>
                    <span>${quantidade ? `${quantidade} ${unidade}` : ''}</span>
                </div>
            </td>
            <td>${idTarefa ? porcentagemHtml(porcentagem) : ''}</td>
            <td>
                <div class="edicao">
                    <img class="btnAcmp" src="imagens/lapis.png" onclick="editarTarefa('${id}', '${idEtapa}' ${idTarefa ? `, '${idTarefa}'` : ''})">
                    <img class="btnAcmp" src="imagens/fechar.png">
                </div>
            </td>
        <tr>
    `

    const trExistente = document.getElementById(idLinha)

    if (trExistente) return trExistente.innerHTML = tr
    document.getElementById('bodyTarefas').insertAdjacentHTML('beforeend', tr)

}

async function verAndamento(id) {

    const tarefa = await recuperarDado('tarefas', id)

    titulo.textContent = 'Lista de Tarefas'

    const acumulado = `
        <div class="acompanhamento">

            <div style="${horizontal}; justify-content: start; gap: 2vw;">
                <input placeholder="Pesquisa">
                <select id="etapas"></select>
                <div style="${vertical};">
                    <div style="${horizontal}; gap: 1vw;">
                        <input type="checkbox">
                        <span>Exibir somente as etapas</span>
                    </div>
                    <div style="${horizontal}; gap: 1vw;">
                        <input type="checkbox">
                        <span>Ocultar etapa concluídas</span>
                    </div>
                </div>
            </div>

            <div id="resumo" style="${horizontal}; justify-content: space-between;"></div>

            <br>

            <table class="tabela">
                <tbody id="bodyTarefas"></tbody>
            </table>

        </div>
    `
    const telaInterna = document.querySelector('.telaInterna')
    telaInterna.innerHTML = acumulado

    for (const [idEtapa, dados] of Object.entries(tarefa.etapas)) {
        modeloTR({ ...dados, id, idEtapa, cor: '#F5F5F5' })
        const tarefas = Object.entries(dados?.tarefas || [])

        for (const [idTarefa, tarefa] of tarefas) {
            modeloTR({ ...tarefa, id, idEtapa, idTarefa })
        }
    }

    await atualizarToolbar(id)

}

async function atualizarToolbar(id, nomeEtapa) {
    const tarefa = await recuperarDado('tarefas', id)

    const bloco = (texto, valor) => `
        <div class="bloco">
            <span>${valor}</span>
            <label>${texto}</label>
        </div>
    `

    let totais = {
        tarefas: 0,
        naoIniciado: 0,
        emAndamento: 0,
        concluido: 0,
        porcentagemConcluido: 0
    }

    let etapas = ['Todas as tarefas']
    for (const [idEtapa, dados] of Object.entries(tarefa.etapas)) {

        const tarefas = Object.entries(dados?.tarefas || [])
        totais.tarefas += dados.descricao == nomeEtapa ? tarefas.length : 0
        etapas.push(dados.descricao)

        for (const [idTarefa, tarefa] of tarefas) {

            if (tarefa.porcentagem == 0) {
                totais.naoIniciado++
            } else if (tarefa.porcentagem !== 0 && tarefa.porcentagem < 100) {
                totais.emAndamento++
            } else if (tarefa.porcentagem >= 100) {
                totais.concluido++
            }

            totais.porcentagemConcluido += tarefa.porcentagem
        }
    }

    const emPorcentagemConcluido = totais.porcentagemConcluido / 100
    const porcentagemAndamento = ((emPorcentagemConcluido / totais.tarefas) * 100).toFixed(0)

    const opcoes = etapas
        .map(op => `<option>${op}</option>`).join('')

    document.getElementById('etapas').innerHTML = opcoes
    document.getElementById('resumo').innerHTML = `
        ${bloco('Total', totais.tarefas)}
        ${bloco('Não iniciado', totais.naoIniciado)}
        ${bloco('Em andamento', totais.emAndamento)}
        ${bloco('Concluída', totais.concluido)}
        ${bloco('Realizado', `${porcentagemAndamento}%`)}
    `
}

async function editarTarefa(id, idEtapa, idTarefa) {

    const objeto = await recuperarDado('tarefas', id)
    const tarefa = idTarefa ? objeto.etapas[idEtapa].tarefas[idTarefa] : objeto.etapas[idEtapa]

    const modelo = (texto, elemento, campo) => `
        <div style="${vertical}; gap: 3px;">
            <span style="text-align: left;"><strong>${texto}</strong></span>
            <input name="${texto}" ${campo ? 'type="number"' : ''} value="${elemento}" oninput="calcular()">
        </div>
    `

    const acumulado = `
        <div class="painelCadastro">
            ${modelo('Ordem', tarefa?.ordem || '')}
            ${modelo('Descrição', tarefa?.descricao || '')}
            ${modelo('Unidade', tarefa?.unidade || '')}
            ${modelo('Quantidade', tarefa?.quantidade || '', true)}
            ${modelo('Resultado', tarefa?.resultado || '', true)}
            <div id="indPorcentagem"></div>
            <input name="Porcentagem" type="number" style="display: none;">
            <hr style="width: 100%">
            <button onclick="salvarTarefa('${id}', '${idEtapa}', '${idTarefa}')">Salvar</button>
        </div>
    
    `
    popup(acumulado, 'Edição')

}

async function salvarTarefa(id, idEtapa, idTarefa) {

    overlayAguarde()
    let objeto = await recuperarDado('tarefas', id)
    let tarefa = objeto.etapas[idEtapa].tarefas[idTarefa]

    const valor = (name) => {
        const valor = document.querySelector(`[name="${name}"]`)
        return valor ? valor.value : ''
    }

    Object.assign(objeto.etapas[idEtapa].tarefas[idTarefa], {
        ordem: valor('Ordem'),
        unidade: valor('Unidade'),
        quantidade: valor('Quantidade'),
        resultado: valor('Resultado'),
        porcentagem: Number(valor('Porcentagem'))
    })

    await enviar(`tarefas/${id}/etapas/${idEtapa}/tarefas/${idTarefa}`, tarefa)
    await inserirDados({ [id]: objeto }, 'tarefas')

    modeloTR({ ...tarefa, id, idTarefa, idEtapa })
    await atualizarToolbar(id)

    removerPopup()

}

function calcular() {
    const quantidade = Number(document.querySelector('[name="Quantidade"]').value)
    const resultado = Number(document.querySelector('[name="Resultado"]').value)
    const indPorcentagem = document.getElementById('indPorcentagem')
    const porcentagem = (resultado / quantidade) * 100

    indPorcentagem.innerHTML = porcentagemHtml(porcentagem)

    document.querySelector(`[name="Porcentagem"]`).value = porcentagem
}

async function enviarExcel() {
    const input = document.querySelector('#arquivoExcel');
    if (!input.files.length) return popup(mensagem('Você ainda não selecionou nenhum arquivo'), 'Alerta')

    const formData = new FormData();
    formData.append('arquivo', input.files[0]);

    try {
        const resposta = await fetch('https://leonny.dev.br/processar-tarefas', {
            method: 'POST',
            body: formData
        });

        const dados = await resposta.json();
        if (resposta.ok) {
            popup(mensagem('Arquivo enviado com sucesso!'), 'Alerta')
        } else {
            popup(mensagem(`Erro: ${dados.erro}`), 'Alerta')
        }
    } catch (err) {
        popup(mensagem(`Erro de conexão: ${err}`), 'Alerta')
    }
}

function conversor(stringMonetario) {
    if (typeof stringMonetario === 'number') {
        return stringMonetario;
    } else if (!stringMonetario || stringMonetario.trim() === "") {
        return 0;
    } else {
        stringMonetario = stringMonetario.trim();
        stringMonetario = stringMonetario.replace(/[^\d,]/g, '');
        stringMonetario = stringMonetario.replace(',', '.');
        var valorNumerico = parseFloat(stringMonetario);

        if (isNaN(valorNumerico)) {
            return 0;
        }

        return valorNumerico;
    }
}