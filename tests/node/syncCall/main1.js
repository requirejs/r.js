var requirejs = require('../../../r.js'),
    foo = requirejs('foo');

console.log('"foo" === "' + foo.name + '"');
console.log('"A (SHOULD BE UPPERCASE)" === "' + foo.a.name + '"');
