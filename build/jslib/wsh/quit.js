/*global define, WScript */
define(function () {
    return function quit(code) {
        WScript.Quit(code || 0);
    };
});
