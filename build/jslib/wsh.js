/**
 * @license RequireJS wsh Copyright (c) 2013, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jshint evil: true */
/*global require, requirejsEnvUtil */

(function () {

    //source-map uses defineProperty, but just for an informational property,
    //does not seem to be critical, so just stub out the call.
    if (!Object.defineProperty) {
        Object.defineProperty = function () {};
    }

    'use strict';
    require.load = function (context, moduleName, url) {

        var contents = requirejsEnvUtil.readFile(url);
        eval(contents);

        //Support anonymous modules.
        context.completeLoad(moduleName);
    };

}());
