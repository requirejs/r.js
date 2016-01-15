(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./foo', './bar'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./foo'), require('./bar'));
    } else {
        root.main = factory(root.foo, root.bar);
    }
}(this, function (foo, bar) {
    /**
     * The main module.
     * @module main
     */
    var exports = {
        /**
         * Our foo value.
         * @type {string}
         */
        mainFoo: foo.fooValue,
        /**
         * Our bar value.
         * @type {number}
         */
        mainBar: bar.barValue
    };
    return exports;
}));