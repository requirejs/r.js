{
    //baseUrl: '../../../../../requirejs/tests/shim',
    mainConfigFile: '../../../../../requirejs/tests/shim/basic-tests.js',
    wrapShim: true,

    // Add a shim that was missing: need to make a global.
    shim: {
      'b': {
        deps: ['a', 'd'],
        exports: 'B'
      }
    },
    name: 'basic-tests',
    out: 'basic-tests-built.js',
    optimize: 'none'
}
