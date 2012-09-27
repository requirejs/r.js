{
    baseUrl: 'src',
    dir: 'built',
    optimize: 'none',
    pragmas: {
        fancyExclude: true
    },
    modules: [
        { name: 'main1' },
        { name: 'main2', override: { pragmas: { fancyExclude: false }}}
    ]
}
