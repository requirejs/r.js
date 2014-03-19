/**
 * @license RequireJS Copyright (c) 2010-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint strict: false */
/*global define: false, console: false */

define(['./file'], function (file) {
    function load(fileName) {
        eval(file.readFile(fileName));
    }

    return load;
});
