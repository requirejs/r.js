({
    appDir: '.',
    baseUrl: 'js',
    dir: '../www-built',
    name: 'lib',

    //Comment this line out to get
    //minified content.
    optimize: 'none',

    //Instruct the r.js optimizer to
    //convert commonjs-looking code
    //to AMD style, which is needed for
    //the optimizer to properly trace
    //dependencies.
    cjsTranslate: true
})
