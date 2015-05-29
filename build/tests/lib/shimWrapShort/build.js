{
    name: 'main',
    out: 'main-built.js',
    optimize: 'none',
    shim: {
        plugin: ['jquery'],
        plugin2: ['jquery', 'plugin']
    },
    wrapShim: true
}
