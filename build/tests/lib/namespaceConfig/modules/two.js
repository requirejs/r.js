if (typeof define === 'function' && define.amd && define.amd.jQuery) {
    define(function (require, exports, module) {
        return {
            name: 'two',
            color: module.config().color
        };
    });
}
