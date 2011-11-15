({
    baseUrl: '.',
    dir: 'built',
    optimize: 'none',
    paths: {
        'empty1': 'empty:',
        'empty2': 'empty:'
    },
    modules: [{
        name: 'main',
        include: ['sub2']
    }]
})
