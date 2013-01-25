{
    baseUrl: 'src',
    dir: 'built',
    optimize: 'none',
    stubModules: ['c'],
    modules: [
        {
            name: 'first',
            stubModules: ['a']
        },
        {
            name: 'second',
            stubModules: ['b']
        }
    ]
}
