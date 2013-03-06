
/**
 * Module A
 */
define('a',{
    name: 'a'
});

/**
 * Module B
 */
define('b',{
    name: 'b'
});

/**
 * A test of source maps on a concatenated, but not minified file.
 */
require(['a', 'b'], function (a, b) {
    console.log('a name: ' + a.name);
    console.log('b name: ' + b.name);
});

define("main", function(){});

//@ sourceMappingURL=main.js.map