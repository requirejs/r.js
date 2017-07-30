/*jslint plusplus: true, nomen: true, regexp: true */
/*global define: false */

define([ 'lang', 'logger', 'env!env/optimize', 'env!env/file', 'parse',
         'pragma', 'uglifyjs',
         'source-map'],
function (lang,   logger,   envOptimize,        file,           parse,
          pragma, uglify,
          sourceMap) {
    'use strict';

    var optimize,
        cssImportRegExp = /\@import\s+(url\()?\s*([^);]+)\s*(\))?([\w, ]*)(;)?/ig,
        cssCommentImportRegExp = /\/\*[^\*]*@import[^\*]*\*\//g,
        cssUrlRegExp = /\url\(\s*([^\)]+)\s*\)?/g,
        protocolRegExp = /^\w+:/,
        SourceMapGenerator = sourceMap.SourceMapGenerator,
        SourceMapConsumer = sourceMap.SourceMapConsumer,
        es5PlusGuidance = 'If the source uses ES2015 or later syntax, please pass "optimize: \'none\'" to r.js and use an ES2015+ compatible minifier after running r.js. The included UglifyJS only understands ES5 or earlier syntax.';

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

    function fixCssUrlPaths(fileName, path, contents, cssPrefix) {
        return contents.replace(cssUrlRegExp, function (fullMatch, urlMatch) {
            var firstChar, hasProtocol, parts, i,
                fixedUrlMatch = cleanCssUrlQuotes(urlMatch);

            fixedUrlMatch = fixedUrlMatch.replace(lang.backSlashRegExp, "/");

            //Only do the work for relative URLs. Skip things that start with / or #, or have
            //a protocol.
            firstChar = fixedUrlMatch.charAt(0);
            hasProtocol = protocolRegExp.test(fixedUrlMatch);
            if (firstChar !== "/" && firstChar !== "#" && !hasProtocol) {
                //It is a relative URL, tack on the cssPrefix and path prefix
                urlMatch = cssPrefix + path + fixedUrlMatch;
            } else if (!hasProtocol) {
                logger.trace(fileName + "\n  URL not a relative URL, skipping: " + urlMatch);
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
    }

    /**
     * Inlines nested stylesheets that have @import calls in them.
     * @param {String} fileName the file name
     * @param {String} fileContents the file contents
     * @param {String} cssImportIgnore comma delimited string of files to ignore
     * @param {String} cssPrefix string to be prefixed before relative URLs
     * @param {Object} included an object used to track the files already imported
     */
    function flattenCss(fileName, fileContents, cssImportIgnore, cssPrefix, included, topLevel) {
        //Find the last slash in the name.
        fileName = fileName.replace(lang.backSlashRegExp, "/");
        var endIndex = fileName.lastIndexOf("/"),
            //Make a file path based on the last slash.
            //If no slash, so must be just a file name. Use empty string then.
            filePath = (endIndex !== -1) ? fileName.substring(0, endIndex + 1) : "",
            //store a list of merged files
            importList = [],
            skippedList = [];

        //First make a pass by removing any commented out @import calls.
        fileContents = fileContents.replace(cssCommentImportRegExp, '');

        //Make sure we have a delimited ignore list to make matching faster
        if (cssImportIgnore && cssImportIgnore.charAt(cssImportIgnore.length - 1) !== ",") {
            cssImportIgnore += ",";
        }

        fileContents = fileContents.replace(cssImportRegExp, function (fullMatch, urlStart, importFileName, urlEnd, mediaTypes) {
            //Only process media type "all" or empty media type rules.
            if (mediaTypes && ((mediaTypes.replace(/^\s\s*/, '').replace(/\s\s*$/, '')) !== "all")) {
                skippedList.push(fileName);
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
                    importContents = file.readFile(fullImportFileName),
                    importEndIndex, importPath, flat;

                //Skip the file if it has already been included.
                if (included[fullImportFileName]) {
                    return '';
                }
                included[fullImportFileName] = true;

                //Make sure to flatten any nested imports.
                flat = flattenCss(fullImportFileName, importContents, cssImportIgnore, cssPrefix, included);
                importContents = flat.fileContents;

                if (flat.importList.length) {
                    importList.push.apply(importList, flat.importList);
                }
                if (flat.skippedList.length) {
                    skippedList.push.apply(skippedList, flat.skippedList);
                }

                //Make the full import path
                importEndIndex = importFileName.lastIndexOf("/");

                //Make a file path based on the last slash.
                //If no slash, so must be just a file name. Use empty string then.
                importPath = (importEndIndex !== -1) ? importFileName.substring(0, importEndIndex + 1) : "";

                //fix url() on relative import (#5)
                importPath = importPath.replace(/^\.\//, '');

                //Modify URL paths to match the path represented by this file.
                importContents = fixCssUrlPaths(importFileName, importPath, importContents, cssPrefix);

                importList.push(fullImportFileName);
                return importContents;
            } catch (e) {
                logger.warn(fileName + "\n  Cannot inline css import, skipping: " + importFileName);
                return fullMatch;
            }
        });

        if (cssPrefix && topLevel) {
            //Modify URL paths to match the path represented by this file.
            fileContents = fixCssUrlPaths(fileName, '', fileContents, cssPrefix);
        }

        return {
            importList : importList,
            skippedList: skippedList,
            fileContents : fileContents
        };
    }

    optimize = {
        /**
         * Optimizes a file that contains JavaScript content. Optionally collects
         * plugin resources mentioned in a file, and then passes the content
         * through an minifier if one is specified via config.optimize.
         *
         * @param {String} fileName the name of the file to optimize
         * @param {String} fileContents the contents to optimize. If this is
         * a null value, then fileName will be used to read the fileContents.
         * @param {String} outFileName the name of the file to use for the
         * saved optimized content.
         * @param {Object} config the build config object.
         * @param {Array} [pluginCollector] storage for any plugin resources
         * found.
         */
        jsFile: function (fileName, fileContents, outFileName, config, pluginCollector) {
            if (!fileContents) {
                fileContents = file.readFile(fileName);
            }

            fileContents = optimize.js(fileName, fileContents, outFileName, config, pluginCollector);

            file.saveUtf8File(outFileName, fileContents);
        },

        /**
         * Optimizes a file that contains JavaScript content. Optionally collects
         * plugin resources mentioned in a file, and then passes the content
         * through an minifier if one is specified via config.optimize.
         *
         * @param {String} fileName the name of the file that matches the
         * fileContents.
         * @param {String} fileContents the string of JS to optimize.
         * @param {Object} [config] the build config object.
         * @param {Array} [pluginCollector] storage for any plugin resources
         * found.
         */
        js: function (fileName, fileContents, outFileName, config, pluginCollector) {
            var optFunc, optConfig,
                parts = (String(config.optimize)).split('.'),
                optimizerName = parts[0],
                keepLines = parts[1] === 'keepLines',
                licenseContents = '';

            config = config || {};

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

                optConfig = config[optimizerName] || {};
                if (config.generateSourceMaps) {
                    optConfig.generateSourceMaps = !!config.generateSourceMaps;
                    optConfig._buildSourceMap = config._buildSourceMap;
                }

                try {
                    if (config.preserveLicenseComments) {
                        //Pull out any license comments for prepending after optimization.
                        try {
                            licenseContents = parse.getLicenseComments(fileName, fileContents);
                        } catch (e) {
                            throw new Error('Cannot parse file: ' + fileName + ' for comments. Skipping it. Error is:\n' + e.toString());
                        }
                    }

                    if (config.generateSourceMaps && licenseContents) {
                        optConfig.preamble = licenseContents;
                        licenseContents = '';
                    }

                    fileContents = licenseContents + optFunc(fileName,
                                                             fileContents,
                                                             outFileName,
                                                             keepLines,
                                                             optConfig);
                    if (optConfig._buildSourceMap && optConfig._buildSourceMap !== config._buildSourceMap) {
                        config._buildSourceMap = optConfig._buildSourceMap;
                    }
                } catch (e) {
                    if (config.throwWhen && config.throwWhen.optimize) {
                        throw e;
                    } else {
                        logger.error(e);
                    }
                }
            } else {
                if (config._buildSourceMap) {
                    config._buildSourceMap = null;
                }
            }

            return fileContents;
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
                flat = flattenCss(fileName, originalFileContents, config.cssImportIgnore, config.cssPrefix, {}, true),
                //Do not use the flattened CSS if there was one that was skipped.
                fileContents = flat.skippedList.length ? originalFileContents : flat.fileContents,
                startIndex, endIndex, buildText, comment;

            if (flat.skippedList.length) {
                logger.warn('Cannot inline @imports for ' + fileName +
                            ',\nthe following files had media queries in them:\n' +
                            flat.skippedList.join('\n'));
            }

            //Do comment removal.
            try {
                if (config.optimizeCss.indexOf(".keepComments") === -1) {
                    startIndex = 0;
                    //Get rid of comments.
                    while ((startIndex = fileContents.indexOf("/*", startIndex)) !== -1) {
                        endIndex = fileContents.indexOf("*/", startIndex + 2);
                        if (endIndex === -1) {
                            throw "Improper comment in CSS file: " + fileName;
                        }
                        comment = fileContents.substring(startIndex, endIndex);

                        if (config.preserveLicenseComments &&
                            (comment.indexOf('license') !== -1 ||
                             comment.indexOf('opyright') !== -1 ||
                             comment.indexOf('(c)') !== -1)) {
                            //Keep the comment, just increment the startIndex
                            startIndex = endIndex;
                        } else {
                            fileContents = fileContents.substring(0, startIndex) + fileContents.substring(endIndex + 2, fileContents.length);
                            startIndex = 0;
                        }
                    }
                }
                //Get rid of newlines.
                if (config.optimizeCss.indexOf(".keepLines") === -1) {
                    fileContents = fileContents.replace(/[\r\n]/g, " ");
                    fileContents = fileContents.replace(/\s+/g, " ");
                    fileContents = fileContents.replace(/\{\s/g, "{");
                    fileContents = fileContents.replace(/\s\}/g, "}");
                } else {
                    //Remove multiple empty lines.
                    fileContents = fileContents.replace(/(\r\n)+/g, "\r\n");
                    fileContents = fileContents.replace(/(\n)+/g, "\n");
                }
                //Remove unnecessary whitespace
                if (config.optimizeCss.indexOf(".keepWhitespace") === -1) {
                    //Remove leading and trailing whitespace from lines
                    fileContents = fileContents.replace(/^[ \t]+/gm, "");
                    fileContents = fileContents.replace(/[ \t]+$/gm, "");
                    //Remove whitespace after semicolon, colon, curly brackets and commas
                    fileContents = fileContents.replace(/(;|:|\{|}|,)[ \t]+/g, "$1");
                    //Remove whitespace before opening curly brackets
                    fileContents = fileContents.replace(/[ \t]+(\{)/g, "$1");
                    //Truncate double whitespace
                    fileContents = fileContents.replace(/([ \t])+/g, "$1");
                    //Remove empty lines
                    fileContents = fileContents.replace(/^[ \t]*[\r\n]/gm,'');
                }
            } catch (e) {
                fileContents = originalFileContents;
                logger.error("Could not optimized CSS file: " + fileName + ", error: " + e);
            }

            file.saveUtf8File(outFileName, fileContents);

            //text output to stdout and/or written to build.txt file
            buildText = "\n"+ outFileName.replace(config.dir, "") +"\n----------------\n";
            flat.importList.push(fileName);
            buildText += flat.importList.map(function(path){
                return path.replace(config.dir, "");
            }).join("\n");

            return {
                importList: flat.importList,
                buildText: buildText +"\n"
            };
        },

        /**
         * Optimizes CSS files, inlining @import calls, stripping comments, and
         * optionally removes line returns.
         * @param {String} startDir the path to the top level directory
         * @param {Object} config the config object with the optimizeCss and
         * cssImportIgnore options.
         */
        css: function (startDir, config) {
            var buildText = "",
                importList = [],
                shouldRemove = config.dir && config.removeCombined,
                i, fileName, result, fileList;
            if (config.optimizeCss.indexOf("standard") !== -1) {
                fileList = file.getFilteredFileList(startDir, /\.css$/, true);
                if (fileList) {
                    for (i = 0; i < fileList.length; i++) {
                        fileName = fileList[i];
                        logger.trace("Optimizing (" + config.optimizeCss + ") CSS file: " + fileName);
                        result = optimize.cssFile(fileName, fileName, config);
                        buildText += result.buildText;
                        if (shouldRemove) {
                            result.importList.pop();
                            importList = importList.concat(result.importList);
                        }
                    }
                }

                if (shouldRemove) {
                    importList.forEach(function (path) {
                        if (file.exists(path)) {
                            file.deleteFile(path);
                        }
                    });
                }
            }
            return buildText;
        },

        optimizers: {
            uglify: function (fileName, fileContents, outFileName, keepLines, config) {
                var result, existingMap, resultMap, finalMap, sourceIndex,
                    uconfig = {},
                    existingMapPath = outFileName + '.map',
                    baseName = fileName && fileName.split('/').pop();

                config = config || {};

                lang.mixin(uconfig, config, true);

                uconfig.fromString = true;

                if (config.preamble) {
                    uconfig.output = {preamble: config.preamble};
                }


                if (config.generateSourceMaps && (outFileName || config._buildSourceMap)) {
                    uconfig.outSourceMap = baseName + '.map';

                    if (config._buildSourceMap) {
                        existingMap = JSON.parse(config._buildSourceMap);
                        uconfig.inSourceMap = existingMap;
                    } else if (file.exists(existingMapPath)) {
                        uconfig.inSourceMap = existingMapPath;
                        existingMap = JSON.parse(file.readFile(existingMapPath));
                    }
                }

                logger.trace("Uglify file: " + fileName);

                try {
                    //var tempContents = fileContents.replace(/\/\/\# sourceMappingURL=.*$/, '');
                    result = uglify.minify(fileContents, uconfig, baseName + '.src.js');
                    if (uconfig.outSourceMap && result.map) {
                        resultMap = result.map;
                        if (!existingMap && !config._buildSourceMap) {
                            file.saveFile(outFileName + '.src.js', fileContents);
                        }

                        fileContents = result.code;

                        if (config._buildSourceMap) {
                            config._buildSourceMap = resultMap;
                        } else {
                            file.saveFile(outFileName + '.map', resultMap);
                        }
                    } else {
                        fileContents = result.code;
                    }
                } catch (e) {
                    var errorString = e.toString();
                    var isSyntaxError = /SyntaxError/.test(errorString);
                    throw new Error('Cannot uglify file: ' + fileName +
                                    '. Skipping it. Error is:\n' + errorString +
                                  (isSyntaxError ? '\n\n' + es5PlusGuidance : ''));
                }
                return fileContents;
            }
        }
    };

    return optimize;
});
