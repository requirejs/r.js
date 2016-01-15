/**
 * @license RequireJS Copyright (c) 2010-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/**
 * Run the tests in Node with this command:
 * node ../../r.js all.js
 */

/*jslint plusplus: false, strict: false */
/*global require: false, doh: false, skipDohSetup: true */

//A hack to doh to avoid dojo setup stuff in doh/runner.js
skipDohSetup = true;

//Set baseUrl for default context, but use a different context
//to run the tests, since at least one test run clears out the
//default context between each run.
require({
    baseUrl: '../jslib/'
});

//Run the tests in a different context.
require({
    baseUrl: '../jslib/',
    paths: {
        tests: '../tests'
    },
    context: 'test'
}, [
    '../../tests/doh/runner.js',
    'env!../../tests/doh/_{env}Runner.js',
    'tests/convert',
    'tests/parse',
    'tests/pragma',
    'tests/transform',
    'tests/buildUtils',

    //Build tests should be last in case they alter the environment
    //in a weird way.
    'tests/builds'
], function () {
    //Show final report.
    doh.run();
});

