#!/usr/bin/env node
var r = require('../../../../r.js');
    fs = require('fs');

r.optimize({
    name: 'main',
    out: function(text) {
        var expected = fs.readFileSync('expected.js', 'utf8');
        if (expected.trim() === text.trim()) {
            console.log('built text matches expected.js');
        } else {
            console.log('ERROR: built text does not match expected.js:\n' + text);
        }
    }
}, function (resultText) {

});
