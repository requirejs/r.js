/**
 * @license RequireJS Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint */
/*global define, process */

define(['fs'], function (fs) {
    'use strict';
    function print(msg) {
        fs.writeSync(process.stdout.fd, msg + '\n');
        fs.fsyncSync(process.stdout.fd);
    }

    return print;
});
