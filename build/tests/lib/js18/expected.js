
define('a',['require'],function (require) {
    const name = 'a';

    return {
        name: name,
        other: 'other'
    };
});

define('main',['require','a'],function (require) {
    let a = require('a');
    var {name, other} = a;
});

require(["main"]);
