/*jslint node: true, nomen: true */
var exportContents, exportIndex,
    fs = require('fs'),
    path = require('path'),
    pkgDir = path.join(__dirname, 'temp', 'node_modules', 'uglify-js'),
    pre = fs.readFileSync(__dirname + '/pre.txt', 'utf8'),
    raw = [
        "utils.js",
        "ast.js",
        "parse.js",
        "transform.js",
        "scope.js",
        "output.js",
        "compress.js",
        "sourcemap.js",
        "mozilla-ast.js",
        "propmangle.js",
        "../tools/exports.js"
    ].map(function (filePath) {
        return fs.readFileSync(path.join(pkgDir, 'lib', filePath), 'utf8');
    }).join('\n'),
    post = fs.readFileSync(__dirname + '/post.txt', 'utf8'),

    toolContents = fs.readFileSync(path.join(pkgDir, 'tools', 'node.js'), 'utf8');

exportContents = toolContents.replace(/UglifyJS\./g, 'exports.');

// Modify some things for the embedding:
exportContents = exportContents.replace(/fs\.readFileSync/g, 'rjsFile.readFile');
exportContents = exportContents.replace(/fs\.writeFileSync/g, 'rjsFile.writeFile');


exportContents = exportContents.replace('exports.minify = function(files, options) {', 'exports.minify = function(files, options, name) {');
exportContents = exportContents.replace('filename: options.fromString ? i : file,', 'filename: options.fromString ? name : file,');

// Node 0.10/0.12 do not like the addFile function declaration with the "use strict"
// that is used near that declaration, but not at the top of the file.
// https://github.com/requirejs/r.js/pull/929
exportContents = exportContents.replace(/function addFile\(/, 'var addFile = function(');

fs.writeFileSync(__dirname + '/../uglifyjs.js', [
    pre,
    raw,
    'AST_Node.warn_function = function(txt) { logger.error("uglifyjs WARN: " + txt); };',
    exportContents,
    post
 ].join('\n'), 'utf8');
