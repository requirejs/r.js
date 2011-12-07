var requirejs = require('../../r.js');

//Try an optimization pass.
requirejs.optimize({
    baseUrl: '../../../requirejs/tests',
    name: 'one',
    include: 'dimple',
    out: 'builds/outSingleOpt.js',
    optimize: 'none'
});
