/**
 * Sample showing how you might override one of the core modules used inside
 * requirejs for a build.
 *
 * To get this example to work:
 *
 * npm install uglify-js
 */

/*jslint strict: false */
/*global require: false */

var uglify = require('uglify-js'),
    requirejs = require('../../../../r.js');

//Register the replacement module. Note that for uglifyjs, r.js uses the
//"uglifyjs/index" module name for it. The list of replaceable modules
//can be found in r.js/
requirejs.define('uglifyjs/index', [], function () {
    return uglify;
});

//Do the build.
requirejs.optimize({
    baseUrl: "../../../../../requirejs/tests",
    name: "one",
    include: "dimple",
    out: "one-built.js",
    //Usually requirejs.optimize() runs in "silent mode"
    //when called in this way. Use logLevel to get the
    //normal output out.
    logLevel: 0
}, function () {
    //Do not really care about the build output summary,
    //since the logLevel: 0 will show it anyway in the console.
});
