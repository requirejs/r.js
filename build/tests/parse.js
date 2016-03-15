/*global doh, define */

define(['parse', 'env!env/file', 'env'], function (parse, file, env) {
    'use strict';

    function c(fileName) {
        return file.readFile(fileName);
    }

    //Remove line returns to make comparisons easier.
    function nol(contents) {
        return contents.replace(/[\r\n]/g, "");
    }

    doh.register("parseConfig",
        [
            function parseConfig(t) {
                var hasError = false;
                t.is('rconfig', parse.findConfig(file.readFile('parse/rconfig.js')).config.baseUrl);
                t.is('rjsconfig', parse.findConfig(file.readFile('parse/rjsconfig.js')).config.baseUrl);
                t.is('requirec', parse.findConfig(file.readFile('parse/requirec.js')).config.baseUrl);
                t.is('requirejsc', parse.findConfig(file.readFile('parse/requirejsc.js')).config.baseUrl);
                t.is('requireObject', parse.findConfig(file.readFile('parse/requireObject.js')).config.baseUrl);
                t.is(undefined, parse.findConfig(file.readFile('parse/missing1.js')).config);
                t.is(undefined, parse.findConfig(file.readFile('parse/missing1.js')).config);

                try {
                    parse.findConfig(file.readFile('parse/bad1.js'));
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
                    bad2 = "function define(foo) { return foo };",
                    bad3 = "define(a[0]);",
                    goodAnon1 = "define(function(require){ var foo = require('foo'); });",
                    goodAnon2 = "define(function (require, exports, module) { if (true) { callback(function () { require(\"bar\"); })}});",
                    goodAnon3 = "define(function(require, exports, module) { exports.name = 'empty'; });",
                    goodAnon4 = "define((require, exports, module) => { module.exports = { name: 'b', uri: module.uri, c: require('c') }; });",

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
                    good11 = "define([\'plug!role=\"base something\"\'], function () {});",
                    good12 = c('parse/threeDefines.js'),
                    good13 = "define('one', somevar)",
                    good14 = "define(function test(require) {\nvar alertModal = require('c')// here the comment\n})",
                    good15 = c('parse/threeDefinesDeps.js'),
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
                t.is('define("good11",["plug!role=\\"base something\\""]);', parse("good11", "good11", good11));
                t.is('define("myLib",[]);define("myLib2",[]);define("myLib3",[]);', nol(parse("good12", "good12", good12)));
                t.is('define("one",[]);', nol(parse("good13", "good13", good13)));
                t.is('define("good14",["require","c"]);', nol(parse("good14", "good14", good14)));
                t.is('define("myLib",[]);define("myLib2",["myLib"]);define("myLib3",[]);', nol(parse("good15", "good15", good15)));
                t.is('define("goodAnon4",["require","exports","module","c"]);', nol(parse("goodAnon4", "goodAnon4", goodAnon4)));

                t.is('define("foo",[]);', parse("nested1", "nested1", nested1));
                t.is('define("one",["me"]);', parse("bad1", "bad1", bad1));

                t.is(null, parse("bad2", "bad2", bad2));
                t.is(null, parse("bad3", "bad3", bad3));

                t.is(['require', 'foo'], parse.getAnonDeps("goodAnon1", goodAnon1));
                t.is(['require', 'exports', 'module', 'bar'], parse.getAnonDeps("goodAnon2", goodAnon2));
                t.is(['require', 'exports', 'module'], parse.getAnonDeps("goodAnon3", goodAnon3));
                t.is(['require', 'exports', 'module', 'c'], parse.getAnonDeps("goodAnon4", goodAnon4));

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
                        '}).call(this);\n';

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
                    good2 = c("parse/functionDefine.js"),
                    good3 = c("parse/varDefine.js"),
                    bad0 = "var myGlobalRequire = (function () { var define = {}; (function(){ define = function(){}; define.amd = {};}()); }());",
                    bad1 = "var define; function boom(){ var define = function(){}; define.amd(); }",
                    bad2 = "(function(define) { define(); }(myvar));",
                    bad3 = c("parse/amdefine.js"),
                    bad4 = c("parse/select2.full.js");

                t.is(true, parse.definesRequire("good1", good1), "good1");
                t.is(true, parse.definesRequire("good2", good2), "good2");
                t.is(true, parse.definesRequire("good3", good3), "good3");
                t.is(false, parse.definesRequire("bad0", bad0), "bad0");
                t.is(false, parse.definesRequire("bad1", bad1), "bad1");
                t.is(false, parse.definesRequire("bad2", bad2), "bad2");
                t.is(false, parse.definesRequire("bad3", bad3), "bad3");
                t.is(false, parse.definesRequire("bad4", bad4), "bad4");
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
                    good8 = "define((require, exports, module) => { module.exports = { name: 'b', uri: module.uri, c: require('c') }; });",
                    good9 = "require(['a'], (a) => { console.log(a); })",

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
                t.is(true, parse.usesAmdOrRequireJs("good8", good8).define);
                t.is(true, parse.usesAmdOrRequireJs("good9", good9).require);

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
                    good7 = "module.exports.exec = function() {}",

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

                result = parse.usesCommonJs("good7", good7);
                t.is(false, !!result.exports);
                t.is(true, result.moduleExports);

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


    //Skip in xpconnect's since Reflect's parser cannot maintain comments.
    if (env.get() !== 'xpconnect') {
        doh.register('parseLicenseComments',
            [
                function parseLicenseComments(t) {
                    var contents,
                        manyCommentsName = 'parse/comments/manyComments.js',
                        multiLineName = 'parse/comments/multiLine.js',
                        multiSingleLineName = 'parse/comments/multiSingleLine.js',
                        expectedManyCommentsName = 'parse/comments/expected/manyComments.js',
                        outputManyCommentsName = 'parse/comments/output/manyComments.js',
                        expectedMultiLineName = 'parse/comments/expected/multiLine.js',
                        outputMultiLineName = 'parse/comments/output/multiLine.js',
                        expectedMultiSingleLineName = 'parse/comments/expected/multiSingleLine.js',
                        outputMultiSingleLineName = 'parse/comments/output/multiSingleLine.js';

                    contents = parse.getLicenseComments(manyCommentsName, file.readFile(manyCommentsName)).trim();
                    //file.saveFile(outputManyCommentsName, contents);
                    t.is(file.readFile(expectedManyCommentsName).trim(), contents);

                    contents = parse.getLicenseComments(multiLineName, file.readFile(multiLineName)).trim();
                    //file.saveFile(outputMultiLineName, contents);
                    t.is(file.readFile(expectedMultiLineName).trim(), contents);

                    contents = parse.getLicenseComments(multiSingleLineName, file.readFile(multiSingleLineName)).trim();
                    //file.saveFile(outputMultiSingleLineName, contents);
                    t.is(file.readFile(expectedMultiSingleLineName).trim(), contents);
                }
            ]
        );
        doh.run();
    }
});