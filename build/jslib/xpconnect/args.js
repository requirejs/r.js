/*jslint strict: false */
/*global define, xpconnectArgs */

var jsLibXpConnectArgs = (typeof xpconnectArgs !== 'undefined' && xpconnectArgs) || [].concat(Array.prototype.slice.call(arguments, 0));

define(function () {
    var args = jsLibXpConnectArgs;

    //Ignore any command option used for main x.js branching
    if (args[0] && args[0].indexOf('-') === 0) {
        args = args.slice(1);
    }

    return args;
});
