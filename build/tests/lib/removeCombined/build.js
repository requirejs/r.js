{
    appDir: 'app',
    baseUrl: 'js',
    dir: 'app-built',
    optimize: 'none',
    removeCombined: true,
    modules: [
        {
            name: 'main'
        },
        {
            name: 'secondary',
            exclude: ['main']
        }
    ]
}
