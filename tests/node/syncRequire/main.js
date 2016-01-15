var requirejs = require('../../../r.js');

requirejs.config({
    nodeRequire: require
});

var a = requirejs('a');

console.log('syncRequire A ' + (a.name === 'a' ? 'PASSED' : 'FAILED'));
console.log('syncRequire A ' + (a.getB().name === 'b' ? 'PASSED' : 'FAILED'));
