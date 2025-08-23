function notificacoes(id, titulo, texto) {
    cordova.plugins.notification.local.schedule({
        id,
        title: titulo,
        text: texto,
        foreground: true
    });
}