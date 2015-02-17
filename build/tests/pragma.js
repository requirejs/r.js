/*global define, doh */

define(['pragma', 'env!env/file'], function (pragma, file) {
    'use strict';

    function c(fileName) {
        return file.readFile(fileName);
    }

    //Remove line returns to make comparisons easier.
    function nol(contents) {
        return contents.replace(/[\r\n]/g, "");
    }

    doh.register("pragmaNamespace",
        [
            function pragmaNamespace(t) {
                t.is(c('pragma/good1Expected.js'), pragma.namespace(c('pragma/good1.js'), 'foo'));
                t.is(c('pragma/good2Expected.js'), pragma.namespace(c('pragma/good2.js'), 'foo'));
            }
        ]);
    doh.run();

    doh.register("pragmaUseStrict",
        [
            function pragmaUseStrict(t) {
                var modifiedContents = pragma.removeStrict(c('pragma/goodStrict1.js'), {});
                t.is(c('pragma/goodStrict1Expected.js'), modifiedContents);
            }
        ]);
    doh.run();

});
