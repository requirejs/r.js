/*jslint strict: false */
/*global define: false, console: false */

define(['./file'], function (file) {
    function load(fileName) {
        eval(file.readFile(fileName));
    }

    return load;
});
