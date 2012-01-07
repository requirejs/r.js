'use strict';
/*jslint nomen: false */
/*global require, __dirname, console */

var requirejs = require('../../../../r.js'),
    fs = require('fs'),
    path = require('path'),
    jsRegExp = /\.js$/,
    dir = __dirname,
    thisName = path.basename(__filename);

function onLib(require) {
    require(['parse'], function (parse) {
        var deps = {};

        fs.readdirSync(dir).filter(function (name) {
            //Do not include this file in the output.
            return name !== thisName && jsRegExp.test(name);
        }).forEach(function (name) {
            var fileName = path.join(dir, name),
                contents = fs.readFileSync(fileName, 'utf8');
            deps[path.basename(name, '.js')] = parse.findDependencies(fileName,
                                                                      contents);
        });
        
        console.log(JSON.stringify(deps, null, '  '));
    });
}

//Do it twice, just to make sure it all holds together on multiple passes.
requirejs.tools.useLib(onLib);
requirejs.tools.useLib(onLib);
