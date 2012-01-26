/*jslint plusplus: false, strict: false */
/*global load: false, doh: false, define:false */

define(['parse', 'env!env/file'], function (parse, file) {

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

});