/**
 * A test of source maps on a concatenated, but not minified file.
 */
require(['a', 'b'], function (a, b) {
    console.log('a message below:');
    a.doSomething('world');
    console.log('b name: ' + b.name);
});
