function notificacoes(id, titulo, texto) {

    const notificacao = {
        id,
        title: titulo,
        text: texto,
        foreground: true
    }

    if (isAndroid) {
        return cordova.plugins.notification.local.schedule(notificacao)

    } else {

        popupNotificacao(`${titulo} - ${texto}`)

    }

}

