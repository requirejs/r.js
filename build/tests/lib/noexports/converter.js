(function (factory) {
    if (typeof exports !== 'undefined') {
        // Node/CommonJS
        factory(exports);
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['exports'], factory);
    }


}(function (exports) {
    exports.version = '2';
    exports.convert = function (text) {
        return text.toUpperCase();
    };
}));
