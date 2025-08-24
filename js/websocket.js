let socket;
let reconnectInterval = 30000;

function connectWebSocket() {
    socket = new WebSocket(`${api}:8443`);

    socket.onopen = () => {
        if (acesso) socket.send(JSON.stringify({ tipo: 'autenticar', usuario: acesso.usuario }));
        console.log(`🟢🟢🟢 WS ${new Date().toLocaleString('pt-BR')} 🟢🟢🟢`);
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.base == 'dados_ocorrencias') {
            if (data.objeto.executor == acesso.usuario) {
                notificacoes(data.id, `Chamado ${data.id} atualizado`, `${empresas[data.objeto.empresa].nome} - Solicitado por ${data.objeto.solicitante}`)
            }
        }

        if (data.base == 'dados_setores') {
            inserirDados({ [data.id]: data.objeto }, 'dados_setores')

            //criarLinha() verificando antes o elemento id existe;

            if (data.id == acesso.usuario) {
                localStorage.setItem('acesso', JSON.stringify(data.objeto))
                telaPrincipal()
                popup(mensagem('Seu acesso foi atualizado', 'imagens/concluido.png'), 'Alerta')
            }
        }

        if (data.tipo == 'usuarios_online') localStorage.setItem('usuariosOnline', JSON.stringify(data.usuarios))

    };

    socket.onclose = () => {
        console.log(`🔴🔴🔴 WS ${new Date().toLocaleString('pt-BR')} 🔴🔴🔴`);
        console.log(`Tentando reconectar em ${reconnectInterval / 1000} segundos...`);
        setTimeout(connectWebSocket, reconnectInterval);
    };

}