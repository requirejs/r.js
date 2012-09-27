/*jslint node: true, nomen: true */
/*global require, __dirname, console */
'use strict';

var requirejs = require('../../../../r.js'),
    fs = require('fs'),
    config = {
        baseUrl: 'src',
        dir: 'built',
        optimize: 'none',
        paths: {
            requireLib: 'require'
        },
        modules: [
            { name: 'main1', include: ['requireLib'] },
            { name: 'main2', include: ['requireLib'] }
        ]
    };

function read(url) {
    return fs.readFileSync(url, 'utf8');
}

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

    requirejs.optimize(config, function (output) {
        console.log(output);

        var built1 = read('built/main1.js'),
            built2 = read('built/main2.js'),
            expected1 = read('expectedMain1.js'),
            expected2 = read('expectedMain2.js');

        if (built1 !== expected1) {
            console.log('ERROR: built/main1 not correct.');
        } else if (built2 !== expected2) {
            console.log('ERROR: built/main2 not correct.');
        } else {
            console.log('Test passed.');
        }
    });
});