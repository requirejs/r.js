/**
 * @license RequireJS rhino Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint */
/*global require: false, java: false, load: false */

(function () {
    'use strict';
    require.load = function (context, moduleName, url) {
        // this is executed inside the VM so
        // we just dump everything in the global scope
        // with `load`
        load(url);

        context.completeLoad(moduleName);
    };
    require.nextTick = function(fn) {
      fn();
    }

}());