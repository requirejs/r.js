(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.a = factory();
    }
}(this, function() {
    var a = function() {
        this._someString = "";
    };
    a.prototype._someString = "";
    a.prototype.getSomeString = function() {
        return this._someString;
    };
    a.prototype.setSomeString = function(str) {
        this._someString = str;
    };
    return a;
}));