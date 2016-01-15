/**
 * @license RequireJS Copyright (c) 2012-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint strict: false */
/*global define: false, load: false */

//Needed so that rhino/assert can return a stub for uglify's consolidator.js
define(['assert'], function (assert) {
    return assert;
});
