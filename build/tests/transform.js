/*jslint */
/*global doh, define */

define(['transform', 'env!env/file'], function (transform, file) {
    'use strict';

    //Remove line returns to make comparisons easier.
    function nol(contents) {
        return contents.replace(/[\r\n]/g, "");
    }

    function test(t, fileName, onConfig) {
        var contents = file.readFile('transform/' + fileName);
        debugger;
        contents = transform.modifyConfig(contents, onConfig);
        file.saveFile('transform/results/' + fileName, contents);
        t.is(nol(file.readFile('transform/expected/' + fileName)), nol(contents));
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
            }
        ]
    );
    doh.run();
});