({
    appDir: '.',
    baseUrl: '.',
    dir: 'built',
    optimize: 'none',
    modules: [{
        name: 'main'
    }],
    packages: [
        {
            'name': 'foo',
            'location': 'foo',
            'main': 'foo.js'
        },
        {
            'name': 'bar',
            'location': 'bar',
            'main': 'bar.js'
        }
    ],
    shim: {
        'foo': {
            'exports': 'Foo'
        },
        'bar': {
            'deps': ['foo']
        }
        
    }    
})
