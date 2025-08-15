const meses = {
    '01': 'Janeiro',
    '02': 'Fevereiro',
    '03': 'Março',
    '04': 'Abril',
    '05': 'Maio',
    '06': 'Junho',
    '07': 'Julho',
    '08': 'Agosto',
    '09': 'Setembro',
    '10': 'Outubro',
    '11': 'Novembro',
    '12': 'Dezembro'
}

const semana = {
    1: 'Domingo',
    2: 'Segunda',
    3: 'Terça', 
    4: 'Quarta',
    5: 'Quinta',
    6: 'Sexta',
    7: 'Sábado'
}

const anos = {
    '2025': 2025,
    '2026': 2026
}

mostrarFolha()


async function mostrarFolha() {

    titulo.textContent = 'Registo de Ponto'

    const esquema = [
        'Empresa',
        'Nome',
        'Nif',
        'Segurança Social',
        'Mês',
        'Horas Estimadas',
        'Horas Reais',
        'Dias Trabalhados',
        'Horas Diárias',
        'Hora de Entrada',
        'Hora de Refeição'
    ]

    const ths = ['Data', 'Dia da Semana', 'Entrada', 'Saída', 'Total', 'Diferença']
        .map(op => `<th>${op}</th>`).join('')

    const trs = esquema
        .map(op => `
            <tr>
                <td>${op}:</td>
                <td></td>
            </tr>
            `).join('')

    const modelo = (titulo, elemento) => `
        <div class="campos">
            <span>${titulo}</span>
            ${elemento}
        </div>
    `

    const optionsSelect = (obj) => {
        if(!obj) return
        let elemento = ''
        for(const [id, info] of Object.entries(obj).sort()){
            elemento += `<option value="${id}">${info}</option>`
        }
        return elemento
    }

    const acumulado = `
        
        <div class="painelFiltros">
            ${modelo('Ano', `<select name="ano" onchange="criarFolha()">${optionsSelect(anos)}</select>`)}
            ${modelo('Mês', `<select name="mes" onchange="criarFolha()">${optionsSelect(meses)}</select>`)}
        </div>

        <div class="folha">
            <div class="cabecalho">
                <h1>Registo de Ponto</h1>
                <img src="imagens/logo.png">
            </div>
            <div class="tabCab">
                <table>
                    <tbody>
                        ${trs}
                    </tbody>
                </table>
            </div>
            <table class="tabelaPonto">
                <thead>
                    <tr>${ths}</tr>
                </thead>
                <tbody id="bodyFolha"></tbody>
            </table>
        </div>
    `

    tela.innerHTML = acumulado

    criarFolha()

}

function criarFolha() {

    const ano = Number(document.querySelector('[name="ano"]').value)
    const mesString = document.querySelector('[name="mes"]').value
    const mes = Number(mesString)
    const ultimoDia = new Date(ano, mes, 0).getDate()
    const body = document.getElementById('bodyFolha')

    let trs = ''

    for(let i = 1; i <= ultimoDia; i++) {
        const data = new Date(ano, mes, i)
        const semana = 
        trs += `
        <tr>
            <td>${data.toLocaleDateString()}</td>
            <td>${data}</td>
            <td>${1}</td>
            <td>${1}</td>
            <td>${1}</td>
            <td>${1}</td>
        </tr>
        `
    }

    body.innerHTML = trs

}