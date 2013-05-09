define('myLib',[],function () {
    return 'myLib';
});

// if the module has no dependencies, the above pattern can be simplified to
(function (root, factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('myLib2',factory);
    } else {
        // Browser globals (root is window)
        root.myLib2 = factory();
    }
}(this, function () {

    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return 'myLib2';
}));

(function(define) {
    define('myLib3',[],function () {
        return 'myLib3';
    });
})(
    typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(); }
);
