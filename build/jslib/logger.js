/**
 * @license RequireJS Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint nomen: false, strict: false */
/*global define: false */

define(['env!env/print'], function (print) {
    var logger = {
        TRACE: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        SILENT: 4,
        level: 0,
        logPrefix: "",

        logLevel: function( level ) {
            this.level = level;
        },

        trace: function () {
            if (this.level <= this.TRACE) {
                this._print(arguments);
            }
        },

        info: function () {
            if (this.level <= this.INFO) {
                this._print(arguments);
            }
        },

        warn: function () {
            if (this.level <= this.WARN) {
                this._print(arguments);
            }
        },

        error: function () {
            if (this.level <= this.ERROR) {
                this._print(arguments);
            }
        },

        _print: function (args) {
            this._sysPrint(this.logPrefix ? (this.logPrefix + " ") : "", Array.prototype.slice.apply(args));
        },

        _sysPrint: function (logPrefix,args) {
            print.apply(this,[logPrefix].concat(args));
        }
    };

    return logger;
});
