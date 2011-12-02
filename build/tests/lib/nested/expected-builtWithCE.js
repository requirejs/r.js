
define('b',{
    name: 'b'
});
define('e',{
    name: 'e'
});
define('a',['require','b'],function(require) {
    var b = require('b');

    require(['e'], function (e) {
        
    });

    return {
        name: 'a',
        b: b
    };
});

define('c',{
    name: 'c'
});
define('top',['require', 'a'], function (require, a) {
    require(['c'], function (c) {

    });
});

define('d',{
    name: 'd'
});
require(['top', 'd'], function () {

});

define("main", function(){});
