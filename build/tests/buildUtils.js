/*jslint */
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
                    good1 = 'if (typeof define === "function" && define.amd) {\n' +
                            '    define(definition);\n' +
                            '}',
                    goodExpected1 = 'if (typeof define === "function" && define.amd) {\n' +
                            '    define(\'good/1\',[],definition);\n' +
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
                    goodExpected3 = 'define(\'good/3\',\n' +
                            '    // a comment\n' +
                            '    [\n' +
                            '        "some/dep"\n' +
                            '    ],\nfunction (dep) {});',

                    good4 = 'define(this.key)',
                    goodExpected4 = 'define(\'good/4\',[],this.key)';

                t.is(bad1, build.toTransport('', 'bad/1', 'bad1', bad1));
                t.is(bad2, build.toTransport('', 'bad/2', 'bad2', bad2));
                t.is(bad3, build.toTransport('', 'bad/3', 'bad3', bad3));
                t.is(bad4, build.toTransport('', 'bad/4', 'bad4', bad4));
                t.is(bad5, build.toTransport('', 'bad/5', 'bad5', bad5));
                t.is(goodExpected1, build.toTransport('', 'good/1', 'good1', good1));
                t.is(goodExpected2, build.toTransport('', 'good/2', 'good2', good2));
                t.is(multi, build.toTransport('', 'multi', 'multi', multi));
                t.is(multiAnonWrappedExpected, build.toTransport('',
                    'multiAnonWrapped', 'multiAnonWrapped', multiAnonWrapped));
                t.is(goodExpected3, build.toTransport('', 'good/3', 'good3', good3));
                t.is(goodExpected4, build.toTransport('', 'good/4', 'good4', good4));
            }
        ]);
    doh.run();
});
