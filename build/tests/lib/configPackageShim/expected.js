
var Foo = {
    foo: function () {
        console.log('foooo');
    }
}
;
define('foo', ['foo/foo'], function (main) { return main; });

define("foo/foo", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.Foo;
    };
}(this)));

define('bar', ['foo'], function (foo) {
    return {
        bar: function () {
            console.log('barrrr');
            foo.foo();
        }
    }
});

define("bar/bar", ["foo"], function(){});

require.config({
    packages: [
        {
            'name': 'foo',
            'location': 'foo',
            'main': 'foo.js'
        },
        {
            'name': 'bar',
            'location': 'bar',
            'main': 'bar.js'
        }
    ],
    shim: {
        'foo': {
            'exports': 'Foo'
        },
        'bar': {
            'deps': ['foo']
        }
        
    }    
});
require(
['bar'],
function (bar) {
    console.log('main');
    bar.bar();
});

define("main", function(){});
