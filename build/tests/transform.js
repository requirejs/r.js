/*global doh, define, java, Packages, Components */

define(['transform', 'env!env/file'], function (transform, file) {
    'use strict';

    var isRhino = typeof java !== 'undefined' && typeof Packages !== 'undefined',
        isXpConnect = typeof Components !== 'undefined' && Components.classes &&
                      Components.interfaces;

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
                var overideName = '';

                file.deleteFile('transform/results');

                test(t, 'addPath.js', function (config) {
                    if (!config.paths) {
                        config.paths = {};
                    }
                    config.paths.newlyAdded = 'some/added/path';
                    return config;
                });

                test(t, 'emptyObject.js', function (config) {
                    if (!config.paths) {
                        config.paths = {};
                    }
                    config.paths.a = 'a';
                    return config;
                });

                test(t, 'startLineBreak.js', function (config) {
                    if (!config.paths) {
                        config.paths = {};
                    }
                    config.paths.a = 'a';
                    return config;
                });

                test(t, 'bothLineBreak.js', function (config) {
                    if (!config.paths) {
                        config.paths = {};
                    }
                    config.paths.a = 'a';
                    return config;
                });

                //Rhino's Function.toString strips comments and
                //does not maintain indentation, so need a different
                //comparison file to use for the results. xpconnect
                //version is also different.
                if (isRhino) {
                    if (typeof importPackage !== 'undefined') {
                        overideName = 'indentedArrayFunc-rhino.js';
                    } else {
                        overideName = 'indentedArrayFunc-nashorn.js';
                    }
                } else if (isXpConnect) {
                    overideName = 'indentedArrayFunc-xpconnect.js';
                }

                test(t, 'indentedArrayFunc.js', function (config) {
                    config.waitSeconds = 0;
                    return config;
                }, overideName);
            }
        ]
    );
    doh.run();
});
