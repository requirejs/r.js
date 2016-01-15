(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory());
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.foo = factory();
    }
}(this, function () {
    /**
     * The foo module.
     * @module foo
     */
    var exports = {
        /**
         * The foo value.
         * @type {string}
         */
        fooValue: "A foo value"
    };
    return exports;
}));