(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(['require', 'exports', 'bar'], factory);
    }
})(function (require, exports) {
    var bar = require('bar');
    console.log(bar.name);
});