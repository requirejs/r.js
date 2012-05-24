/*global process */
define(function () {
    'use strict';
    return function (code) {
        return process.exit(code);
    };
});