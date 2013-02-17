/**
 * @license Copyright (c) 2013, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint */
/*global define WScript */

define(function () {
    var i,
        args = [],
        wargs = WScript.Arguments;

    for (i = 0; i < wargs.length; i++) {
        args.push(wargs(i));
    }

    //Ignore any command option used for r.js
    if (args[0] && args[0].indexOf('-' === 0)) {
        args = args.slice(1);
    }

    return args;
});
