/*jslint */
/*global doh: false */

define(['build'], function (build) {
    'use strict';
    doh.register("toTransport",
        [
            function toTransport(t) {
                var bad1 = 'this.define(field, value, {_resolve: false});',
                    bad2 = 'xdefine(fields, callback);',
                    bad3 = 'this.define(function () {});',
                    bad4 = 'define(fields, callback);',
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

                    multiExpected = 'define("foo",[\'require\',\'bar\'], function (require) { var bar = require("bar"); });\n' +
                            'define("bar",[\'require\',\'foo\'], function (require) { var foo = require("foo"); });\n',

                    good3 = 'define(\n' +
                            '    // a comment\n' +
                            '    [\n' +
                            '        "some/dep"\n' +
                            '    ],\nfunction (dep) {});',
                    goodExpected3 = 'define(\'good/3\',\n' +
                            '    // a comment\n' +
                            '    [\n' +
                            '        "some/dep"\n' +
                            '    ],\nfunction (dep) {});';

                t.is(bad1, build.toTransport('', 'bad/1', 'bad1', bad1));
                t.is(bad2, build.toTransport('', 'bad/2', 'bad2', bad2));
                t.is(bad3, build.toTransport('', 'bad/3', 'bad3', bad3));
                t.is(bad4, build.toTransport('', 'bad/4', 'bad4', bad4));
                t.is(goodExpected1, build.toTransport('', 'good/1', 'good1', good1));
                t.is(goodExpected2, build.toTransport('', 'good/2', 'good2', good2));
                t.is(multiExpected, build.toTransport('', 'multi', 'multi', multi));
                t.is(goodExpected3, build.toTransport('', 'good/3', 'good3', good3));
            }
        ]
    );
    doh.run();
});
