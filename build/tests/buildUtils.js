/*global define, doh */

define(['build'], function (build) {
    'use strict';
    doh.register("toTransport",
        [
            function toTransport(t) {
                var bad1 = 'this.define(field, value, {_resolve: false});',
                    bad2 = 'xdefine(fields, callback);',
                    bad3 = 'this.define(function () {});',
                    bad4 = 'define(fields, callback);',
                    bad5 = 'define(a[0]);',
                    bad6 = '(function () {\n' +
                        '    (function () {\n' +
                        '        var module = { exports: {} }, exports = module.exports;\n' +
                        '        (function (name, context, definition) {\n' +
                        '            if (typeof module != \'undefined\' && module.exports) module.exports = definition()\n' +
                        '            else if (typeof define == \'function\' && define.amd) define(definition)\n' +
                        '            else context[name] = definition()\n' +
                        '        })(\'qwery\', this, function () {\n' +
                        '        });\n' +
                        '    }());\n' +
                        '    (function () {\n' +
                        '        var module = { exports: {} }, exports = module.exports;\n' +
                        '        (function (name, context, definition) {\n' +
                        '            if (typeof module != \'undefined\' && module.exports) module.exports = definition()\n' +
                        '            else if (typeof define == \'function\' && define.amd) define(definition)\n' +
                        '            else context[name] = definition()\n' +
                        '        })(\'bonzo\', this, function () {\n' +
                        '        });\n' +
                        '    }());\n' +
                        '}());',

                    good1 = 'if (typeof define === "function" && define.amd) {\n' +
                            '    define(definition);\n' +
                            '}',
                    goodExpected1 = 'if (typeof define === "function" && define.amd) {\n' +
                            '    define(\'good/1\',definition);\n' +
                            '}',
                    good2 = '//    define([\'bad\'], function () {});\n' +
                            'define([\'foo\'], function () {});',
                    goodExpected2 = '//    define([\'bad\'], function () {});\n' +
                            'define(\'good/2\',[\'foo\'], function () {});',

                    multi = 'define("foo", function (require) { var bar = require("bar"); });\n' +
                            'define("bar", function (require) { var foo = require("foo"); });\n',

                    multiAnonWrapped = '(function (root, factory) {\n' +
                    '    if (typeof define === \'function\' && define.amd) {\n' +
                    '        define([\'b\'], factory);\n' +
                    '    } else {\n' +
                    '        // Browser globals\n' +
                    '        root.amdWeb = factory(root.b);\n' +
                    '    }\n' +
                    '}(this, function (b) {\n' +
                    '    var stored = {};\n' +
                    '    function define(id, func) { stored[id] = func();}\n' +
                    '    define("foo", function (require) { var bar = require("bar"); });\n' +
                    '    define("bar", function (require) { var foo = require("foo"); });\n' +
                    '    return stored.bar;\n' +
                    '}));',

                    multiAnonWrappedExpected = '(function (root, factory) {\n' +
                    '    if (typeof define === \'function\' && define.amd) {\n' +
                    '        define(\'multiAnonWrapped\',[\'b\'], factory);\n' +
                    '    } else {\n' +
                    '        // Browser globals\n' +
                    '        root.amdWeb = factory(root.b);\n' +
                    '    }\n' +
                    '}(this, function (b) {\n' +
                    '    var stored = {};\n' +
                    '    function define(id, func) { stored[id] = func();}\n' +
                    '    define("foo", function (require) { var bar = require("bar"); });\n' +
                    '    define("bar", function (require) { var foo = require("foo"); });\n' +
                    '    return stored.bar;\n' +
                    '}));',

                    good3 = 'define(\n' +
                            '    // a comment\n' +
                            '    [\n' +
                            '        "some/dep"\n' +
                            '    ],\nfunction (dep) {});',
                    goodExpected3 = 'define(\n' +
                            '    // a comment\n' +
                            '    \'good/3\',[\n' +
                            '        "some/dep"\n' +
                            '    ],\nfunction (dep) {});',

                    good4 = 'define(this.key)',
                    goodExpected4 = 'define(\'good/4\',this.key)',
                    good5 = 'if ("function" === typeof define && define.amd) {\n' +
                            '    define(function (require) {\n' +
                            '        return {\n' +
                            '            name: "five",\n' +
                            '            six: require("./six")\n' +
                            '        };\n' +
                            '    });\n' +
                            '}',
                    goodExpected5 = 'if ("function" === typeof define && define.amd) {\n' +
                            '    foo.define(\'good/5\',[\'require\',\'./six\'],function (require) {\n' +
                            '        return {\n' +
                            '            name: "five",\n' +
                            '            six: require("./six")\n' +
                            '        };\n' +
                            '    });\n' +
                            '}';
                t.is(bad1, build.toTransport('', 'bad/1', 'bad1', bad1));
                t.is(bad2, build.toTransport('', 'bad/2', 'bad2', bad2));
                t.is(bad3, build.toTransport('', 'bad/3', 'bad3', bad3));
                t.is(bad4, build.toTransport('', 'bad/4', 'bad4', bad4));
                t.is(bad5, build.toTransport('', 'bad/5', 'bad5', bad5));
                t.is(bad6, build.toTransport('', 'bad/6', 'bad6', bad6));
                t.is(goodExpected1, build.toTransport('', 'good/1', 'good1', good1));
                t.is(goodExpected2, build.toTransport('', 'good/2', 'good2', good2));
                t.is(multi, build.toTransport('', 'multi', 'multi', multi));
                t.is(multiAnonWrappedExpected, build.toTransport('',
                    'multiAnonWrapped', 'multiAnonWrapped', multiAnonWrapped));
                t.is(goodExpected3, build.toTransport('', 'good/3', 'good3', good3));
                t.is(goodExpected4, build.toTransport('', 'good/4', 'good4', good4));
                t.is(goodExpected5, build.toTransport('foo', 'good/5', 'good5', good5));
            }
        ]);
    doh.run();

    doh.register("makeRelativeFilePath",
        [
            function makeRelativeFilePath(t) {
                t.is('sibling.js',
                    build.makeRelativeFilePath('/some/other/www-built/js/main.js',
                                               '/some/other/www-built/js/sibling.js'));
                t.is('sub/thing/other.js',
                    build.makeRelativeFilePath('/some/other/www-built/js/main.js',
                                               '/some/other/www-built/js/sub/thing/other.js'));

                t.is('../parent/thing/other.js',
                    build.makeRelativeFilePath('/some/other/www-built/js/main.js',
                                               '/some/other/www-built/parent/thing/other.js'));

                t.is('../../../Applications/foo/',
                    build.makeRelativeFilePath('/Users/some/thing/',
                                           '/Applications/foo/'));

                t.is('modules/player.js',
                    build.makeRelativeFilePath('/some/other/www-built/js/app/main.js',
                                                '/some/other/www-built/js/main/lib/../../app/modules/player.js'));
            }
        ]);
    doh.run();
});
