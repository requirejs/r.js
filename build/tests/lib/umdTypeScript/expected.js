(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define('lib',deps, factory);
    }
})(['require', 'exports'], function (require, exports) {
    console.log('');
});


(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define('main',deps, factory);
    }
})(['require', 'exports', 'lib'], function (require, exports) {
    var lib = require('lib');
});
