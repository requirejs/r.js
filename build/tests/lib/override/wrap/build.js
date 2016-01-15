({
    baseUrl: './',
    optimize: 'none',
    dir: 'built',
    wrap: {
        start: '//START',
        end: '//END'
    },
    modules: [
        {
            name: 'a'
        },
        {
            name: 'b',
            override: {
                wrap: true
            }
        },
        {
            name: 'c'
        }
    ]
})

