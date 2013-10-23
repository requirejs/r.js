/**
 * @license Copyright (c) 2010-2013, The Dojo Foundation All Rights Reserved.
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
    moduleNameRegExp = /build\/jslib\/([\w\/\-]+)\.js$/,
    defRegExp = /define\s*\(/,
    envs = ['browser', 'node', 'rhino', 'xpconnect'],
    //Update this list of files by running the optimizer against
    //build/jslib/opto.build.js,
    //but then remove any jslib/node entries and make sure there is
    //an env! entry for each one of them. Include
    //build/jslib/commonjs.js in the list, but remove build/build.js
    //since it is loaded separately.
    libFiles = [
        'build/jslib/env.js',
        'build/jslib/lang.js',
        'build/jslib/prim.js',
        'env!env/assert',
        'env!env/args',
        'env!env/load',
        'env!env/file',
        'env!env/quit',
        'env!env/print',
        'build/jslib/logger.js',
        'build/jslib/blank.js',
        'build/jslib/esprima.js',
        'build/jslib/esprimaAdapter.js',
        'build/jslib/uglifyjs/consolidator.js',
        'build/jslib/uglifyjs/parse-js.js',
        'build/jslib/uglifyjs/squeeze-more.js',
        'build/jslib/uglifyjs/process.js',
        'build/jslib/uglifyjs/index.js',
        'build/jslib/source-map/array-set.js',
        'build/jslib/source-map/base64-vlq.js',
        'build/jslib/source-map/base64.js',
        'build/jslib/source-map/binary-search.js',
        'build/jslib/source-map/source-map-consumer.js',
        'build/jslib/source-map/source-map-generator.js',
        'build/jslib/source-map/source-node.js',
        'build/jslib/source-map/util.js',
        'build/jslib/source-map.js',
        'build/jslib/uglifyjs2.js',
        'build/jslib/parse.js',
        'build/jslib/transform.js',
        'build/jslib/pragma.js',
        'env!env/optimize',
        'build/jslib/optimize.js',
        'build/jslib/requirePatch.js',
        'build/jslib/commonJs.js',
        'build/jslib/build.js'
    ],
    optimizerStartFile = 'build/build.js',
    libText = '';

function readAndNameModule(fileName) {
    var contents = fs.readFileSync(fileName, 'utf8'),
        match = moduleNameRegExp.exec(fileName),
        moduleName = (match && match[1]) || fileName;

    //Insert the module name.
    return contents.replace(defRegExp, function (match) {
        return match + "'" + moduleName + "', ";
    });
}

//Load up all the optimizer files.
libFiles.forEach(function (fileName) {
    if (fileName.indexOf('env!') === 0) {
        envs.forEach(function (env) {
            libText += "\nif(env === '" + env + "') {\n" +
                        readAndNameModule(fileName.replace(/env!env\//, 'build/jslib/' + env + '/') + '.js') +
                        "\n}\n";
        });
    } else {
        libText += readAndNameModule(fileName, 'utf8');
    }
});

//Inline file contents
contents = contents.replace(loadRegExp, function (match, fileName) {
    if (fileName === 'LIB') {
        return libText;
    } else {
        var text = fs.readFileSync(fileName, 'utf8');
        if (fileName.indexOf('require.js') !== -1) {
            text = text.replace(/var requirejs, require\, define\;/, '');
        }
        return text;
    }
});

//Set the isOpto flag to true
fs.writeFileSync('r.js', contents, 'utf8');
