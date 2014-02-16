define('foo', ['require'],function (util) {
    return {
        name: 'foo'
    };
});

define("foo/foo", function(){});

requirejs.config({
    packages: [
        {
            name: 'foo',
            main: 'foo'
        }
    ]
});

define('main',['foo'], function (foo) {
    return foo;
});

