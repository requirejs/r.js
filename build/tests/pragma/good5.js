if (typeof module !== 'undefined' && module.exports) {
    module.exports = jQuery;
}
else if (typeof define !== 'undefined' && define.amd) {
    define([], function () {
        return jQuery;
    });
}
