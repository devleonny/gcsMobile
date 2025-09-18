async function telaOS(idOcorrencia) {

    const ocorrencia = await recuperarDado('dados_ocorrencias', idOcorrencia)
    const cliente = await recuperarDado('dados_clientes', ocorrencia?.unidade)

    let assinatura = ''

    if(ocorrencia.assinatura) {
        assinatura = `
            <br>
            <span>Assinatura do Cliente/Responsável</span><br>
            <img style="width: 15rem;" src="${api}/uploads/GCS/${ocorrencia.assinatura}">
        `
    }

    let imagens = Object.entries(ocorrencia?.fotos || {})
        .map(([link, foto]) => `<img id="${link}" src="${api}/uploads/GCS/${link}" onclick="ampliarImagem(this, '${link}')">`)
        .join('')

    if (imagens == '') imagens = `
        <div class="horizontal-1">
            <img src="${api}/uploads/GCS/img.png" style="width: 2rem;">
            <span>Sem Imagens</span>
        </div>
    `

    const modelo = (texto1, texto2) => `
        <div class="vertical">
            <span><b>${texto1}</b></span>
            <span>${texto2}</span>
        </div>
    `

    const linha1 = `
        <div class="painel-1">

            <div class="painel-0">
                <p><b>Chamado nº ${idOcorrencia}:</b> ${ocorrencia.descricao || 'Sem comentários'}</p>
            </div>

            <div class="horizontal-2">
                <div class="fotos-os">
                    ${imagens}
                </div>

                <div class="vertical">
                    ${modelo('Status Ocorrência', correcoes?.[ocorrencia.tipoCorrecao]?.nome || '')}
                    ${modelo('Prioridade', prioridades?.[ocorrencia.prioridade]?.nome || '')}
                    ${modelo('Tipo Ocorrência', tipos?.[ocorrencia.tipo]?.nome || '')}
                    ${modelo('Data/Hora da Abertura', ocorrencia.dataRegistro)}
                </div>

                <div class="vertical">
                    ${modelo('Unidade de Manutenção', cliente?.nome || '')}
                    ${cliente.cnpj}<br>
                    ${cliente.bairro}<br>
                    ${cliente.cidade}<br>
                    ${cliente.cep}<br>
                </div>

                <div class="vertical">
                    ${modelo('Sistema', sistemas?.[ocorrencia.sistema]?.nome || '')}
                    ${modelo('Solicitante', ocorrencia.solicitante)}
                    ${modelo('Executor', ocorrencia.usuario)}
                </div>
            </div>

        </div>
    `

    let linhasCorrecoes = ''

    for (const [idCorrecao, correcao] of Object.entries(ocorrencia?.correcoes || {})) {

        let imagens = Object.entries(correcao?.fotos || {})
            .map(([link, foto]) => `<img id="${link}" src="${api}/uploads/GCS/${link}" onclick="ampliarImagem(this, '${link}')">`)
            .join('')

        if (imagens == '') imagens = `
            <div class="horizontal-1">
                <img src="${api}/uploads/GCS/img.png" style="width: 2rem;">
                <span>Sem Imagens</span>
            </div>
        `

        const dataRegistro = new Date(Number(Object.keys(correcao.datas)[0])).toLocaleString('pt-BR')

        linhasCorrecoes += `
            <div class="painel-2">

                <div class="fotos-os">
                    ${imagens}
                </div>

                <div class="vertical">

                    <div class="campo-descricao">
                        ${modelo('Correção', correcao.descricao)}
                    </div>
                    
                    <br>

                    <div class="horizontal" style="width: 70%;">
                        ${modelo('Status da Correção', correcoes?.[correcao.tipoCorrecao]?.nome || '')}
                        ${modelo('Registrado em', dataRegistro)}
                        ${modelo('Executor', ocorrencia.usuario)}
                    </div>
                </div>

            </div>
        `
    }

    const acumulado = `

        <div class="botoes-flutuantes">
            <img src="imagens/voltar.png" style="width: 2.5rem;" onclick="telaOcorrencias()">
            <img src="imagens/pdf.png" style="width: 2.5rem;" onclick="gerarOS('${idOcorrencia}')">
        </div>

        <div class="relatorio">

            <style>
        
                .relatorio {
                    width: 95vw;
                    overflow: auto;
                }

                .campo-descricao {
                    width: 98%;
                    background-color: #dfdfdf;
                    padding: 3px;
                    border-radius: 3px;
                }

                .horizontal-1 {
                    padding: 1rem;
                    display: flex;
                    justify-contet: center;
                    align-items: center;
                    gap: 2px;
                }

                .horizontal-2 {
                    width: 100%;
                    display: flex;
                    justify-contet: center;
                    align-items: center;
                    gap: 2px;
                }

                .horizontal-1 span {
                    white-space: nowrap;
                }
                
                .fotos-os {
                    width: 30%;
                    grid-template-columns: repeat(2, 1fr);
                }

                .fotos-os img {
                    margin: 2px;
                    width: 5rem;
                }

                .corpo {
                    min-width: max-content;
                    font-size: 0.8rem;
                    font-family: 'Poppins', sans-serif;
                    border-radius: 5px;
                    padding: 2rem;
                    background-color: white;
                }

                .horizontal {
                    gap: 3px;
                    display: flex;
                    align-items: start;
                    justify-content: start;
                }

                .vertical {
                    width: 100%;
                    display: flex;
                    align-items: start;
                    justify-content: start;
                    flex-direction: column;
                }

                .painel {
                    gap: 0.2rem;
                    display: flex;
                    align-items: start;
                    justify-content: start;
                    flex-direction: column;
                }

                .painel-1 {
                    padding: 0.5rem;
                    width: 100%;
                    background-color: #22874454;
                    border-radius: 5px;
                    border: solid 1px #228743;
                    display: flex;
                    align-items: start;
                    justify-content: center;
                    flex-direction: column;
                }

                .painel-2 {
                    gap: 0.5rem;
                    padding: 0.5rem;
                    width: 100%;
                    border-radius: 5px;
                    border: solid 1px #757575ff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .titulo-os {
                    font-weight: bold;
                    color: #228743;
                    font-size: 1.5rem;
                }

            </style>

            <div class="corpo">

                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span class="titulo-os">Relatório da Ocorrência</span>
                    <img src="https://i.imgur.com/gUcc7iG.png" style="width: 3rem;">
                </div>
                <br>
                <div class="painel">

                    ${linha1}

                    ${linhasCorrecoes}

                    ${assinatura}
                </div>

            </div>

        </div>
    `

    const telaInterna = document.querySelector('.telaInterna')
    telaInterna.innerHTML = acumulado

}

async function gerarOS(idOcorrencia) {

    overlayAguarde()

    try {

        const html = document.querySelector('.relatorio').innerHTML
        await gerarPdfOnline(html, `Relatório OS ${idOcorrencia}`)
    } catch (err) {
        popup(mensagem(`Falha em baixar o PDF: ${err}`), 'Alerta', true)
    }

    removerOverlay()

}

async function gerarPdfOnline(htmlString, nome) {
    return new Promise((resolve, reject) => {
        let encoded = new TextEncoder().encode(htmlString);
        let compressed = pako.gzip(encoded);

        fetch(`${api}/pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: compressed
        })
            .then(response => response.blob())
            .then(blob => {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${nome}.pdf`;
                link.click();
                resolve()
            })
            .catch(err => {
                console.error("Erro ao gerar PDF:", err)
                reject()
            });
    })

}