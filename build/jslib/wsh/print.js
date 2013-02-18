/**
 * @license RequireJS Copyright (c) 2013, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*global define, WScript */

define(function () {
    function print(msg) {
        WScript.Echo(msg);
    }
    return print;
});
