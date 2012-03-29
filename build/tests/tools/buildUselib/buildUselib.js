/*jslint node: true */
/*global require, __dirname, console */
'use strict';

var requirejs = require('../../../../r.js'),
    fs = require('fs'),
    path = require('path'),
    jsRegExp = /\.js$/,
    dir = __dirname,
    thisName = path.basename(__filename),
    config = {
        baseUrl: '.',
        name: 'main',
        out: 'main-built.js',
        optimize: 'none'
    },
    fileName = path.join(dir, 'a.js'),
    contents = fs.readFileSync(fileName, 'utf8');


/*
 This tests the interaction of doing builds along with using useLib, and making
 sure they can both happen in the same process. This should:
 * Do build
 * useLib findDependencies
 * Do build
 * useLibe findDependencies
 */

requirejs.optimize(config, function (output) {
    console.log(output);

    requirejs.tools.useLib(function (require) {
        require(['parse'], function (parse) {
            console.log(parse.findDependencies(fileName, contents));

            requirejs.optimize(config, function (output) {
                console.log(output);

                requirejs.tools.useLib(function (require) {
                    require(['parse'], function (parse) {
                        console.log(parse.findDependencies(fileName, contents));
                    });
                });
            });
        });
    });
});