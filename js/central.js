const tela = document.getElementById('tela')
const toolbar = document.querySelector('.toolbar')
const titulo = toolbar.querySelector('span')
const horizontal = `display: flex; align-items: center; justify-content: center;`
const vertical = `display: flex; align-items: start; justify-content: start; flex-direction: column`
const nomeBaseCentral = 'GCSMob'
const nomeStore = 'Bases'
let acesso = {}
let app = 'clone'
const api = `https://api.gcs.app.br`
const esquemaLinhas = {
    'dados_clientes': ['nome', 'cnpj', 'cidade'],
    'dados_composicoes': ['codigo', 'descricao', 'unidade', 'modelo', 'fabricante'],
    'dados_setores': ['nome_completo', 'setor', 'permissao'],
    default: ['nome']
}
const modelo = (valor1, valor2) => `
        <div style="gap: 3px; display: flex; flex-direction: column; align-items: start; margin-bottom: 5px; width: 100%;">
            <label><strong>${valor1}</strong></label>
            <div style="width: 100%; text-align: left;">${valor2}</div>
        </div>
        `
const modeloCampos = (valor1, elemento) => `
    <div style="${horizontal}; gap: 5px; width: 100%;">
        <label style="width: 30%; text-align: right;"><strong>${valor1}</strong></label>
        <div style="width: 70%; text-align: justify; padding-right: 1vw;">${elemento}</div>
    </div>`
const botao = (texto, funcao, bgColor) => `<button style="background-color: ${bgColor}" onclick="${funcao}">${texto}</button>`
const botaoImg = (img, funcao) => `
    <div class="botaoImg">
        <img src="imagens/${img}.png" onclick="${funcao}">
    </div>
`
const teste = (el) => `
<div style="background-color: #d2d2d2;">
    ${el}
</div>
`
const dtFormatada = (data) => {
    if (!data) return '--'
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
}
const modeloTabela = (colunas, base, btnExtras) => {

    const ths = colunas
        .map(col => `<th>${col}</th>`).join('')

    const thead = (colunas && colunas.length > 0) ? `<thead>${ths}</thead>` : ''

    return `
    <div class="blocoTabela">
        <div class="painelBotoes">
            <div class="botoes">
                <div class="pesquisa">
                    <input oninput="pesquisar(this, 'body')" placeholder="Pesquisar" style="width: 100%;">
                    <img src="imagens/pesquisar2.png">
                </div>
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

const mensagem = (mensagem, imagem) => `
    <div class="mensagem">
        <img src="${imagem || 'gifs/alerta.gif'}">
        <label>${mensagem}</label>
    </div>
    `
const btnRodape = (texto, funcao) => `
    <button class="btnRodape" onclick="${funcao}">${texto}</button>
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

if (typeof cordova !== "undefined") {
    document.addEventListener('deviceready', () => {
        telaLogin();
    }, false);
} else {
    telaLogin();
}

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

async function acessoLogin() {

    overlayAguarde()
    const divAcesso = document.getElementById('acesso')
    divAcesso.style.display = 'none'

    const inputs = divAcesso.querySelectorAll('input')
    const url = `${api}/acesso`

    if (inputs[0].value == '' || inputs[1].value == '') {
        popup(mensagem('Senha e/ou usuário não informado(s)'), 'ALERTA', true)
        divAcesso.style.display = 'flex'

    } else {

        const requisicao = {
            tipoAcesso: 'login',
            app,
            dados: {
                usuario: inputs[0].value,
                senha: inputs[1].value
            }
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requisicao)
            })
            if (!response.ok) {
                const err = await response.json()
                throw err
            }

            const data = await response.json()

            if (data.mensagem) {
                divAcesso.style.display = 'flex'
                return popup(mensagem(data.mensagem), 'Alerta', true);

            } if (data.permissao == 'novo') {
                popup(mensagem('Alguém do setor de SUPORTE precisa autorizar sua entrada', 'imagens/concluido.png'), 'ALERTA', true)
            } else if (data.permissao !== 'novo') {
                localStorage.setItem('acesso', JSON.stringify(data));
                telaPrincipal()
                removerOverlay()
            }

            divAcesso.style.display = 'flex'

        } catch (e) {
            popup(mensagem(e), 'Alerta', true);
        }

    }
}

// NOVO USUÁRIO;
async function salvarCadastro() {

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

        let requisicao = {
            tipoAcesso: 'cadastro',
            dados: {
                usuario,
                senha,
                email,
                nome_completo,
                telefone
            }
        }

        try {
            const response = await fetch(`${api}/acesso`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requisicao)
            })
            if (!response.ok) {
                const err = await response.json()
                throw err
            }

            const data = await response.json()

            divAcesso.style.display = 'flex'
            return popup(mensagem(data.mensagem), 'Alerta');

        } catch (e) {
            popup(mensagem(e), 'Alerta', true);
        }

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
    const aguarde = document.querySelector('.aguarde');
    if (aguarde) aguarde.remove();

    const elemento = `
        <div class="aguarde">
            <img src="gifs/loading.gif">
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', elemento);

    const style = document.createElement('style');
    style.innerHTML = `
        .aguarde {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        }
        .aguarde img {
            max-width: 100px;
        }
    `;
    document.head.appendChild(style);
}

async function telaPrincipal() {

    acesso = JSON.parse(localStorage.getItem('acesso'))
    toolbar.style.display = 'flex'
    const acumulado = `
        <div class="menu-container">

            <div class="side-menu" id="sideMenu">

                <span class="nomeUsuario">${acesso.usuario} <strong>${acesso.permissao}</strong></span>

                <div style="${vertical}; justify-content: space-between; height: 100%;">
                    
                    <div class="botoesMenu">

                        ${btn('configuracoes', 'Ocorrências', 'telaOcorrencias()')}
                        ${btn('kanban', 'Dashboard', 'dashboard()')}
                        ${btn('empresa', 'Unidades', 'telaUnidades()')}
                        ${btn('composicoes', 'Equipamentos', 'telaEquipamentos()')}
                        ${btn('perfil', 'Usuários', 'telaUsuarios()')}
                        ${btn('ajustar', 'Cadastros', 'telaCadastros()')}
                        ${btn('sair', 'Desconectar', 'deslogar()')}

                    </div>

                </div>
            </div>

            <div class="telaInterna">
                <div class="planoFundo">
                    <img src="imagens/BG.png">
                </div>
            </div>
        </div>
    `

    tela.innerHTML = acumulado

    dados_distritos = await recuperarDados('dados_distritos')
    await sincronizarSetores()

}

async function telaUsuarios() {

    esconderMenus()
    titulo.textContent = 'Usuários'
    const colunas = ['Nome', 'Setor', 'Permissão', '']
    await carregarElementosPagina('dados_setores', colunas)

}

async function criarLinha(dados, id, nomeBase) {

    const modelo = (texto) => {
        return `
        <td>
            <div class="camposTd">
                <span>${texto}</span>
            </div>
        </td>`
    }

    let tds = ''
    let funcao = ''

    const colunas = esquemaLinhas?.[nomeBase] || esquemaLinhas.default

    for (const linha of colunas) tds += modelo(dados?.[linha] || '--')

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

async function salvarConfigs() {

    const emailFolha = document.getElementById('emailFolha').value
    const emailAlertas = document.getElementById('emailAlertas').value

    const configuracoes = {
        emailFolha,
        emailAlertas
    }

    await enviar('configuracoes', configuracoes)
    await inserirDados(configuracoes, 'configuracoes')

    popup(mensagem('Configurações Salvas', 'imagens/concluido.png'), 'Sucesso', true)
}

function verificarClique(event) {
    const menu = document.getElementById('sideMenu');
    if (menu && menu.classList.contains('active') && !menu.contains(event.target)) menu.classList.remove('active')
}

async function sincronizarDados(base, overlayOff) {

    if (!overlayOff) overlayAguarde()

    let nuvem = await receber(base) || {}
    await inserirDados(nuvem, base)

    if (!overlayOff) removerOverlay()
}

async function atualizarDados(base) {

    overlayAguarde()
    await sincronizarDados(base)

    const dados = await recuperarDados(base)
    for (const [id, objeto] of Object.entries(dados).reverse()) criarLinha(objeto, id, base)
    removerOverlay()

}

function deslogar() {
    localStorage.removeItem('acesso')
    telaLogin()
}

function esconderMenus() {
    const sideMenu = document.getElementById('sideMenu');
    sideMenu.classList.toggle('active');
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

function telaLogin() {

    acesso = JSON.parse(localStorage.getItem('acesso'))
    if (acesso) return telaPrincipal()

    toolbar.style.display = 'none'

    const acumulado = `
        
        <div id="acesso" class="loginBloco">

            <div class="botaoSuperiorLogin">
                <span>Painel de acesso ao GCS</span>
            </div>

            <div class="baixoLogin">

                <br>

                <img src="imagens/GrupoCostaSilva.png" class="cadeado">
                
                <div style="padding: 20px; display: flex; flex-direction: column; align-items: start; justify-content: center;">

                    <label>Usuário</label>
                    <input type="text" placeholder="Usuário">

                    <label>Senha</label>
                    <div style="${horizontal}; gap: 10px;">
                        <input type="password" placeholder="Senha">
                        <img src="imagens/olhoFechado.png" class="olho" onclick="exibirSenha(this)">
                    </div>

                    <br>
                    <button onclick="acessoLogin()">Entrar</button>

                </div>
                <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
                    <label>Primeiro acesso?</label>
                    <button style="background-color: #097fe6; white-space: nowrap;" onclick="cadastrar()">Cadastre-se</button>
                </div>
                <br>
            </div>

        </div>
    `

    tela.innerHTML = acumulado
}

// API
function enviar(caminho, info) {
    return new Promise((resolve) => {
        let objeto = {
            caminho: caminho,
            valor: info,
            app
        };

        fetch(`${api}/salvar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objeto)
        })
            .then(data => resolve(data))
            .catch((erro) => {
                console.mensagem(erro);
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
        app,
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
        fetch(`${api}/dados`, obs)
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
                popup(mensagem(`Erro de conexão: ${err}`))
                resolve({})
            });
    })
}

async function deletar(chave) {
    const url = `${api}/deletar`;
    const objeto = {
        chave,
        usuario: acesso.usuario,
        app
    }

    return new Promise((resolve) => {
        fetch(url, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objeto)
        })
            .then(response => response.json())
            .then(data => {
                resolve(data);
            })
            .catch((err) => {
                popup(mensagem(err), 'Aviso', true)
                resolve();
            });
    });
}

async function configuracoes(usuario, campo, valor) {

    let dados_usuario = await recuperarDado('dados_setores', usuario)
    dados_usuario[campo] = valor
    await inserirDados({ [usuario]: dados_usuario }, 'dados_setores')
    criarLinha(dados_usuario, usuario, 'dados_setores')

    return new Promise((resolve, reject) => {
        fetch(`${api}/configuracoes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, campo, valor, app })
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
                console.mensagem(err)
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

    const nuvem = await listaSetores(timestamp)

    await inserirDados(nuvem, 'dados_setores')

    dados_setores = await recuperarDados('dados_setores')

    acesso = dados_setores[acesso.usuario]
    localStorage.setItem('acesso', JSON.stringify(acesso))

}

async function listaSetores(timestamp) {
    try {
        const response = await fetch(`${api}/setores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timestamp })
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

function pesquisar(input, idTbody) {
    const termo = input.value.trim().toLowerCase();
    const tbody = document.getElementById(idTbody);
    const trs = tbody.querySelectorAll('tr');

    trs.forEach(tr => {
        const tds = tr.querySelectorAll('td');
        let encontrou = false;

        tds.forEach(td => {
            let texto = td.textContent.trim().toLowerCase();

            const inputInterno = td.querySelector('input, textarea, select');
            if (inputInterno) {
                texto += ' ' + inputInterno.value.trim().toLowerCase();
            }

            if (termo && texto.includes(termo)) {
                encontrou = true;
            }
        });

        if (!termo || encontrou) {
            tr.style.display = ''; // mostra
        } else {
            tr.style.display = 'none'; // oculta
        }
    });
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

function ID5digitos() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 5; i++) {
        const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
        id += caracteres.charAt(indiceAleatorio);
    }
    return id;
}

async function importarAnexos({ input, foto }) {
    const formData = new FormData();

    if (foto) {
        const imagem = base64ToFile(foto);
        formData.append('arquivos', imagem);
    } else {
        for (const file of input.files) {
            formData.append('arquivos', file);
        }
    }

    try {
        const response = await fetch(`${api}/upload/RECONST`, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    } catch (err) {
        popup(mensagem(`Erro na API: ${err}`));
        throw err;
    }
}

function criarAnexoVisual({ nome, link, funcao }) {

    let displayExcluir = 'flex'

    if (!funcao) displayExcluir = 'none'

    return `
        <div class="contornoAnexos" name="${link}">
            <div onclick="abrirArquivo('${link}', '${nome}')" class="contornoInterno">
                <img src="imagens/anexo2.png">
                <label title="${nome}">${nome}</label>
            </div>
            <img src="imagens/cancel.png" style="display: ${displayExcluir};" onclick="${funcao}">
        </div>`
}

function abrirArquivo(link, nome) {
    link = `${api}/uploads/RECONST/${link}`;
    const imagens = ['png', 'jpg', 'jpeg'];

    const extensao = nome.split('.').pop().toLowerCase(); // pega sem o ponto

    if (imagens.includes(extensao)) {
        const acumulado = `
            <div class="fundoImagens">
                <img src="${link}">
            </div>
        `
        return popup(acumulado, nome, true);
    }

    window.open(link, '_blank');
}

async function cxOpcoes(name, nomeBase, funcaoAux) {

    const campos = esquemaLinhas?.[nomeBase] || esquemaLinhas.default
    const base = await recuperarDados(nomeBase)
    let opcoesDiv = ''

    for ([cod, dado] of Object.entries(base)) {

        const labels = campos
            .map(campo => `${(dado[campo] && dado[campo] !== '') ? `<label>${dado[campo]}</label>` : ''}`)
            .join('')

        opcoesDiv += `
            <div name="camposOpcoes" class="atalhos" onclick="selecionar('${name}', '${cod}', '${dado[campos[0]]}' ${funcaoAux ? `, '${funcaoAux}'` : ''})">
                ${labels}
            </div>`
    }

    const acumulado = `
        <div style="${horizontal}; justify-content: left; background-color: #b1b1b1;">

            <div class="pesquisa">
                <input oninput="pesquisarCX(this)" placeholder="Pesquisar" style="width: 100%;">
                <img src="imagens/pesquisar2.png">
            </div>

        </div>
        <div class="gavetaOpcoes">
            ${opcoesDiv}
        </div>
        <div class="rodapeTabela"></div>
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

async function mobi7({ base, usuarioMobi7, dtInicial, dtFinal }) {
    return new Promise((resolve, reject) => {
        fetch(`${api}/mobi7`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base, usuarioMobi7, dtInicial, dtFinal })
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

function inicialMaiuscula(string) {
    if (string == undefined) {
        return ''
    }
    string.includes('_') ? string = string.split('_').join(' ') : ''

    if (string.includes('lpu')) return string.toUpperCase()
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}