/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This script will create the final r.js file used in node projects to use
 * RequireJS.
 *
 * This file uses Node to run:
 * node dist.js
 */

/*jslint strict: false */
/*global require: false, process: false, console: false */


var fs = require('fs'),
    child_process = require('child_process'),
    contents = fs.readFileSync('build/jslib/x.js', 'utf8'),
    loadRegExp = /\/\/INSERT ([\w\/\.]+)/g,
    envs = ['node', 'rhino'],
    //Update this list of files by running the optimizer against
    //build/jslib/opto.build.js
    optimizerFiles = [
        'build/jslib/env.js',
        'env!env/args',
        'build/jslib/node/args.js',
        'build/jslib/lang.js',
        'env!env/print',
        'build/jslib/node/print.js',
        'build/jslib/logger.js',
        'build/jslib/blank.js',
        'build/jslib/blank.js',
        'build/jslib/node/file.js',
        'build/jslib/uglifyjs/./parse-js.js',
        'build/jslib/uglifyjs/././squeeze-more.js',
        'build/jslib/uglifyjs/./process.js',
        'build/jslib/uglifyjs/index.js',
        'build/jslib/parse.js',
        'env!env/optimize',
        'build/jslib/node/optimize.js',
        'build/jslib/optimize.js',
        'build/jslib/pragma.js',
        'build/jslib/node/load.js',
        'build/jslib/requirePatch.js',
        'build/jslib/build.js'
    ],
    optoText = '';

//Load up all the optimizer files.
optimizerFiles.forEach(function (fileName) {
    if (fileName.indexOf('env!') === 0) {
        envs.forEach(function (env) {
            optoText += "\nif(env === '" + env + "') {\n" +
                        fs.readFileSync(fileName.replace(/env!env/, 'build/jslib/' + env + '/') + '.js', 'utf8') +
                        "\n}\n";
        });
    } else {
        optoText += fs.readFileSync(fileName, 'utf8');
    }
});

//Inline file contents
contents = contents.replace(loadRegExp, function (match, fileName) {
    if (fileName === 'OPTIMIZER') {
        return optoText;
    } else {
        return fs.readFileSync(fileName, 'utf8');
    }
});

//Set the isOpto flag to true
fs.writeFileSync('r.js', contents, 'utf8');

