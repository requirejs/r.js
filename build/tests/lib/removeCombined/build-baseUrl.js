{
    baseUrl: 'app/js',
    dir: 'baseUrl-built',
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
