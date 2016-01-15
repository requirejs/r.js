var requirejs = require('../../r.js');



//Try an optimization pass.
requirejs.optimize({
    baseUrl: '../../../requirejs/tests',
    name: 'one',
    include: 'dimple',
    out: 'builds/outSingleOpt.js',
    optimize: 'none'
}, function (resultText) {
    console.log('requirejs.optimize:\n===================\n' + resultText);

    //Test error path
    requirejs.optimize({
        baseUrl: 'lib/missingDep',
        name: 'main',
        optimize: 'none',
        out: 'lib/missingDep/out.js'
    }, function () {
        console.log('nodeOptimize.js: callback called. THIS SHOULD BE AN ERROR');
        process.exit(1);
    }, function (err) {
        console.log('nodeOptimize.js: error path for requirejs.optimize() correctly called: ' + err);
        console.log('');
    });
});
