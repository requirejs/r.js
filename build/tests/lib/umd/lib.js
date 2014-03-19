(function (e) {
    if ("function" == typeof bootstrap)bootstrap("foo", e); else if ("object" == typeof exports)module.exports = e(); else if ("function" == typeof define && define.amd)define(e); else if ("undefined" != typeof ses) {
        if (!ses.ok())return;
        ses.makeFoo = e
    } else"undefined" != typeof window ? window.foo = e() : global.foo = e()
})(function () {
    var define, ses, bootstrap, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a)return a(o, !0);
                    if (i)return i(o, !0);
                    throw new Error("Cannot find module '" + o + "'")
                }
                var f = n[o] = {exports: {}};
                t[o][0].call(f.exports, function (e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, f, f.exports, e, t, n, r)
            }
            return n[o].exports
        }

        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++)s(r[o]);
        return s
    })({1: [function (require, module, exports) {
        var async = require('async');

        module.exports = {
            foo: 'bar'
        };
    }, {"async": 2}], 2: [function (require, module, exports) {
        var process = require("__browserify_process");
        /*global setImmediate: false, setTimeout: false, console: false */
        (function () {

            var async = {};

            // ... Async code here ...

            // AMD / RequireJS
            if (typeof define !== 'undefined' && define.amd) {
                define([], function () {
                    return async;
                });
            }
            // Node.js
            else if (typeof module !== 'undefined' && module.exports) {
                module.exports = async;
            }
            // included directly via <script> tag
            else {
                root.async = async;
            }

        }());

    }, {"__browserify_process": 3}], 3: [function (require, module, exports) {
// shim for using process in browser

        var process = module.exports = {};

        process.nextTick = (function () {
            var canSetImmediate = typeof window !== 'undefined'
                && window.setImmediate;
            var canPost = typeof window !== 'undefined'
                    && window.postMessage && window.addEventListener
                ;

            if (canSetImmediate) {
                return function (f) {
                    return window.setImmediate(f)
                };
            }

            if (canPost) {
                var queue = [];
                window.addEventListener('message', function (ev) {
                    if (ev.source === window && ev.data === 'process-tick') {
                        ev.stopPropagation();
                        if (queue.length > 0) {
                            var fn = queue.shift();
                            fn();
                        }
                    }
                }, true);

                return function nextTick(fn) {
                    queue.push(fn);
                    window.postMessage('process-tick', '*');
                };
            }

            return function nextTick(fn) {
                setTimeout(fn, 0);
            };
        })();

        process.title = 'browser';
        process.browser = true;
        process.env = {};
        process.argv = [];

        process.binding = function (name) {
            throw new Error('process.binding is not supported');
        }

// TODO(shtylman)
        process.cwd = function () {
            return '/'
        };
        process.chdir = function (dir) {
            throw new Error('process.chdir is not supported');
        };

    }, {}]}, {}, [1])
        (1)
});
;

