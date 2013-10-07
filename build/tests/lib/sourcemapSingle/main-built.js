
/**
 * Module A
 */
define('a',{
    name: 'a',
    doSomething: function (name) {
        console.log('Hello ' + name);
    }
});
console.log('a is done');

/**
 * Module B
 */
define('b',[],function () {
    var name = 'b';
    return {
        name: name
    };
});

/**
 * A test of source maps on a concatenated, but not minified file.
 */
require(['a', 'b'], function (a, b) {
    console.log('a message below:');
    a.doSomething('world');
    console.log('b name: ' + b.name);
});

define("main", function(){});

//# sourceMappingURL=main-built.js.map