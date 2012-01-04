/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint plusplus: false, nomen: false, regexp: false, strict: false */
/*global define: false */

define([ 'lang', 'logger', 'env!env/optimize', 'env!env/file', 'parse',
         'pragma', 'uglifyjs/index'],
function (lang,   logger,   envOptimize,        file,           parse,
          pragma, uglify) {

    var optimize,
        cssImportRegExp = /\@import\s+(url\()?\s*([^);]+)\s*(\))?([\w, ]*)(;)?/g,
        cssUrlRegExp = /\url\(\s*([^\)]+)\s*\)?/g;

    /**
     * If an URL from a CSS url value contains start/end quotes, remove them.
     * This is not done in the regexp, since my regexp fu is not that strong,
     * and the CSS spec allows for ' and " in the URL if they are backslash escaped.
     * @param {String} url
     */
    function cleanCssUrlQuotes(url) {
        //Make sure we are not ending in whitespace.
        //Not very confident of the css regexps above that there will not be ending
        //whitespace.
        url = url.replace(/\s+$/, "");

        if (url.charAt(0) === "'" || url.charAt(0) === "\"") {
            url = url.substring(1, url.length - 1);
        }

        return url;
    }

    /**
     * Inlines nested stylesheets that have @import calls in them.
     * @param {String} fileName
     * @param {String} fileContents
     * @param {String} [cssImportIgnore]
     */
    function flattenCss(fileName, fileContents, cssImportIgnore) {
        //Find the last slash in the name.
        fileName = fileName.replace(lang.backSlashRegExp, "/");
        var endIndex = fileName.lastIndexOf("/"),
            //Make a file path based on the last slash.
            //If no slash, so must be just a file name. Use empty string then.
            filePath = (endIndex !== -1) ? fileName.substring(0, endIndex + 1) : "";

        //Make sure we have a delimited ignore list to make matching faster
        if (cssImportIgnore && cssImportIgnore.charAt(cssImportIgnore.length - 1) !== ",") {
            cssImportIgnore += ",";
        }

        return fileContents.replace(cssImportRegExp, function (fullMatch, urlStart, importFileName, urlEnd, mediaTypes) {
            //Only process media type "all" or empty media type rules.
            if (mediaTypes && ((mediaTypes.replace(/^\s\s*/, '').replace(/\s\s*$/, '')) !== "all")) {
                return fullMatch;
            }

            importFileName = cleanCssUrlQuotes(importFileName);

            //Ignore the file import if it is part of an ignore list.
            if (cssImportIgnore && cssImportIgnore.indexOf(importFileName + ",") !== -1) {
                return fullMatch;
            }

            //Make sure we have a unix path for the rest of the operation.
            importFileName = importFileName.replace(lang.backSlashRegExp, "/");

            try {
                //if a relative path, then tack on the filePath.
                //If it is not a relative path, then the readFile below will fail,
                //and we will just skip that import.
                var fullImportFileName = importFileName.charAt(0) === "/" ? importFileName : filePath + importFileName,
                    importContents = file.readFile(fullImportFileName), i,
                    importEndIndex, importPath, fixedUrlMatch, colonIndex, parts;

                //Make sure to flatten any nested imports.
                importContents = flattenCss(fullImportFileName, importContents);

                //Make the full import path
                importEndIndex = importFileName.lastIndexOf("/");

                //Make a file path based on the last slash.
                //If no slash, so must be just a file name. Use empty string then.
                importPath = (importEndIndex !== -1) ? importFileName.substring(0, importEndIndex + 1) : "";

                //Modify URL paths to match the path represented by this file.
                importContents = importContents.replace(cssUrlRegExp, function (fullMatch, urlMatch) {
                    fixedUrlMatch = cleanCssUrlQuotes(urlMatch);
                    fixedUrlMatch = fixedUrlMatch.replace(lang.backSlashRegExp, "/");

                    //Only do the work for relative URLs. Skip things that start with / or have
                    //a protocol.
                    colonIndex = fixedUrlMatch.indexOf(":");
                    if (fixedUrlMatch.charAt(0) !== "/" && (colonIndex === -1 || colonIndex > fixedUrlMatch.indexOf("/"))) {
                        //It is a relative URL, tack on the path prefix
                        urlMatch = importPath + fixedUrlMatch;
                    } else {
                        logger.trace(importFileName + "\n  URL not a relative URL, skipping: " + urlMatch);
                    }

                    //Collapse .. and .
                    parts = urlMatch.split("/");
                    for (i = parts.length - 1; i > 0; i--) {
                        if (parts[i] === ".") {
                            parts.splice(i, 1);
                        } else if (parts[i] === "..") {
                            if (i !== 0 && parts[i - 1] !== "..") {
                                parts.splice(i - 1, 2);
                                i -= 1;
                            }
                        }
                    }

                    return "url(" + parts.join("/") + ")";
                });

                return importContents;
            } catch (e) {
                logger.trace(fileName + "\n  Cannot inline css import, skipping: " + importFileName);
                return fullMatch;
            }
        });
    }

    optimize = {
        licenseCommentRegExp: /\/\*[\s\S]*?\*\//g,

        /**
         * Optimizes a file that contains JavaScript content. Optionally collects
         * plugin resources mentioned in a file, and then passes the content
         * through an minifier if one is specified via config.optimize.
         *
         * @param {String} fileName the name of the file to optimize
         * @param {String} outFileName the name of the file to use for the
         * saved optimized content.
         * @param {Object} config the build config object.
         * @param {String} [moduleName] the module name to use for the file.
         * Used for plugin resource collection.
         * @param {Array} [pluginCollector] storage for any plugin resources
         * found.
         */
        jsFile: function (fileName, outFileName, config, moduleName, pluginCollector) {
            var parts = (config.optimize + "").split('.'),
                optimizerName = parts[0],
                keepLines = parts[1] === 'keepLines',
                licenseContents = '',
                fileContents, optFunc, match, comment;

            fileContents = file.readFile(fileName);

            //Apply pragmas/namespace renaming
            fileContents = pragma.process(fileName, fileContents, config, 'OnSave', pluginCollector);

            //Optimize the JS files if asked.
            if (optimizerName && optimizerName !== 'none') {
                optFunc = envOptimize[optimizerName] || optimize.optimizers[optimizerName];
                if (!optFunc) {
                    throw new Error('optimizer with name of "' +
                                    optimizerName +
                                    '" not found for this environment');
                }

                if (config.preserveLicenseComments) {
                    //Pull out any license comments for prepending after optimization.
                    optimize.licenseCommentRegExp.lastIndex = 0;
                    while ((match = optimize.licenseCommentRegExp.exec(fileContents))) {
                        comment = match[0];
                        //Only keep the comments if they are license comments.
                        if (comment.indexOf('@license') !== -1 ||
                            comment.indexOf('/*!') === 0) {
                            licenseContents += comment + '\n';
                        }
                    }
                }

                fileContents = licenseContents + optFunc(fileName, fileContents, keepLines,
                                        config[optimizerName]);
            }

            file.saveUtf8File(outFileName, fileContents);
        },

        /**
         * Optimizes one CSS file, inlining @import calls, stripping comments, and
         * optionally removes line returns.
         * @param {String} fileName the path to the CSS file to optimize
         * @param {String} outFileName the path to save the optimized file.
         * @param {Object} config the config object with the optimizeCss and
         * cssImportIgnore options.
         */
        cssFile: function (fileName, outFileName, config) {
            //Read in the file. Make sure we have a JS string.
            var originalFileContents = file.readFile(fileName),
                fileContents = flattenCss(fileName, originalFileContents, config.cssImportIgnore),
                startIndex, endIndex;

            //Do comment removal.
            try {
                startIndex = -1;
                //Get rid of comments.
                while ((startIndex = fileContents.indexOf("/*")) !== -1) {
                    endIndex = fileContents.indexOf("*/", startIndex + 2);
                    if (endIndex === -1) {
                        throw "Improper comment in CSS file: " + fileName;
                    }
                    fileContents = fileContents.substring(0, startIndex) + fileContents.substring(endIndex + 2, fileContents.length);
                }
                //Get rid of newlines.
                if (config.optimizeCss.indexOf(".keepLines") === -1) {
                    fileContents = fileContents.replace(/[\r\n]/g, "");
                    fileContents = fileContents.replace(/\s+/g, " ");
                    fileContents = fileContents.replace(/\{\s/g, "{");
                    fileContents = fileContents.replace(/\s\}/g, "}");
                } else {
                    //Remove multiple empty lines.
                    fileContents = fileContents.replace(/(\r\n)+/g, "\r\n");
                    fileContents = fileContents.replace(/(\n)+/g, "\n");
                }
            } catch (e) {
                fileContents = originalFileContents;
                logger.error("Could not optimized CSS file: " + fileName + ", error: " + e);
            }

            file.saveUtf8File(outFileName, fileContents);
        },

        /**
         * Optimizes CSS files, inlining @import calls, stripping comments, and
         * optionally removes line returns.
         * @param {String} startDir the path to the top level directory
         * @param {Object} config the config object with the optimizeCss and
         * cssImportIgnore options.
         */
        css: function (startDir, config) {
            if (config.optimizeCss.indexOf("standard") !== -1) {
                var i, fileName,
                    fileList = file.getFilteredFileList(startDir, /\.css$/, true);
                if (fileList) {
                    for (i = 0; i < fileList.length; i++) {
                        fileName = fileList[i];
                        logger.trace("Optimizing (" + config.optimizeCss + ") CSS file: " + fileName);
                        optimize.cssFile(fileName, fileName, config);
                    }
                }
            }
        },

        optimizers: {
            uglify: function (fileName, fileContents, keepLines, config) {
                var parser = uglify.parser,
                    processor = uglify.uglify,
                    ast;

                config = config || {};

                logger.trace("Uglifying file: " + fileName);

                try {
                    ast = parser.parse(fileContents, config.strict_semicolons);
                    ast = processor.ast_mangle(ast, config);
                    ast = processor.ast_squeeze(ast, config);

                    fileContents = processor.gen_code(ast, config);
                } catch (e) {
                    logger.error('Cannot uglify file: ' + fileName + '. Skipping it. Error is:\n' + e.toString());
                }
                return fileContents;
            }
        }
    };

    return optimize;
});