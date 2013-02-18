/**
 * @license RequireJS Copyright (c) 2013, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*global define, WScript, requirejsEnvUtil */

define(function () {
    function print() {
        WScript.Echo(requirejsEnvUtil.wshFormatArgs(arguments));
    }
    return print;
});
