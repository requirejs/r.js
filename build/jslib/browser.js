/**
 * @license RequireJS rhino Copyright (c) 2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

//sloppy since eval enclosed with use strict causes problems if the source
//text is not strict-compliant.
/*jslint sloppy: true, evil: true */
/*global require, XMLHttpRequest */

(function () {
    require.load = function (context, moduleName, url) {
        var xhr = new XMLHttpRequest();

        //Oh yeah, that is right SYNC IO. Behold its glory
        //and horrible blocking behavior.
        xhr.open('GET', url, false);
        xhr.send();

        eval(xhr.responseText);

        //Support anonymous modules.
        context.completeLoad(moduleName);
    };

}());