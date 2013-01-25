/*jslint node: true, nomen: true */
var fs = require('fs'),
    pre = fs.readFileSync(__dirname + '/pre.txt', 'utf8'),
    raw = fs.readFileSync(__dirname + '/temp/raw.js', 'utf8'),
    post = fs.readFileSync(__dirname + '/post.txt', 'utf8'),
    targetString = 'return this',
    lastIndex = raw.lastIndexOf(targetString);

raw = raw.substring(0, lastIndex) + 'return exports' + raw.substring(lastIndex + targetString.length);
fs.writeFileSync(__dirname + '/../uglifyjs2.js', pre + raw + post, 'utf8');
