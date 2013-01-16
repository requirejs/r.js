
var faker = new function () {

    function define(obj, name, desc) {

    }

    if (something) {
        define(this, 'base', {});
    }

    define(a, b, c);

    function other () {
        define(this, '__proto__', {});
    }
};

define("faker", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.faker;
    };
}(this)));

requirejs.config({
    shim: {
        faker: {
            exports: 'faker'
        }
    }
});

require(['faker'], function (faker) {
    console.log(faker);
});

define("main", function(){});
