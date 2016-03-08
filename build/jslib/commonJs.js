/*jslint */
/*global define: false, console: false */

define(['env!env/file', 'parse'], function (file, parse) {
    'use strict';
    var commonJs = {
        //Set to false if you do not want this file to log. Useful in environments
        //like node where you want the work to happen without noise.
        useLog: true,

        convertDir: function (commonJsPath, savePath) {
            var fileList, i,
                jsFileRegExp = /\.js$/,
                fileName, convertedFileName, fileContents;

            //Get list of files to convert.
            fileList = file.getFilteredFileList(commonJsPath, /\w/, true);

            //Normalize on front slashes and make sure the paths do not end in a slash.
            commonJsPath = commonJsPath.replace(/\\/g, "/");
            savePath = savePath.replace(/\\/g, "/");
            if (commonJsPath.charAt(commonJsPath.length - 1) === "/") {
                commonJsPath = commonJsPath.substring(0, commonJsPath.length - 1);
            }
            if (savePath.charAt(savePath.length - 1) === "/") {
                savePath = savePath.substring(0, savePath.length - 1);
            }

            //Cycle through all the JS files and convert them.
            if (!fileList || !fileList.length) {
                if (commonJs.useLog) {
                    if (commonJsPath === "convert") {
                        //A request just to convert one file.
                        console.log('\n\n' + commonJs.convert(savePath, file.readFile(savePath)));
                    } else {
                        console.log("No files to convert in directory: " + commonJsPath);
                    }
                }
            } else {
                for (i = 0; i < fileList.length; i++) {
                    fileName = fileList[i];
                    convertedFileName = fileName.replace(commonJsPath, savePath);

                    //Handle JS files.
                    if (jsFileRegExp.test(fileName)) {
                        fileContents = file.readFile(fileName);
                        fileContents = commonJs.convert(fileName, fileContents);
                        file.saveUtf8File(convertedFileName, fileContents);
                    } else {
                        //Just copy the file over.
                        file.copyFile(fileName, convertedFileName, true);
                    }
                }
            }
        },

        /**
         * Does the actual file conversion.
         *
         * @param {String} fileName the name of the file.
         *
         * @param {String} fileContents the contents of a file :)
         *
         * @returns {String} the converted contents
         */
        convert: function (fileName, fileContents) {
            //Strip out comments.
            try {
                var preamble = '',
                    commonJsProps = parse.usesCommonJs(fileName, fileContents);

                //First see if the module is not already RequireJS-formatted.
                if (parse.usesAmdOrRequireJs(fileName, fileContents) || !commonJsProps) {
                    return fileContents;
                }

                if (commonJsProps.dirname || commonJsProps.filename) {
                    preamble = 'var __filename = module.uri || "", ' +
                               '__dirname = __filename.substring(0, __filename.lastIndexOf("/") + 1); ';
                }

                //Construct the wrapper boilerplate.
                fileContents = 'define(function (require, exports, module) {' +
                    preamble +
                    fileContents +
                    '\n});\n';

            } catch (e) {
                console.log("commonJs.convert: COULD NOT CONVERT: " + fileName + ", so skipping it. Error was: " + e);
                return fileContents;
            }

            return fileContents;
        }
    };

    return commonJs;
});
