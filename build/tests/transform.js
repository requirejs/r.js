/*jslint */
/*global doh, define, java, Packages */

define(['transform', 'env!env/file'], function (transform, file) {
    'use strict';

    var isRhino = typeof java !== 'undefined' && typeof Packages !== 'undefined';

    //Remove line returns to make comparisons easier.
    function nol(contents) {
        return contents.replace(/[\r\n]/g, "");
    }

    function test(t, fileName, onConfig, expectName) {
        expectName = expectName || fileName;
        var contents = file.readFile('transform/' + fileName);
        contents = transform.modifyConfig(contents, onConfig);
        file.saveFile('transform/results/' + fileName, contents);
        t.is(nol(file.readFile('transform/expected/' + expectName)), nol(contents));
    }

    doh.register("transformModifyConfig",
        [
            function transformModifyConfig(t) {
                file.deleteFile('transform/results');

                test(t, 'addPath.js', function (config) {
                    if (!config.paths) {
                        config.paths = {};
                    }
                    config.paths.newlyAdded = 'some/added/path';
                    return config;
                });

                //Rhino's Function.toString strips comments and
                //does not maintain indentation, so need a different
                //comparison file to use for the results.
                test(t, 'indentedArrayFunc.js', function (config) {
                    config.waitSeconds = 0;
                    return config;
                }, isRhino ? 'indentedArrayFunc-rhino.js' : '');
            }
        ]
    );
    doh.run();
});