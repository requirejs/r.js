/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint plusplus: false, strict: false */
/*global define: false */

define(function () {
    var lang = {
        backSlashRegExp: /\\/g,
        ostring: Object.prototype.toString,

        isArray: Array.isArray ? Array.isArray : function (it) {
            return lang.ostring.call(it) === "[object Array]";
        },

        isFunction: function(it) {
            return lang.ostring.call(it) === "[object Function]";
        },

        isRegExp: function(it) {
            return it && it instanceof RegExp;
        },

        _mixin: function(dest, source, override){
            var name, s, empty = {};
            for (name in source) {
                // the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
                // inherited from Object.prototype.     For example, if dest has a custom toString() method,
                // don't overwrite it with the toString() method that source inherited from Object.prototype
                s = source[name];
                if((override || !(name in dest)) && (!(name in empty) || empty[name] !== s)) {
                    dest[name] = s;
                }
            }

            return dest; // Object
        },

        mixin: function(dest, sources){
            var parameters = Array.prototype.slice.call(arguments);
            
            if (!dest) { dest = {}; }
            
            var override;
            if (parameters.length > 2 && typeof arguments[parameters.length-1] === 'boolean') {
                override = parameters.pop();
            }
            
            for (var i = 1, l = parameters.length; i < l; i++) {
                lang._mixin(dest, parameters[i], override);
            }
            return dest; // Object
        },

        delegate: (function () {
            // boodman/crockford delegation w/ cornford optimization
            function TMP() {}
            return function (obj, props) {
                TMP.prototype = obj;
                var tmp = new TMP();
                TMP.prototype = null;
                if (props) {
                    lang.mixin(tmp, props);
                }
                return tmp; // Object
            };
        }())
    };
    return lang;
});
