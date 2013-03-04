var requirejsAsLib = true;
load('../../r.js');

requirejs.optimize({
    name: 'main',
    out: 'main-built.js',
    optimize: 'none'
}, function (results) {
    print(results);
}, function (err) {
    print('GOT ERROR: ' + err);
});

