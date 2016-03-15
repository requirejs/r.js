/*jslint node: true, nomen: true */
var exportContents,
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
        "propmangle.js"
    ].map(function (filePath) {
        return fs.readFileSync(path.join(pkgDir, 'lib', filePath), 'utf8');
    }).join('\n'),
    post = fs.readFileSync(__dirname + '/post.txt', 'utf8'),

    toolContents = fs.readFileSync(path.join(pkgDir, 'tools', 'node.js'), 'utf8'),
    exportIndex = toolContents.indexOf('exports.minify =');

// Modify some things for the embedding:
exportContents = toolContents.substring(exportIndex).replace(/fs\.readFileSync/g, 'rjsFile.readFile');

exportContents = exportContents.replace(/UglifyJS\./g, '');

exportContents = exportContents.replace('exports.minify = function(files, options) {', 'exports.minify = function(files, options, name) {');
exportContents = exportContents.replace('filename: options.fromString ? i : file,', 'filename: options.fromString ? name : file,');

fs.writeFileSync(__dirname + '/../uglifyjs.js', [
    pre,
    raw,
    'AST_Node.warn_function = function(txt) { logger.error("uglifyjs WARN: " + txt); };',
    exportContents,
    post
 ].join('\n'), 'utf8');
