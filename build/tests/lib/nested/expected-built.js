
define('b',{
    name: 'b'
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

//Make sure named modules are scanned for nested dependencies.
define('top', ['require', 'a'], function (require, a) {
    foo.bar.include({
        renderUI: function () {
            require(['c'], function (c) {

            });
        }
    });
});

define('d',{
    name: 'd'
});
require(['top', 'd'], function () {

});

define("main", function(){});
