/*jslint strict: false */
/*global define: false, console: false */

define(['fs'], function (fs) {
    function load(fileName) {
        var contents = fs.readFileSync(fileName, 'utf8');
        process.compile(contents, fileName);
    }

    return load;
});
