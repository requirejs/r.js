({
    appDir: '.',
    baseUrl: 'js',
    dir: '../www-built',
    optimize: 'none',

    rawText: {
        'main': 
            'require([\'a\'], function(a) {' + 
            '    console.log(a);' + 
            '    require([\'b\'], function(b) {' + 
            '        console.log(b);' + 
            '    });' + 
            '});'
    },

    modules: [{
        name: 'main',    
    }, {
        name: 'b',
        exclude: ['main']
    }]    
})
