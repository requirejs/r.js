/*jslint node: true, regexp: true */

var fs = require('fs'),
    path = require('path'),
    fileName = process.argv[2],
    umdStartRegExp = /\(function webpackUniversalModuleDefinition\(root, factory\) \{/;

var fileContents = fs.readFileSync(fileName, 'utf8');

fileContents = fileContents.replace(umdStartRegExp, '$&\nvar exports, module;');
fs.writeFileSync(fileName, fileContents, 'utf8');
