/**
 * A test of source maps with preserved license comments on an uglified file.
 */
require(['a', 'b'], function (a, b) {
    console.log('a message below:');
    a.doSomething('world');
    console.log('b name: ' + b.name);
});
