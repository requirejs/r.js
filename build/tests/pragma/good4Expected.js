if ( typeof module === "object" && module && typeof module.exports === "object" ) {
    module.exports = jQuery;
}

if (typeof foo.define !== 'undefined') {
    foo.define([], function () {
        return jQuery;
    });
}
