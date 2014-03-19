/**
 * @license Copyright (c) 2010-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint strict: false */
/*global Packages: false, process: false, window: false, navigator: false,
  document: false, define: false */

/**
 * A plugin that modifies any /env/ path to be the right path based on
 * the host environment. Right now only works for Node, Rhino and browser.
 */
(function () {
    var pathRegExp = /(\/|^)env\/|\{env\}/,
        env = 'unknown';

    if (typeof process !== 'undefined' && process.versions && !!process.versions.node) {
        env = 'node';
    } else if (typeof Packages !== 'undefined') {
        env = 'rhino';
    } else if ((typeof navigator !== 'undefined' && typeof document !== 'undefined') ||
            (typeof importScripts !== 'undefined' && typeof self !== 'undefined')) {
        env = 'browser';
    } else if (typeof Components !== 'undefined' && Components.classes && Components.interfaces) {
        env = 'xpconnect';
    }

    define({
        get: function () {
            return env;
        },

        load: function (name, req, load, config) {
            //Allow override in the config.
            if (config.env) {
                env = config.env;
            }

            name = name.replace(pathRegExp, function (match, prefix) {
                if (match.indexOf('{') === -1) {
                    return prefix + env + '/';
                } else {
                    return env;
                }
            });

            req([name], function (mod) {
                load(mod);
            });
        }
    });
}());
