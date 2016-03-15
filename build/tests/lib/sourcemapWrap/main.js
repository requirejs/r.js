(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["./a", "./b"], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./a'), require('./b'));
    } else {
        root.main = factory(root.a, root.b);
    }
}(this, function(a, b) {
    var mainClass = function() {
        this._a = new a();
        this._b = new b();
    };
    mainClass.prototype._a = null;
    mainClass.prototype._b = null;
    mainClass.prototype.getA = function() {
        return this._a;
    };
    mainClass.prototype.getB = function() {
        return this._b;
    };
    return mainClass;
}));