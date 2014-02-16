define('enabled',{
    load: function (name, require, load, config) {
        if (config.enabled[name]) {
            require([name], load);
        } else {
            load();
        }
    }
});

define('alpha',{
    name: 'alpha'
});



define('beta',{
    name: 'beta'
});


define('foo/main',{
    name: 'foo'
});

define('foo', ['foo/main'], function (main) { return main; });

define('bar/main',{
    name: 'bar'
});

define('bar', ['bar/main'], function (main) { return main; });

requirejs.config({
    paths: {
        'alpha': 'sub/wrong-did-not-multi',
        'dep2': 'sub/wrong-did-not-multi'
    },
    enabled: {
        alpha: true
    },

    packages: ['foo'],

    //Made up values just to test nested merging skip logic.
    someRegExp: /foo/,
    someFunc: function () {},
    someArray: ['three', 'four']
});

requirejs(['enabled!alpha', 'enabled!gamma', 'enabled!beta', 'foo', 'bar'], function () {
});

define("main", function(){});

