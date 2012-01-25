/*jslint plusplus: false, strict: false */
/*global load: false, doh: false, define:false */

define(['build'], function (build) {

    doh.register("toTransport",
        [
            function toTransport(t) {
                var bad1 = 'this.define(field, value, {_resolve: false});',
                    bad2 = 'xdefine(fields, callback);',
                    bad3 = 'this.define(function () {});',
                    bad4 = 'define(fields, callback);',
                    good1 = 'if (typeof define === "function" && define.amd) {\n' +
                            '    define(definition);\n' +
                            '}';
                    goodExpected1 = 'if (typeof define === "function" && define.amd) {\n' +
                            '    define(\'good/1\',[],definition);\n' +
                            '}';
                    layer = {
                        modulesWithNames: {}
                    };

                t.is(bad1, build.toTransport(build.makeAnonDefRegExp(), '', 'bad/1', 'bad1', bad1, layer));
                t.is(bad2, build.toTransport(build.makeAnonDefRegExp(), '', 'bad/2', 'bad2', bad2, layer));
                t.is(bad3, build.toTransport(build.makeAnonDefRegExp(), '', 'bad/3', 'bad3', bad3, layer));
                t.is(bad4, build.toTransport(build.makeAnonDefRegExp(), '', 'bad/4', 'bad4', bad4, layer));
                t.is(goodExpected1, build.toTransport(build.makeAnonDefRegExp(), '', 'good/1', 'good1', good1, layer));
            }
        ]
    );
    doh.run();
});
