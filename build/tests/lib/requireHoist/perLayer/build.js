{
    baseUrl: 'src',
    dir: 'built',
    optimize: 'none',
    paths: {
        requireLib: 'require'
    },
    modules: [
        { name: 'main1', include: ['requireLib'] },
        { name: 'main2', include: ['requireLib'] }
    ]
}
