/**
 * @license RequireJS Copyright (c) 2013, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jshint evil: true */
/*global define, requirejsEnvUtil */

define(function () {
    function load(path) {
        var contents = requirejsEnvUtil.readFile(path);
        return eval(contents);
    }

    return load;
});
