/**
 * @license Copyright (c) 2013, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint strict: false */
/*global define */

var jsLibXpConnectArgs = [].concat(Array.prototype.slice.call(arguments, 0));

define(function () {
    var args = jsLibXpConnectArgs;

    //Ignore any command option used for r.js
    if (args[0] && args[0].indexOf('-' === 0)) {
        args = args.slice(1);
    }

    return args;
});