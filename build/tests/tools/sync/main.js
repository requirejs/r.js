var requirejs = require('../../../../r.js'),
    a, b;

requirejs.config({
    baseUrl: __dirname,
    nodeRequire: require
});

/*
requirejs(['a', 'b'], function (a, b) {
    console.log('a: ' + JSON.stringify(a, null, '  '));
    console.log('b: ' + JSON.stringify(b, null, '  '));

});
*/

a = requirejs('a');
b = requirejs('b');
console.log('a: ' + JSON.stringify(a, null, '  '));
console.log('b: ' + JSON.stringify(b, null, '  '));
