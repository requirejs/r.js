if ("function" === typeof define && define.amd) {
    define(function (require) {
        return {
            name: 'five',
            six: require('./six')
        };
    });
}
