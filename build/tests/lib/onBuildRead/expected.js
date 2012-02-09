
define('b',{
    name: 'b'
}
);
define('a',['require','b'],function (require) {
    var b = require('b');

    return {
        name: 'a',
        b: b
    };

});
require(['a'], function () {

});

define("main", function(){});
