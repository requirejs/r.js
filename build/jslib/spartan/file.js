//file API's may not be supported in spartan shell environments
define({
        getLineSeparator: function () {
        },

        exists: function (fileName) {
        },

        parent: function (fileName) {
        },

        normalize: function (fileName) {
        },

        isFile: function (path) {
        },

        isDirectory: function (path) {
        },

        absPath: function (fileObj) {
        },

        getFilteredFileList: function (/*String*/startDir, /*RegExp*/regExpFilters, /*boolean?*/makeUnixPaths, /*boolean?*/startDirIsJavaObject) {
        },

        copyDir: function (/*String*/srcDir, /*String*/destDir, /*RegExp?*/regExpFilter, /*boolean?*/onlyCopyNew) {
        },

        copyFile: function (/*String*/srcFileName, /*String*/destFileName, /*boolean?*/onlyCopyNew) {
        },

        renameFile: function (from, to) {
        },

        readFile: function (/*String*/path, /*String?*/encoding) {
        },

        saveUtf8File: function (/*String*/fileName, /*String*/fileContents) {
        },

        saveFile: function (/*String*/fileName, /*String*/fileContents, /*String?*/encoding) {
        },

        deleteFile: function (/*String*/fileName) {
        }
});

