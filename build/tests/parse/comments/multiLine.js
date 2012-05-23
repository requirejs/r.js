/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.0.0zdev Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint regexp: true, nomen: true */
/*global window, navigator, document, importScripts, jQuery, setTimeout, opera */

var requirejs, require, define;
(function (global) {
    'use strict';

    var version = '2.0.0zdev',
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        ostring = Object.prototype.toString,
        ap = Array.prototype,
        aps = ap.slice,
        apsp = ap.splice;
}(this));