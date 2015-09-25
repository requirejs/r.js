(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define('baz',['require', 'exports'], factory);
    }
})(function (require, exports) {
    exports.name = 'baz';
});

(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define('bar',['require', 'exports', 'baz'], factory);
    }
})(function (require, exports) {
    var baz = require('baz');
    exports.name = 'bar';
    exports.baz = baz;
});

(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define('app',['require', 'exports', 'bar'], factory);
    }
})(function (require, exports) {
    var bar = require('bar');
    console.log(bar.name);
});
