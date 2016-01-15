if (typeof module !== 'undefined' && module.exports) {
    module.exports = jQuery;
}
else if (typeof foo.define !== 'undefined' && foo.define.amd) {
    foo.define([], function () {
        return jQuery;
    });
}
