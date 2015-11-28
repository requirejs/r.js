(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["./a"], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./a'));
    } else {
        root.b = factory(root.a);
    }
}(this, function (a) {
    var b = function() {
        this._someNumber = 0;
        this._a = new a();
    };
    b.prototype._a = null;
    b.prototype._someNumber = 0;
    b.prototype.getA = function() {
        return this._a;
    };
    b.prototype.getSomeNumber = function() {
        return this._someNumber;
    };
    b.prototype.setSomeNumber = function(num) {
        this._someNumber = num;
    };
    return b;
}));