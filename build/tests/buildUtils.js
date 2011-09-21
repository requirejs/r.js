/*jslint plusplus: false, strict: false */
/*global load: false, doh: false, define:false */

define(['build'], function (build) {

    doh.register("toTransport",
        [
            function toTransport(t) {
                var bad1 = "this.define(field, value, {_resolve: false});",
                    layer = {
                        modulesWithNames: {}
                    };

                t.is(bad1, build.toTransport(build.makeAnonDefRegExp(), '', 'bad/1', 'bad1', bad1, layer));
            }
        ]
    );
    doh.run();
});
