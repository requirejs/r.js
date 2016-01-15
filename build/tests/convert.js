/*jslint */
/*global doh: false, define: false */

define(['commonJs'], function (commonJs) {
    'use strict';
    doh.register(
        "convert",
        [
            function commonJsConvert(t) {
                var source1 = 'define("fake", {lol: "you guise"});',
                    source2 = 'define("fake", [],\nfunction(){\nreturn{lol : \'you guise\'};\n});',

                    source3 = 'exports.name = "foo";',
                    expected3 = 'define(function (require, exports, module) {exports.name = "foo";\n});\n',

                    source4 = 'module.exports = "foo";',
                    expected4 = 'define(function (require, exports, module) {module.exports = "foo";\n});\n',

                    source5 = 'var a = require("a");\nexports.name = a;',
                    expected5 = 'define(function (require, exports, module) {var a = require("a");\nexports.name = a;\n});\n',

                    source6 = 'exports.name = __dirname;',
                    expected6 = 'define(function (require, exports, module) {' +
                                'var __filename = module.uri || "", __dirname = __filename.substring(0, __filename.lastIndexOf("/") + 1); ' +
                                'exports.name = __dirname;\n});\n',

                    source7 = 'exports.name = __filename;',
                    expected7 = 'define(function (require, exports, module) {' +
                                'var __filename = module.uri || "", __dirname = __filename.substring(0, __filename.lastIndexOf("/") + 1); ' +
                                'exports.name = __filename;\n});\n',

                    source8 = 'var MyModule = module.exports = "foo";',
                    expected8 = 'define(function (require, exports, module) {var MyModule = module.exports = "foo";\n});\n';

                t.is(source1, commonJs.convert('fake.js', source1));
                t.is(source2, commonJs.convert('fake.js', source2));
                t.is(expected3, commonJs.convert('source3', source3));
                t.is(expected4, commonJs.convert('source4', source4));
                t.is(expected5, commonJs.convert('source5', source5));
                t.is(expected6, commonJs.convert('source6', source6));
                t.is(expected7, commonJs.convert('source7', source7));
                t.is(expected8, commonJs.convert('source8', source8));
            }
        ]
    );
    doh.run();
});
