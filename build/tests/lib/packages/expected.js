
define('foo/util',{
    name: 'util'
});

define('foo/main',['./util'], function (util) {
    return {
        name: 'foo',
        util: util
    };
});

define('foo', ['foo/main'], function (main) { return main; });

requirejs.config({
    packages: [
        {
            name: 'foo',
            main: 'main'
        }
    ]
});

define('main',['foo'], function (foo) {
    return foo;
});
