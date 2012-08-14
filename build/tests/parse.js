/*jslint */
/*global load: false, doh: false, define:false */

define(['parse', 'env!env/file'], function (parse, file) {
    'use strict';

    doh.register("parseConfig",
        [
            function parseConfig(t) {
                var hasError = false;
                t.is('rconfig', parse.findConfig('rconfig.js', file.readFile('parse/rconfig.js')).baseUrl);
                t.is('rjsconfig', parse.findConfig('rjsconfig.js', file.readFile('parse/rjsconfig.js')).baseUrl);
                t.is('requirec', parse.findConfig('requirec.js', file.readFile('parse/requirec.js')).baseUrl);
                t.is('requirejsc', parse.findConfig('requirejsc.js', file.readFile('parse/requirejsc.js')).baseUrl);
                t.is(null, parse.findConfig('missing1.js', file.readFile('parse/missing1.js')));
                t.is(null, parse.findConfig('missing1.js', file.readFile('parse/missing1.js')));

                try {
                    parse.findConfig('bad1.js', file.readFile('parse/bad1.js'));
                } catch (e) {
                    hasError = true;
                }
                t.is(true, hasError);
            }
        ]
    );
    doh.run();

    doh.register("parseRequire",
        [
            function parseRequire(t) {
                var good1 = "require(['one', 'two'], function(){});",
                    good2 = "require({baseUrl: './'}, ['one', 'two']);",
                    good3 = "requirejs(['one', 'two'], function(){});",
                    good4 = "requirejs({baseUrl: './'}, ['one', 'two']);",
                    bad1 = "require([foo, 'me'], function() {});",
                    bad2 = "require({baseUrl: './'});";

                t.is('define("good1",["one","two"]);', parse("good1", "good1", good1));
                t.is('define("good2",["one","two"]);', parse("good2", "good2", good2));
                t.is('define("good3",["one","two"]);', parse("good3", "good3", good3));
                t.is('define("good4",["one","two"]);', parse("good4", "good4", good4));
                t.is('define("bad1",["me"]);', parse("bad1", "bad1", bad1));
                t.is(null, parse("bad2", "bad2", bad2));
            }
        ]
    );
    doh.run();

    doh.register('parseDefineCall',
        [
            function parseDefineCall(t) {
                var good1 = "define('one', ['two', 'three'], function(){});",
                    good2 = "define('one', function(){});",
                    good3 = 'function baz(){ var foo = { bar: function() { define("one", ["two"], function(){}); } };}',
                    good4 = '(function (define) { define("one", function(){}); }(myGlobalDefine))',
                    nested1 = "(function () {\nvar foo = {\nbar: 'baz'\n}\n\n define('foo', [], foo); \n }());",
                    bad1 = "define('one', [foo, 'me'], function() {});",
                    bad2 = "define('one', somevar)",
                    bad3 = "function define(foo) { return foo };",
                    bad4 = "define(a[0]);",
                    goodAnon1 = "define(function(require){ var foo = require('foo'); });",
                    goodAnon2 = "define(function (require, exports, module) { if (true) { callback(function () { require(\"bar\"); })}});",
                    goodAnon3 = "define(function(require, exports, module) { exports.name = 'empty'; });",
                    good5 = "define(function (require) {\n" +
                        '   return {\n' +
                        '        getA: function () {\n' +
                        '            return require("../index!0?./a:./b:./c");\n' +
                        '        },\n' +
                        '       getC: function () {\n' +
                        '            return require("../index!2?./a:./b:./c");\n' +
                        '        },\n' +
                        '        getB: function () {\n' +
                        '            return require("../index!1?./a:./b:./c");\n' +
                        '        }\n' +
                        '   };\n' +
                        '});\n',
                    good6 = 'function baz(){ var foo = { bar: function() { define("one", function(){ var two = require("two"); }); } };}',
                    good7 = "(function (factory){\nif(typeof define === 'function' && define.amd){\ndefine(['dep'], factory);\n}else{\nfactory(this.dep);\n}\n}(function(dep){\n}));",
                    good8 = "(function (factory){\nif(typeof define === 'function' && define.amd){\ndefine('some/name', ['dep1', 'dep2'], factory);\n}else{\nfactory(this.dep);\n}\n}(function(dep){\n}));",
                    good9 = "define(function (require) {\n//Dependencies with no usable return value.\nrequire('plugin!some/value');\n});",
                    good10 = "define('good10', function (require) {\n//If have dependencies, get them here\nvar newt = require('newt');\nreturn {\nname: 'spell',\nnewtName: newt.name,\ntailName: newt.tailName,\neyeName: newt.eyeName\n};});",
                    emptyAnon1 = "define(function(){ return 'foo'; });";

                t.is('define("one",["two","three"]);', parse("good1", "good1", good1));
                t.is('define("one",[]);', parse("good2", "good2", good2));
                t.is('define("one",["two"]);', parse("good3", "good3", good3));
                t.is('define("one",[]);', parse("good4", "good4", good4));
                t.is('define("good5",["require","../index!0?./a:./b:./c","../index!2?./a:./b:./c","../index!1?./a:./b:./c"]);', parse("good5", "good5", good5));
                t.is('define("one",["two"]);', parse("good6", "good6", good6));
                t.is('define("good7",["dep"]);', parse("good7", "good7", good7));
                t.is('define("some/name",["dep1","dep2"]);', parse("good8", "good8", good8));
                t.is('define("good9",["require","plugin!some/value"]);', parse("good9", "good9", good9));
                t.is('define("good10",["require","newt"]);', parse("good10", "good10", good10));
                t.is('define("foo",[]);', parse("nested1", "nested1", nested1));
                t.is('define("one",["me"]);', parse("bad1", "bad1", bad1));

                t.is(null, parse("bad2", "bad2", bad2));
                t.is(null, parse("bad3", "bad3", bad3));
                t.is(null, parse("bad4", "bad4", bad4));

                t.is(['require', 'foo'], parse.getAnonDeps("goodAnon1", goodAnon1));
                t.is(['require', 'exports', 'module', 'bar'], parse.getAnonDeps("goodAnon2", goodAnon2));
                t.is(['require', 'exports', 'module'], parse.getAnonDeps("goodAnon3", goodAnon3));
                t.is(['require', 'plugin!some/value'], parse.getAnonDeps("good9", good9));
                t.is(0, parse.getAnonDeps("emptyAnon1", emptyAnon1).length);
            }
        ]
    );
    doh.run();


    doh.register('parseFindNestedDependencies',
        [
            function parseFindNestedDependencies(t) {
                var good1 = '(function() {\n' +
                        '  define([\'require\', \'a\', \'b\'], function(require, a, b) {\n' +
                        '    return require([\'c\'], function(c) {\n' +
                        '      c(a, b);\n' +
                        '    });\n' +
                        '  });\n' +
                        '}).call(this);\n'

                t.is('define("good1",["require","a","b","c"]);', parse("good1", "good1", good1, {
                    findNestedDependencies: true
                }));
            }
        ]
    );
    doh.run();



    doh.register('parseHasRequire',
        [
            function parseHasRequire(t) {
                var good1 = "var require, define; (function(){ define = function(){}; define.amd = {};}());",
                    good2 = "var myGlobalRequire = (function () { var define = {}; (function(){ define = function(){}; define.amd = {};}()); }());",
                    bad1 = "var define; function boom(){ var define = function(){}; define.amd(); }",
                    bad2 = "(function(define) { define(); }(myvar));";

                t.is(true, parse.definesRequire("good1", good1));
                t.is(true, parse.definesRequire("good2", good2));
                t.is(false, parse.definesRequire("bad1", bad1));
                t.is(false, parse.definesRequire("bad2", bad2));
            }
        ]
    );
    doh.run();

    doh.register('parseUsesAmdOrRequireJs',
        [
            function parseUsesAmdOrRequireJs(t) {
                var good1 = "(function(){ if (typeof define === 'function' && define.amd) { define(['some'], function (some) {}) } }());",
                    good2 = "(function(){ if (typeof define === 'function' && define.amd) { define(definition); } }());",
                    good3 = "require({ baseUrl: 'scripts' }, ['main']);",
                    good4 = "requirejs({ baseUrl: 'scripts' }, ['main']);",
                    good5 = "require.config({ baseUrl: 'scripts' });",
                    good6 = "require(['something']);",
                    good7 = "requirejs(['something'], function (something){});",

                    bad1 = "var dep = require('dep');",
                    bad2 = "this.define('some', 'thing');",

                    //Some tests from uglifyjs, which has a local define.
                    bad3 = "var obj = { define: function () {} };",
                    bad4 = "(function() {define(name, 'whatever'); function define() { } }());",
                    bad5 = "(function() {define(name, 'whatever'); function define() { } define.amd = {} }());",
                    result;

                t.is(true, parse.usesAmdOrRequireJs("good1", good1).define);
                t.is(true, parse.usesAmdOrRequireJs("good2", good2).define);
                t.is(true, parse.usesAmdOrRequireJs("good3", good3).require);
                t.is(true, parse.usesAmdOrRequireJs("good4", good4).requirejs);
                t.is(true, parse.usesAmdOrRequireJs("good5", good5).requireConfig);

                t.is(true, parse.usesAmdOrRequireJs("good6", good6).require);
                t.is(true, parse.usesAmdOrRequireJs("good7", good7).requirejs);
                t.is(false, !!parse.usesAmdOrRequireJs("bad1", bad1));
                t.is(false, !!parse.usesAmdOrRequireJs("bad2", bad2));

                t.is(false, !!parse.usesAmdOrRequireJs("bad3", bad3));

                result = parse.usesAmdOrRequireJs("bad4", bad4);
                t.is(true, result.define);
                t.is(true, result.declaresDefine);
                t.is(false, !!result.defineAmd);

                result = parse.usesAmdOrRequireJs("bad5", bad5);
                t.is(true, result.define);
                t.is(true, result.declaresDefine);
                t.is(true, result.defineAmd);
            }
        ]
    );
    doh.run();

    doh.register('parseUsesCommonJs',
        [
            function parseUsesCommonJs(t) {
                var good1 = "var dep = require('dep');",
                    good2 = "something(); exports.foo = another();",
                    good3 = "(function () { module.exports = function () {}; }());",
                    good4 = "var a = require('a'); something(); exports.b = a;",
                    good5 = "exports.foo = function () { return something(__dirname); };",
                    good6 = "var foo = 'bar', path = __filename;",

                    bad1 = "(function(){ if (typeof define === 'function' && define.amd) { define(['some'], function (some) {}) } }());",
                    bad2 = "require(['something']);",
                    bad3 = "var exports; exports.foo = 'bar';",
                    bad4 = "var exports = function () {};",
                    result;

                t.is(true, parse.usesCommonJs("good1", good1).require);
                t.is(true, parse.usesCommonJs("good2", good2).exports);
                t.is(true, parse.usesCommonJs("good3", good3).moduleExports);

                result = parse.usesCommonJs("good4", good4);
                t.is(true, result.require);
                t.is(true, result.exports);
                t.is(false, !!result.moduleExports);

                result = parse.usesCommonJs("good5", good5);
                t.is(false, !!result.require);
                t.is(true, result.exports);
                t.is(true, result.dirname);

                result = parse.usesCommonJs("good6", good6);
                t.is(true, result.filename);
                t.is(false, !!result.exports);
                t.is(false, !!result.moduleExports);


                t.is(null, parse.usesCommonJs("bad1", bad1));
                t.is(null, parse.usesCommonJs("bad2", bad2));
                t.is(null, parse.usesCommonJs("bad3", bad3));
                t.is(null, parse.usesCommonJs("bad4", bad4));
            }
        ]
    );
    doh.run();


    doh.register('parseFindCjsDependencies',
        [
            function parseFindCjsDependencies(t) {
                var good1 = "var dep = require('dep'), dep2 = require('./some/thing');",

                    bad1 = "require(['something']);",
                    bad2 = "var one; one = require('something/' + two);",
                    bad3 = "var exports = function () { return require(someThing);};",
                    result;

                result = parse.findCjsDependencies("good1", good1);
                t.is('dep', result[0]);
                t.is('./some/thing', result[1]);

                t.is(0, parse.findCjsDependencies("bad1", bad1).length);
                t.is(0, parse.findCjsDependencies("bad2", bad2).length);
                t.is(0, parse.findCjsDependencies("bad3", bad3).length);
            }
        ]
    );
    doh.run();

    doh.register('parseLicenseComments',
        [
            function parseLicenseComments(t) {
                var manyCommentsName = 'parse/comments/manyComments.js',
                    multiLineName = 'parse/comments/multiLine.js',
                    multiSingleLineName = 'parse/comments/multiSingleLine.js',
                    expectedManyCommentsName = 'parse/comments/expected/manyComments.js',
                    expectedMultiLineName = 'parse/comments/expected/multiLine.js',
                    expectedMultiSingleLineName = 'parse/comments/expected/multiSingleLine.js';


                t.is(file.readFile(expectedManyCommentsName).trim(),
                     parse.getLicenseComments(manyCommentsName, file.readFile(manyCommentsName)).trim());

                t.is(file.readFile(expectedMultiLineName).trim(),
                     parse.getLicenseComments(multiLineName, file.readFile(multiLineName)).trim());

                t.is(file.readFile(expectedMultiSingleLineName).trim(),
                     parse.getLicenseComments(multiSingleLineName, file.readFile(multiSingleLineName)).trim());
            }
        ]
    );
    doh.run();
});