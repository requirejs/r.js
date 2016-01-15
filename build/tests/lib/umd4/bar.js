(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(['require', 'exports', 'baz'], factory);
    }
})(function (require, exports) {
    var baz = require('baz');
    exports.name = 'bar';
    exports.baz = baz;
});
