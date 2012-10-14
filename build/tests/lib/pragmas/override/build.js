{
    baseUrl: 'src',
    dir: 'built',
    optimize: 'none',
    pragmas: {
        sharedInclude: true,
        fancyExclude: true,
        funnyInclude: false
    },
    modules: [
        { name: 'main1' },
        { name: 'main2', override: { pragmas: { fancyExclude: false, funnyInclude: true }}}
    ]
}
