/*jslint node: true, regexp: true */

var fs = require('fs'),
    path = require('path'),
    dir = process.argv[2],
    dirs = fs.readdirSync(dir),
    amdefineRegExp = /if\s*\(\s*typeof define\s*\!==\s*'function'\s*\)\s*\{\s*[^\{\}]+amdefine[^\{\}]+\}/g;

dirs.forEach(function (d) {
    'use strict';
console.log('DOING: ' + dir + ': ' + d);

    var fullName = path.join(dir, d),
        fileContents = fs.readFileSync(fullName, 'utf8');

    fileContents = fileContents.replace(amdefineRegExp, '');
    fs.writeFileSync(fullName, fileContents, 'utf8');
});
