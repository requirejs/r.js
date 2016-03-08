/*jslint sloppy: true, nomen: true */
/*global require, define, console, XMLHttpRequest, requirejs, location */

define(['prim'], function (prim) {

    var file,
        currDirRegExp = /^\.(\/|$)/;

    function frontSlash(path) {
        return path.replace(/\\/g, '/');
    }

    function exists(path) {
        var status, xhr = new XMLHttpRequest();

        //Oh yeah, that is right SYNC IO. Behold its glory
        //and horrible blocking behavior.
        xhr.open('HEAD', path, false);
        xhr.send();
        status = xhr.status;

        return status === 200 || status === 304;
    }

    function mkDir(dir) {
        console.log('mkDir is no-op in browser');
    }

    function mkFullDir(dir) {
        console.log('mkFullDir is no-op in browser');
    }

    file = {
        backSlashRegExp: /\\/g,
        exclusionRegExp: /^\./,
        getLineSeparator: function () {
            return '/';
        },

        exists: function (fileName) {
            return exists(fileName);
        },

        parent: function (fileName) {
            var parts = fileName.split('/');
            parts.pop();
            return parts.join('/');
        },

        /**
         * Gets the absolute file path as a string, normalized
         * to using front slashes for path separators.
         * @param {String} fileName
         */
        absPath: function (fileName) {
            var dir;
            if (currDirRegExp.test(fileName)) {
                dir = frontSlash(location.href);
                if (dir.indexOf('/') !== -1) {
                    dir = dir.split('/');

                    //Pull off protocol and host, just want
                    //to allow paths (other build parts, like
                    //require._isSupportedBuildUrl do not support
                    //full URLs), but a full path from
                    //the root.
                    dir.splice(0, 3);

                    dir.pop();
                    dir = '/' + dir.join('/');
                }

                fileName = dir + fileName.substring(1);
            }

            return fileName;
        },

        normalize: function (fileName) {
            return fileName;
        },

        isFile: function (path) {
            return true;
        },

        isDirectory: function (path) {
            return false;
        },

        getFilteredFileList: function (startDir, regExpFilters, makeUnixPaths) {
            console.log('file.getFilteredFileList is no-op in browser');
        },

        copyDir: function (srcDir, destDir, regExpFilter, onlyCopyNew) {
            console.log('file.copyDir is no-op in browser');

        },

        copyFile: function (srcFileName, destFileName, onlyCopyNew) {
            console.log('file.copyFile is no-op in browser');
        },

        /**
         * Renames a file. May fail if "to" already exists or is on another drive.
         */
        renameFile: function (from, to) {
            console.log('file.renameFile is no-op in browser');
        },

        /**
         * Reads a *text* file.
         */
        readFile: function (path, encoding) {
            var xhr = new XMLHttpRequest();

            //Oh yeah, that is right SYNC IO. Behold its glory
            //and horrible blocking behavior.
            xhr.open('GET', path, false);
            xhr.send();

            return xhr.responseText;
        },

        readFileAsync: function (path, encoding) {
            var xhr = new XMLHttpRequest(),
                d = prim();

            xhr.open('GET', path, true);
            xhr.send();

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status > 400) {
                        d.reject(new Error('Status: ' + xhr.status + ': ' + xhr.statusText));
                    } else {
                        d.resolve(xhr.responseText);
                    }
                }
            };

            return d.promise;
        },

        saveUtf8File: function (fileName, fileContents) {
            //summary: saves a *text* file using UTF-8 encoding.
            file.saveFile(fileName, fileContents, "utf8");
        },

        saveFile: function (fileName, fileContents, encoding) {
            requirejs.browser.saveFile(fileName, fileContents, encoding);
        },

        deleteFile: function (fileName) {
            console.log('file.deleteFile is no-op in browser');
        },

        /**
         * Deletes any empty directories under the given directory.
         */
        deleteEmptyDirs: function (startDir) {
            console.log('file.deleteEmptyDirs is no-op in browser');
        }
    };

    return file;

});
