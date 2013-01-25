var requirejs = require('../../../r.js'),
    a = requirejs('plug!a');

console.log('"A (SHOULD BE UPPERCASE)" === "' + a.name + '"');
