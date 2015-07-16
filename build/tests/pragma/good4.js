if ( typeof module === "object" && module && typeof module.exports === "object" ) {
    module.exports = jQuery;
}

if ( typeof define !== "undefined" ) {
    define([], function () {
        return jQuery;
    });
}
