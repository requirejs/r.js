if ( typeof module === "object" && module && typeof module.exports === "object" ) {
    module.exports = jQuery;
} else {
    if ( typeof foo.define === 'function' && foo.define.amd ) {
        foo.define( "jquery", [], function () { return jQuery; } );
    }
}
