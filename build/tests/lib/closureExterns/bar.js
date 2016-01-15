(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory());
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.bar = factory();
    }
}(this, function () {
    /**
     * The bar module.
     * @module bar
     */
    var exports = {
        /**
         * The bar value.
         * @type {number}
         */
        barValue: 42
    };
    return exports;
}));