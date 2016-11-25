/*jslint plusplus: true, nomen: true, regexp: true  */
/*global define, requirejs, java, process, console */


define(function (require) {
    'use strict';

    var build,
        lang = require('lang'),
        prim = require('prim'),
        logger = require('logger'),
        file = require('env!env/file'),
        parse = require('parse'),
        optimize = require('optimize'),
        pragma = require('pragma'),
        transform = require('transform'),
        requirePatch = require('requirePatch'),
        env = require('env'),
        commonJs = require('commonJs'),
        SourceMapGenerator = require('source-map').SourceMapGenerator,
        hasProp = lang.hasProp,
        getOwn = lang.getOwn,
        falseProp = lang.falseProp,
        endsWithSemiColonRegExp = /;\s*$/,
        endsWithSlashRegExp = /[\/\\]$/,
        resourceIsModuleIdRegExp = /^[\w\/\\\.]+$/,
        deepCopyProps = {
            layer: true
        };

    //Deep copy a config object, but do not copy over the "layer" property,
    //as it can be a deeply nested structure with a full requirejs context.
    function copyConfig(obj) {
        return lang.deeplikeCopy(obj, deepCopyProps);
    }

    prim.nextTick = function (fn) {
        fn();
    };

    //Now map require to the outermost requirejs, now that we have
    //local dependencies for this module. The rest of the require use is
    //manipulating the requirejs loader.
    require = requirejs;

    //Caching function for performance. Attached to
    //require so it can be reused in requirePatch.js. _cachedRawText
    //set up by requirePatch.js
    require._cacheReadAsync = function (path, encoding) {
        var d;

        if (lang.hasProp(require._cachedRawText, path)) {
            d = prim();
            d.resolve(require._cachedRawText[path]);
            return d.promise;
        } else {
            return file.readFileAsync(path, encoding).then(function (text) {
                require._cachedRawText[path] = text;
                return text;
            });
        }
    };

    function makeBuildBaseConfig() {
        return {
            appDir: "",
            pragmas: {},
            paths: {},
            optimize: "uglify",
            optimizeCss: "standard.keepLines.keepWhitespace",
            inlineText: true,
            isBuild: true,
            optimizeAllPluginResources: false,
            findNestedDependencies: false,
            preserveLicenseComments: true,
            writeBuildTxt: true,
            //Some builds can take a while, up the default limit.
            waitSeconds: 30,
            //By default, all files/directories are copied, unless
            //they match this regexp, by default just excludes .folders
            dirExclusionRegExp: file.dirExclusionRegExp,
            _buildPathToModuleIndex: {}
        };
    }

    /**
     * Some JS may not be valid if concatenated with other JS, in particular
     * the style of omitting semicolons and rely on ASI. Add a semicolon in
     * those cases.
     */
    function addSemiColon(text, config) {
        if (config.skipSemiColonInsertion || endsWithSemiColonRegExp.test(text)) {
            return text;
        } else {
            return text + ";";
        }
    }

    function endsWithSlash(dirName) {
        if (dirName.charAt(dirName.length - 1) !== "/") {
            dirName += "/";
        }
        return dirName;
    }

    function endsWithNewLine(text) {
        if (text.charAt(text.length - 1) !== "\n") {
            text += "\n";
        }
        return text;
    }

    //Method used by plugin writeFile calls, defined up here to avoid
    //jslint warning about "making a function in a loop".
    function makeWriteFile(namespace, layer) {
        function writeFile(name, contents) {
            logger.trace('Saving plugin-optimized file: ' + name);
            file.saveUtf8File(name, contents);
        }

        writeFile.asModule = function (moduleName, fileName, contents) {
            writeFile(fileName,
                build.toTransport(namespace, moduleName, fileName, contents, layer));
        };

        return writeFile;
    }

    /**
     * Appends singleContents to fileContents and returns the result.  If a sourceMapGenerator
     * is provided, adds singleContents to the source map.
     *
     * @param {string} fileContents - The file contents to which to append singleContents
     * @param {string} singleContents - The additional contents to append to fileContents
     * @param {string} path - An absolute path of a file whose name to use in the source map.
     * The file need not actually exist if the code in singleContents is generated.
     * @param {{out: ?string, baseUrl: ?string}} config - The build configuration object.
     * @param {?{_buildPath: ?string}} module - An object with module information.
     * @param {?SourceMapGenerator} sourceMapGenerator - An instance of Mozilla's SourceMapGenerator,
     * or null if no source map is being generated.
     * @returns {string} fileContents with singleContents appended
     */
    function appendToFileContents(fileContents, singleContents, path, config, module, sourceMapGenerator) {
        var refPath, sourceMapPath, resourcePath, pluginId, sourceMapLineNumber, lineCount, parts, i;
        if (sourceMapGenerator) {
            if (config.out) {
                refPath = config.baseUrl;
            } else if (module && module._buildPath) {
                refPath = module._buildPath;
            } else {
                refPath = "";
            }
            parts = path.split('!');
            if (parts.length === 1) {
                //Not a plugin resource, fix the path
                sourceMapPath = build.makeRelativeFilePath(refPath, path);
            } else {
                //Plugin resource. If it looks like just a plugin
                //followed by a module ID, pull off the plugin
                //and put it at the end of the name, otherwise
                //just leave it alone.
                pluginId = parts.shift();
                resourcePath = parts.join('!');
                if (resourceIsModuleIdRegExp.test(resourcePath)) {
                    sourceMapPath = build.makeRelativeFilePath(refPath, require.toUrl(resourcePath)) +
                                    '!' + pluginId;
                } else {
                    sourceMapPath = path;
                }
            }

            sourceMapLineNumber = fileContents.split('\n').length - 1;
            lineCount = singleContents.split('\n').length;
            for (i = 1; i <= lineCount; i += 1) {
                sourceMapGenerator.addMapping({
                    generated: {
                        line: sourceMapLineNumber + i,
                        column: 0
                    },
                    original: {
                        line: i,
                        column: 0
                    },
                    source: sourceMapPath
                });
            }

            //Store the content of the original in the source
            //map since other transforms later like minification
            //can mess up translating back to the original
            //source.
            sourceMapGenerator.setSourceContent(sourceMapPath, singleContents);
        }
        fileContents += singleContents;
        return fileContents;
    }

    /**
     * Main API entry point into the build. The args argument can either be
     * an array of arguments (like the onese passed on a command-line),
     * or it can be a JavaScript object that has the format of a build profile
     * file.
     *
     * If it is an object, then in addition to the normal properties allowed in
     * a build profile file, the object should contain one other property:
     *
     * The object could also contain a "buildFile" property, which is a string
     * that is the file path to a build profile that contains the rest
     * of the build profile directives.
     *
     * This function does not return a status, it should throw an error if
     * there is a problem completing the build.
     */
    build = function (args) {
        var buildFile, cmdConfig, errorMsg, errorStack, stackMatch, errorTree,
            i, j, errorMod,
            stackRegExp = /( {4}at[^\n]+)\n/,
            standardIndent = '  ';

        return prim().start(function () {
            if (!args || lang.isArray(args)) {
                if (!args || args.length < 1) {
                    logger.error("build.js buildProfile.js\n" +
                          "where buildProfile.js is the name of the build file (see example.build.js for hints on how to make a build file).");
                    return undefined;
                }

                //Next args can include a build file path as well as other build args.
                //build file path comes first. If it does not contain an = then it is
                //a build file path. Otherwise, just all build args.
                if (args[0].indexOf("=") === -1) {
                    buildFile = args[0];
                    args.splice(0, 1);
                }

                //Remaining args are options to the build
                cmdConfig = build.convertArrayToObject(args);
                cmdConfig.buildFile = buildFile;
            } else {
                cmdConfig = args;
            }

            return build._run(cmdConfig);
        }).then(null, function (e) {
            var err;

            errorMsg = e.toString();
            errorTree = e.moduleTree;
            stackMatch = stackRegExp.exec(errorMsg);

            if (stackMatch) {
                errorMsg += errorMsg.substring(0, stackMatch.index + stackMatch[0].length + 1);
            }

            //If a module tree that shows what module triggered the error,
            //print it out.
            if (errorTree && errorTree.length > 0) {
                errorMsg += '\nIn module tree:\n';

                for (i = errorTree.length - 1; i > -1; i--) {
                    errorMod = errorTree[i];
                    if (errorMod) {
                        for (j = errorTree.length - i; j > -1; j--) {
                            errorMsg += standardIndent;
                        }
                        errorMsg += errorMod + '\n';
                    }
                }

                logger.error(errorMsg);
            }

            errorStack = e.stack;

            if (typeof args === 'string' && args.indexOf('stacktrace=true') !== -1) {
                errorMsg += '\n' + errorStack;
            } else {
                if (!stackMatch && errorStack) {
                    //Just trim out the first "at" in the stack.
                    stackMatch = stackRegExp.exec(errorStack);
                    if (stackMatch) {
                        errorMsg += '\n' + stackMatch[0] || '';
                    }
                }
            }

            err = new Error(errorMsg);
            err.originalError = e;
            throw err;
        });
    };

    build._run = function (cmdConfig) {
        var buildPaths, fileName, fileNames,
            paths, i,
            baseConfig, config,
            modules, srcPath, buildContext,
            destPath, moduleMap, parentModuleMap, context,
            resources, resource, plugin, fileContents,
            pluginProcessed = {},
            buildFileContents = "",
            pluginCollector = {};

        return prim().start(function () {
            var prop;

            //Can now run the patches to require.js to allow it to be used for
            //build generation. Do it here instead of at the top of the module
            //because we want normal require behavior to load the build tool
            //then want to switch to build mode.
            requirePatch();

            config = build.createConfig(cmdConfig);
            paths = config.paths;

            //Remove the previous build dir, in case it contains source transforms,
            //like the ones done with onBuildRead and onBuildWrite.
            if (config.dir && !config.keepBuildDir && file.exists(config.dir)) {
                file.deleteFile(config.dir);
            }

            if (!config.out && !config.cssIn) {
                //This is not just a one-off file build but a full build profile, with
                //lots of files to process.

                //First copy all the baseUrl content
                file.copyDir((config.appDir || config.baseUrl), config.dir, /\w/, true);

                //Adjust baseUrl if config.appDir is in play, and set up build output paths.
                buildPaths = {};
                if (config.appDir) {
                    //All the paths should be inside the appDir, so just adjust
                    //the paths to use the dirBaseUrl
                    for (prop in paths) {
                        if (hasProp(paths, prop)) {
                            buildPaths[prop] = paths[prop].replace(config.appDir, config.dir);
                        }
                    }
                } else {
                    //If no appDir, then make sure to copy the other paths to this directory.
                    for (prop in paths) {
                        if (hasProp(paths, prop)) {
                            //Set up build path for each path prefix, but only do so
                            //if the path falls out of the current baseUrl
                            if (paths[prop].indexOf(config.baseUrl) === 0) {
                                buildPaths[prop] = paths[prop].replace(config.baseUrl, config.dirBaseUrl);
                            } else {
                                buildPaths[prop] = paths[prop] === 'empty:' ? 'empty:' : prop;

                                //Make sure source path is fully formed with baseUrl,
                                //if it is a relative URL.
                                srcPath = paths[prop];
                                if (srcPath.indexOf('/') !== 0 && srcPath.indexOf(':') === -1) {
                                    srcPath = config.baseUrl + srcPath;
                                }

                                destPath = config.dirBaseUrl + buildPaths[prop];

                                //Skip empty: paths
                                if (srcPath !== 'empty:') {
                                    //If the srcPath is a directory, copy the whole directory.
                                    if (file.exists(srcPath) && file.isDirectory(srcPath)) {
                                        //Copy files to build area. Copy all files (the /\w/ regexp)
                                        file.copyDir(srcPath, destPath, /\w/, true);
                                    } else {
                                        //Try a .js extension
                                        srcPath += '.js';
                                        destPath += '.js';
                                        file.copyFile(srcPath, destPath);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            //Figure out source file location for each module layer. Do this by seeding require
            //with source area configuration. This is needed so that later the module layers
            //can be manually copied over to the source area, since the build may be
            //require multiple times and the above copyDir call only copies newer files.
            require({
                baseUrl: config.baseUrl,
                paths: paths,
                packagePaths: config.packagePaths,
                packages: config.packages
            });
            buildContext = require.s.contexts._;
            modules = config.modules;

            if (modules) {
                modules.forEach(function (module) {
                    if (module.name) {
                        module._sourcePath = buildContext.nameToUrl(module.name);
                        //If the module does not exist, and this is not a "new" module layer,
                        //as indicated by a true "create" property on the module, and
                        //it is not a plugin-loaded resource, and there is no
                        //'rawText' containing the module's source then throw an error.
                        if (!file.exists(module._sourcePath) && !module.create &&
                                module.name.indexOf('!') === -1 &&
                                (!config.rawText || !lang.hasProp(config.rawText, module.name))) {
                            throw new Error("ERROR: module path does not exist: " +
                                            module._sourcePath + " for module named: " + module.name +
                                            ". Path is relative to: " + file.absPath('.'));
                        }
                    }
                });
            }

            if (config.out) {
                //Just set up the _buildPath for the module layer.
                require(config);
                if (!config.cssIn) {
                    config.modules[0]._buildPath = typeof config.out === 'function' ?
                                                   'FUNCTION' : config.out;
                }
            } else if (!config.cssIn) {
                //Now set up the config for require to use the build area, and calculate the
                //build file locations. Pass along any config info too.
                baseConfig = {
                    baseUrl: config.dirBaseUrl,
                    paths: buildPaths
                };

                lang.mixin(baseConfig, config);
                require(baseConfig);

                if (modules) {
                    modules.forEach(function (module) {
                        if (module.name) {
                            module._buildPath = buildContext.nameToUrl(module.name, null);

                            //If buildPath and sourcePath are the same, throw since this
                            //would result in modifying source. This condition can happen
                            //with some more tricky paths: config and appDir/baseUrl
                            //setting, which is a sign of incorrect config.
                            if (module._buildPath === module._sourcePath &&
                                !config.allowSourceOverwrites) {
                                throw new Error('Module ID \'' + module.name  +
                                                '\' has a source path that is same as output path: ' +
                                                module._sourcePath +
                                                '. Stopping, config is malformed.');
                            }

                            // Copy the file, but only if it is not provided in rawText.
                            if (!module.create && (!config.rawText || !lang.hasProp(config.rawText, module.name))) {
                                file.copyFile(module._sourcePath, module._buildPath);
                            }
                        }
                    });
                }
            }

            //Run CSS optimizations before doing JS module tracing, to allow
            //things like text loader plugins loading CSS to get the optimized
            //CSS.
            if (config.optimizeCss && config.optimizeCss !== "none" && config.dir) {
                buildFileContents += optimize.css(config.dir, config);
            }
        }).then(function() {
            baseConfig = copyConfig(require.s.contexts._.config);
        }).then(function () {
            var actions = [];

            if (modules) {
                actions = modules.map(function (module, i) {
                    return function () {
                        //Save off buildPath to module index in a hash for quicker
                        //lookup later.
                        config._buildPathToModuleIndex[file.normalize(module._buildPath)] = i;

                        //Call require to calculate dependencies.
                        return build.traceDependencies(module, config, baseConfig)
                            .then(function (layer) {
                                module.layer = layer;
                            });
                    };
                });

                return prim.serial(actions);
            }
        }).then(function () {
            var actions;

            if (modules) {
                //Now build up shadow layers for anything that should be excluded.
                //Do this after tracing dependencies for each module, in case one
                //of those modules end up being one of the excluded values.
                actions = modules.map(function (module) {
                    return function () {
                        if (module.exclude) {
                            module.excludeLayers = [];
                            return prim.serial(module.exclude.map(function (exclude, i) {
                                return function () {
                                    //See if it is already in the list of modules.
                                    //If not trace dependencies for it.
                                    var found = build.findBuildModule(exclude, modules);
                                    if (found) {
                                        module.excludeLayers[i] = found;
                                    } else {
                                        return build.traceDependencies({name: exclude}, config, baseConfig)
                                            .then(function (layer) {
                                                module.excludeLayers[i] = { layer: layer };
                                            });
                                    }
                                };
                            }));
                        }
                    };
                });

                return prim.serial(actions);
            }
        }).then(function () {
            if (modules) {
                return prim.serial(modules.map(function (module) {
                    return function () {
                        if (module.exclude) {
                            //module.exclude is an array of module names. For each one,
                            //get the nested dependencies for it via a matching entry
                            //in the module.excludeLayers array.
                            module.exclude.forEach(function (excludeModule, i) {
                                var excludeLayer = module.excludeLayers[i].layer,
                                    map = excludeLayer.buildFileToModule;
                                excludeLayer.buildFilePaths.forEach(function(filePath){
                                    build.removeModulePath(map[filePath], filePath, module.layer);
                                });
                            });
                        }
                        if (module.excludeShallow) {
                            //module.excludeShallow is an array of module names.
                            //shallow exclusions are just that module itself, and not
                            //its nested dependencies.
                            module.excludeShallow.forEach(function (excludeShallowModule) {
                                var path = getOwn(module.layer.buildPathMap, excludeShallowModule);
                                if (path) {
                                    build.removeModulePath(excludeShallowModule, path, module.layer);
                                }
                            });
                        }

                        //Flatten them and collect the build output for each module.
                        return build.flattenModule(module, module.layer, config).then(function (builtModule) {
                            var finalText, baseName;
                            //Save it to a temp file for now, in case there are other layers that
                            //contain optimized content that should not be included in later
                            //layer optimizations. See issue #56.
                            if (module._buildPath === 'FUNCTION') {
                                module._buildText = builtModule.text;
                                module._buildSourceMap = builtModule.sourceMap;
                            } else {
                                finalText = builtModule.text;
                                if (builtModule.sourceMap) {
                                    baseName = module._buildPath.split('/');
                                    baseName = baseName.pop();
                                    finalText += '\n//# sourceMappingURL=' + baseName + '.map';
                                    file.saveUtf8File(module._buildPath + '.map', builtModule.sourceMap);
                                }
                                file.saveUtf8File(module._buildPath + '-temp', finalText);

                            }
                            buildFileContents += builtModule.buildText;
                        });
                    };
                }));
            }
        }).then(function () {
            var moduleName, outOrigSourceMap,
                bundlesConfig = {},
                bundlesConfigOutFile = config.bundlesConfigOutFile;

            if (modules) {
                //Now move the build layers to their final position.
                modules.forEach(function (module) {
                    var entryConfig,
                        finalPath = module._buildPath;

                    if (finalPath !== 'FUNCTION') {
                        if (file.exists(finalPath)) {
                            file.deleteFile(finalPath);
                        }
                        file.renameFile(finalPath + '-temp', finalPath);

                        //If bundles config should be written out, scan the
                        //built file for module IDs. Favor doing this reparse
                        //since tracking the IDs as the file is built has some
                        //edge cases around files that had more than one ID in
                        //them already, and likely loader plugin-written contents.
                        if (bundlesConfigOutFile) {
                            entryConfig = bundlesConfig[module.name] = [];
                            var bundleContents = file.readFile(finalPath);
                            var excludeMap = {};
                            excludeMap[module.name] = true;
                            var parsedIds = parse.getAllNamedDefines(bundleContents, excludeMap);
                            entryConfig.push.apply(entryConfig, parsedIds);
                        }

                        //And finally, if removeCombined is specified, remove
                        //any of the files that were used in this layer.
                        //Be sure not to remove other build layers.
                        if (config.removeCombined && !config.out) {
                            module.layer.buildFilePaths.forEach(function (path) {
                                var isLayer = modules.some(function (mod) {
                                        return mod._buildPath === path;
                                    }),
                                    relPath = build.makeRelativeFilePath(config.dir, path);

                                if (file.exists(path) &&
                                    // not a build layer target
                                    !isLayer &&
                                    // not outside the build directory
                                    relPath.indexOf('..') !== 0) {
                                    file.deleteFile(path);
                                }
                            });
                        }
                    }

                    //Signal layer is done
                    if (config.onModuleBundleComplete) {
                        config.onModuleBundleComplete(module.onCompleteData);
                    }
                });

                //Write out bundles config, if it is wanted.
                if (bundlesConfigOutFile) {
                    var text = file.readFile(bundlesConfigOutFile);
                    text = transform.modifyConfig(text, function (config) {
                        if (!config.bundles) {
                            config.bundles = {};
                        }

                        lang.eachProp(bundlesConfig, function (value, prop) {
                            config.bundles[prop] = value;
                        });

                        return config;
                    });

                    file.saveUtf8File(bundlesConfigOutFile, text);
                }
            }

            //If removeCombined in play, remove any empty directories that
            //may now exist because of its use
            if (config.removeCombined && !config.out && config.dir) {
                file.deleteEmptyDirs(config.dir);
            }

            //Do other optimizations.
            if (config.out && !config.cssIn) {
                //Just need to worry about one JS file.
                fileName = config.modules[0]._buildPath;
                if (fileName === 'FUNCTION') {
                    outOrigSourceMap = config.modules[0]._buildSourceMap;
                    config._buildSourceMap = outOrigSourceMap;
                    config.modules[0]._buildText = optimize.js((config.modules[0].name ||
                                                                config.modules[0].include[0] ||
                                                                fileName) + '.build.js',
                                                               config.modules[0]._buildText,
                                                               null,
                                                               config);
                    if (config._buildSourceMap && config._buildSourceMap !== outOrigSourceMap) {
                        config.modules[0]._buildSourceMap = config._buildSourceMap;
                        config._buildSourceMap = null;
                    }
                } else {
                    optimize.jsFile(fileName, null, fileName, config);
                }
            } else if (!config.cssIn) {
                //Normal optimizations across modules.

                //JS optimizations.
                fileNames = file.getFilteredFileList(config.dir, /\.js$/, true);
                fileNames.forEach(function (fileName) {
                    var cfg, override, moduleIndex;

                    //Generate the module name from the config.dir root.
                    moduleName = fileName.replace(config.dir, '');
                    //Get rid of the extension
                    moduleName = moduleName.substring(0, moduleName.length - 3);

                    //If there is an override for a specific layer build module,
                    //and this file is that module, mix in the override for use
                    //by optimize.jsFile.
                    moduleIndex = getOwn(config._buildPathToModuleIndex, fileName);
                    //Normalize, since getOwn could have returned undefined
                    moduleIndex = moduleIndex === 0 || moduleIndex > 0 ? moduleIndex : -1;

                    //Try to avoid extra work if the other files do not need to
                    //be read. Build layers should be processed at the very
                    //least for optimization.
                    if (moduleIndex > -1 || !config.skipDirOptimize ||
                            config.normalizeDirDefines === "all" ||
                            config.cjsTranslate) {
                        //Convert the file to transport format, but without a name
                        //inserted (by passing null for moduleName) since the files are
                        //standalone, one module per file.
                        fileContents = file.readFile(fileName);


                        //For builds, if wanting cjs translation, do it now, so that
                        //the individual modules can be loaded cross domain via
                        //plain script tags.
                        if (config.cjsTranslate &&
                            (!config.shim || !lang.hasProp(config.shim, moduleName))) {
                            fileContents = commonJs.convert(fileName, fileContents);
                        }

                        if (moduleIndex === -1) {
                            if (config.onBuildRead) {
                                fileContents = config.onBuildRead(moduleName,
                                                                  fileName,
                                                                  fileContents);
                            }

                            //Only do transport normalization if this is not a build
                            //layer (since it was already normalized) and if
                            //normalizeDirDefines indicated all should be done.
                            if (config.normalizeDirDefines === "all") {
                                fileContents = build.toTransport(config.namespace,
                                                             null,
                                                             fileName,
                                                             fileContents);
                            }

                            if (config.onBuildWrite) {
                                fileContents = config.onBuildWrite(moduleName,
                                                                   fileName,
                                                                   fileContents);
                            }
                        }

                        override = moduleIndex > -1 ?
                                   config.modules[moduleIndex].override : null;
                        if (override) {
                            cfg = build.createOverrideConfig(config, override);
                        } else {
                            cfg = config;
                        }

                        if (moduleIndex > -1 || !config.skipDirOptimize) {
                            optimize.jsFile(fileName, fileContents, fileName, cfg, pluginCollector);
                        }
                    }
                });

                //Normalize all the plugin resources.
                context = require.s.contexts._;

                for (moduleName in pluginCollector) {
                    if (hasProp(pluginCollector, moduleName)) {
                        parentModuleMap = context.makeModuleMap(moduleName);
                        resources = pluginCollector[moduleName];
                        for (i = 0; i < resources.length; i++) {
                            resource = resources[i];
                            moduleMap = context.makeModuleMap(resource, parentModuleMap);
                            if (falseProp(context.plugins, moduleMap.prefix)) {
                                //Set the value in context.plugins so it
                                //will be evaluated as a full plugin.
                                context.plugins[moduleMap.prefix] = true;

                                //Do not bother if the plugin is not available.
                                if (!file.exists(require.toUrl(moduleMap.prefix + '.js'))) {
                                    continue;
                                }

                                //Rely on the require in the build environment
                                //to be synchronous
                                context.require([moduleMap.prefix]);

                                //Now that the plugin is loaded, redo the moduleMap
                                //since the plugin will need to normalize part of the path.
                                moduleMap = context.makeModuleMap(resource, parentModuleMap);
                            }

                            //Only bother with plugin resources that can be handled
                            //processed by the plugin, via support of the writeFile
                            //method.
                            if (falseProp(pluginProcessed, moduleMap.id)) {
                                //Only do the work if the plugin was really loaded.
                                //Using an internal access because the file may
                                //not really be loaded.
                                plugin = getOwn(context.defined, moduleMap.prefix);
                                if (plugin && plugin.writeFile) {
                                    plugin.writeFile(
                                        moduleMap.prefix,
                                        moduleMap.name,
                                        require,
                                        makeWriteFile(
                                            config.namespace
                                        ),
                                        context.config
                                    );
                                }

                                pluginProcessed[moduleMap.id] = true;
                            }
                        }

                    }
                }

                //console.log('PLUGIN COLLECTOR: ' + JSON.stringify(pluginCollector, null, "  "));


                //All module layers are done, write out the build.txt file.
                if (config.writeBuildTxt) {
                    file.saveUtf8File(config.dir + "build.txt", buildFileContents);
                }
            }

            //If just have one CSS file to optimize, do that here.
            if (config.cssIn) {
                buildFileContents += optimize.cssFile(config.cssIn, config.out, config).buildText;
            }

            if (typeof config.out === 'function') {
                config.out(config.modules[0]._buildText, config.modules[0]._buildSourceMap);
            }

            //Print out what was built into which layers.
            if (buildFileContents) {
                logger.info(buildFileContents);
                return buildFileContents;
            }

            return '';
        });
    };

    /**
     * Converts command line args like "paths.foo=../some/path"
     * result.paths = { foo: '../some/path' } where prop = paths,
     * name = paths.foo and value = ../some/path, so it assumes the
     * name=value splitting has already happened.
     */
    function stringDotToObj(result, name, value) {
        var parts = name.split('.');

        parts.forEach(function (prop, i) {
            if (i === parts.length - 1) {
                result[prop] = value;
            } else {
                if (falseProp(result, prop)) {
                    result[prop] = {};
                }
                result = result[prop];
            }

        });
    }

    build.objProps = {
        paths: true,
        wrap: true,
        pragmas: true,
        pragmasOnSave: true,
        has: true,
        hasOnSave: true,
        uglify: true,
        uglify2: true,
        closure: true,
        map: true,
        throwWhen: true
    };

    build.hasDotPropMatch = function (prop) {
        var dotProp,
            index = prop.indexOf('.');

        if (index !== -1) {
            dotProp = prop.substring(0, index);
            return hasProp(build.objProps, dotProp);
        }
        return false;
    };

    /**
     * Converts an array that has String members of "name=value"
     * into an object, where the properties on the object are the names in the array.
     * Also converts the strings "true" and "false" to booleans for the values.
     * member name/value pairs, and converts some comma-separated lists into
     * arrays.
     * @param {Array} ary
     */
    build.convertArrayToObject = function (ary) {
        var result = {}, i, separatorIndex, prop, value,
            needArray = {
                "include": true,
                "exclude": true,
                "excludeShallow": true,
                "insertRequire": true,
                "stubModules": true,
                "deps": true,
                "mainConfigFile": true,
                "wrap.startFile": true,
                "wrap.endFile": true
            };

        for (i = 0; i < ary.length; i++) {
            separatorIndex = ary[i].indexOf("=");
            if (separatorIndex === -1) {
                throw "Malformed name/value pair: [" + ary[i] + "]. Format should be name=value";
            }

            value = ary[i].substring(separatorIndex + 1, ary[i].length);
            if (value === "true") {
                value = true;
            } else if (value === "false") {
                value = false;
            }

            prop = ary[i].substring(0, separatorIndex);

            //Convert to array if necessary
            if (getOwn(needArray, prop)) {
                value = value.split(",");
            }

            if (build.hasDotPropMatch(prop)) {
                stringDotToObj(result, prop, value);
            } else {
                result[prop] = value;
            }
        }
        return result; //Object
    };

    build.makeAbsPath = function (path, absFilePath) {
        if (!absFilePath) {
            return path;
        }

        //Add abspath if necessary. If path starts with a slash or has a colon,
        //then already is an abolute path.
        if (path.indexOf('/') !== 0 && path.indexOf(':') === -1) {
            path = absFilePath +
                   (absFilePath.charAt(absFilePath.length - 1) === '/' ? '' : '/') +
                   path;
            path = file.normalize(path);
        }
        return path.replace(lang.backSlashRegExp, '/');
    };

    build.makeAbsObject = function (props, obj, absFilePath) {
        var i, prop;
        if (obj) {
            for (i = 0; i < props.length; i++) {
                prop = props[i];
                if (hasProp(obj, prop) && typeof obj[prop] === 'string') {
                    obj[prop] = build.makeAbsPath(obj[prop], absFilePath);
                }
            }
        }
    };

    /**
     * For any path in a possible config, make it absolute relative
     * to the absFilePath passed in.
     */
    build.makeAbsConfig = function (config, absFilePath) {
        var props, prop, i;

        props = ["appDir", "dir", "baseUrl"];
        for (i = 0; i < props.length; i++) {
            prop = props[i];

            if (getOwn(config, prop)) {
                //Add abspath if necessary, make sure these paths end in
                //slashes
                if (prop === "baseUrl") {
                    config.originalBaseUrl = config.baseUrl;
                    if (config.appDir) {
                        //If baseUrl with an appDir, the baseUrl is relative to
                        //the appDir, *not* the absFilePath. appDir and dir are
                        //made absolute before baseUrl, so this will work.
                        config.baseUrl = build.makeAbsPath(config.originalBaseUrl, config.appDir);
                    } else {
                        //The dir output baseUrl is same as regular baseUrl, both
                        //relative to the absFilePath.
                        config.baseUrl = build.makeAbsPath(config[prop], absFilePath);
                    }
                } else {
                    config[prop] = build.makeAbsPath(config[prop], absFilePath);
                }

                config[prop] = endsWithSlash(config[prop]);
            }
        }

        build.makeAbsObject((config.out === "stdout" ? ["cssIn"] : ["out", "cssIn"]),
                            config, absFilePath);
        build.makeAbsObject(["startFile", "endFile"], config.wrap, absFilePath);
        build.makeAbsObject(["externExportsPath"], config.closure, absFilePath);
    };

    /**
     * Creates a relative path to targetPath from refPath.
     * Only deals with file paths, not folders. If folders,
     * make sure paths end in a trailing '/'.
     */
    build.makeRelativeFilePath = function (refPath, targetPath) {
        var i, dotLength, finalParts, length, targetParts, targetName,
            refParts = refPath.split('/'),
            hasEndSlash = endsWithSlashRegExp.test(targetPath),
            dotParts = [];

        targetPath = file.normalize(targetPath);
        if (hasEndSlash && !endsWithSlashRegExp.test(targetPath)) {
            targetPath += '/';
        }
        targetParts = targetPath.split('/');
        //Pull off file name
        targetName = targetParts.pop();

        //Also pop off the ref file name to make the matches against
        //targetParts equivalent.
        refParts.pop();

        length = refParts.length;

        for (i = 0; i < length; i += 1) {
            if (refParts[i] !== targetParts[i]) {
                break;
            }
        }

        //Now i is the index in which they diverge.
        finalParts = targetParts.slice(i);

        dotLength = length - i;
        for (i = 0; i > -1 && i < dotLength; i += 1) {
            dotParts.push('..');
        }

        return dotParts.join('/') + (dotParts.length ? '/' : '') +
               finalParts.join('/') + (finalParts.length ? '/' : '') +
               targetName;
    };

    build.nestedMix = {
        paths: true,
        has: true,
        hasOnSave: true,
        pragmas: true,
        pragmasOnSave: true
    };

    /**
     * Mixes additional source config into target config, and merges some
     * nested config, like paths, correctly.
     */
    function mixConfig(target, source, skipArrays) {
        var prop, value, isArray, targetValue;

        for (prop in source) {
            if (hasProp(source, prop)) {
                //If the value of the property is a plain object, then
                //allow a one-level-deep mixing of it.
                value = source[prop];
                isArray = lang.isArray(value);
                if (typeof value === 'object' && value &&
                        !isArray && !lang.isFunction(value) &&
                        !lang.isRegExp(value)) {

                    // TODO: need to generalize this work, maybe also reuse
                    // the work done in requirejs configure, perhaps move to
                    // just a deep copy/merge overall. However, given the
                    // amount of observable change, wait for a dot release.
                    // This change is in relation to #645
                    if (prop === 'map') {
                        if (!target.map) {
                            target.map = {};
                        }
                        lang.deepMix(target.map, source.map);
                    } else {
                        target[prop] = lang.mixin({}, target[prop], value, true);
                    }
                } else if (isArray) {
                    if (!skipArrays) {
                        // Some config, like packages, are arrays. For those,
                        // just merge the results.
                        targetValue = target[prop];
                        if (lang.isArray(targetValue)) {
                            target[prop] = targetValue.concat(value);
                        } else {
                            target[prop] = value;
                        }
                    }
                } else {
                    target[prop] = value;
                }
            }
        }

        //Set up log level since it can affect if errors are thrown
        //or caught and passed to errbacks while doing config setup.
        if (lang.hasProp(target, 'logLevel')) {
            logger.logLevel(target.logLevel);
        }
    }

    /**
     * Converts a wrap.startFile or endFile to be start/end as a string.
     * the startFile/endFile values can be arrays.
     */
    function flattenWrapFile(config, keyName, absFilePath) {
        var wrap = config.wrap,
            keyFileName = keyName + 'File',
            keyMapName = '__' + keyName + 'Map';

        if (typeof wrap[keyName] !== 'string' && wrap[keyFileName]) {
            wrap[keyName] = '';
            if (typeof wrap[keyFileName] === 'string') {
                wrap[keyFileName] = [wrap[keyFileName]];
            }
            wrap[keyMapName] = [];
            wrap[keyFileName].forEach(function (fileName) {
                var absPath = build.makeAbsPath(fileName, absFilePath),
                    fileText = endsWithNewLine(file.readFile(absPath));
                wrap[keyMapName].push(function (fileContents, cfg, sourceMapGenerator) {
                    return appendToFileContents(fileContents, fileText, absPath, cfg, null, sourceMapGenerator);
                });
                wrap[keyName] += fileText;
            });
        } else if (wrap[keyName] === null ||  wrap[keyName] === undefined) {
            //Allow missing one, just set to empty string.
            wrap[keyName] = '';
        } else if (typeof wrap[keyName] === 'string') {
            wrap[keyName] = endsWithNewLine(wrap[keyName]);
            wrap[keyMapName] = [
                function (fileContents, cfg, sourceMapGenerator) {
                    var absPath = build.makeAbsPath("config-wrap-" + keyName + "-default.js", absFilePath);
                    return appendToFileContents(fileContents, wrap[keyName], absPath, cfg, null, sourceMapGenerator);
                }
            ];
        } else {
            throw new Error('wrap.' + keyName + ' or wrap.' + keyFileName + ' malformed');
        }
    }

    function normalizeWrapConfig(config, absFilePath) {
        //Get any wrap text.
        try {
            if (config.wrap) {
                if (config.wrap === true) {
                    //Use default values.
                    config.wrap = {
                        start: '(function () {\n',
                        end: '}());',
                        __startMap: [
                            function (fileContents, cfg, sourceMapGenerator) {
                                return appendToFileContents(fileContents, "(function () {\n",
                                                            build.makeAbsPath("config-wrap-start-default.js",
                                                                              absFilePath), cfg, null,
                                                            sourceMapGenerator);
                            }
                        ],
                        __endMap: [
                            function (fileContents, cfg, sourceMapGenerator) {
                                return appendToFileContents(fileContents, "}());",
                                                            build.makeAbsPath("config-wrap-end-default.js", absFilePath),
                                                            cfg, null, sourceMapGenerator);
                            }
                        ]
                    };
                } else {
                    flattenWrapFile(config, 'start', absFilePath);
                    flattenWrapFile(config, 'end', absFilePath);
                }
            }
        } catch (wrapError) {
            throw new Error('Malformed wrap config: ' + wrapError.toString());
        }
    }

    /**
     * Creates a config object for an optimization build.
     * It will also read the build profile if it is available, to create
     * the configuration.
     *
     * @param {Object} cfg config options that take priority
     * over defaults and ones in the build file. These options could
     * be from a command line, for instance.
     *
     * @param {Object} the created config object.
     */
    build.createConfig = function (cfg) {
        /*jslint evil: true */
        var buildFileContents, buildFileConfig, mainConfig,
            mainConfigFile, mainConfigPath, buildFile, absFilePath,
            config = {},
            buildBaseConfig = makeBuildBaseConfig();

        //Make sure all paths are relative to current directory.
        absFilePath = file.absPath('.');
        build.makeAbsConfig(cfg, absFilePath);
        build.makeAbsConfig(buildBaseConfig, absFilePath);

        lang.mixin(config, buildBaseConfig);
        lang.mixin(config, cfg, true);

        //Set up log level early since it can affect if errors are thrown
        //or caught and passed to errbacks, even while constructing config.
        if (lang.hasProp(config, 'logLevel')) {
            logger.logLevel(config.logLevel);
        }

        if (config.buildFile) {
            //A build file exists, load it to get more config.
            buildFile = file.absPath(config.buildFile);

            //Find the build file, and make sure it exists, if this is a build
            //that has a build profile, and not just command line args with an in=path
            if (!file.exists(buildFile)) {
                throw new Error("ERROR: build file does not exist: " + buildFile);
            }

            absFilePath = config.baseUrl = file.absPath(file.parent(buildFile));

            //Load build file options.
            buildFileContents = file.readFile(buildFile);
            try {
                //Be a bit lenient in the file ending in a ; or ending with
                //a //# sourceMappingUrl comment, mostly for compiled languages
                //that create a config, like typescript.
                buildFileContents = buildFileContents
                                    .replace(/\/\/\#[^\n\r]+[\n\r]*$/, '')
                                    .trim()
                                    .replace(/;$/, '');

                buildFileConfig = eval("(" + buildFileContents + ")");
                build.makeAbsConfig(buildFileConfig, absFilePath);

                //Mix in the config now so that items in mainConfigFile can
                //be resolved relative to them if necessary, like if appDir
                //is set here, but the baseUrl is in mainConfigFile. Will
                //re-mix in the same build config later after mainConfigFile
                //is processed, since build config should take priority.
                mixConfig(config, buildFileConfig);
            } catch (e) {
                throw new Error("Build file " + buildFile + " is malformed: " + e);
            }
        }

        mainConfigFile = config.mainConfigFile || (buildFileConfig && buildFileConfig.mainConfigFile);
        if (mainConfigFile) {
            if (typeof mainConfigFile === 'string') {
                mainConfigFile = [mainConfigFile];
            }

            mainConfigFile.forEach(function (configFile) {
                configFile = build.makeAbsPath(configFile, absFilePath);
                if (!file.exists(configFile)) {
                    throw new Error(configFile + ' does not exist.');
                }
                try {
                    mainConfig = parse.findConfig(file.readFile(configFile)).config;
                } catch (configError) {
                    throw new Error('The config in mainConfigFile ' +
                            configFile +
                            ' cannot be used because it cannot be evaluated' +
                            ' correctly while running in the optimizer. Try only' +
                            ' using a config that is also valid JSON, or do not use' +
                            ' mainConfigFile and instead copy the config values needed' +
                            ' into a build file or command line arguments given to the optimizer.\n' +
                            'Source error from parsing: ' + configFile + ': ' + configError);
                }
                if (mainConfig) {
                    mainConfigPath = configFile.substring(0, configFile.lastIndexOf('/'));

                    //Add in some existing config, like appDir, since they can be
                    //used inside the configFile -- paths and baseUrl are
                    //relative to them.
                    if (config.appDir && !mainConfig.appDir) {
                        mainConfig.appDir = config.appDir;
                    }

                    //If no baseUrl, then use the directory holding the main config.
                    if (!mainConfig.baseUrl) {
                        mainConfig.baseUrl = mainConfigPath;
                    }

                    build.makeAbsConfig(mainConfig, mainConfigPath);
                    mixConfig(config, mainConfig);
                }
            });
        }

        //Mix in build file config, but only after mainConfig has been mixed in.
        //Since this is a re-application, skip array merging.
        if (buildFileConfig) {
            mixConfig(config, buildFileConfig, true);
        }

        //Re-apply the override config values. Command line
        //args should take precedence over build file values.
        //Since this is a re-application, skip array merging.
        mixConfig(config, cfg, true);

        //Fix paths to full paths so that they can be adjusted consistently
        //lately to be in the output area.
        lang.eachProp(config.paths, function (value, prop) {
            if (lang.isArray(value)) {
                throw new Error('paths fallback not supported in optimizer. ' +
                                'Please provide a build config path override ' +
                                'for ' + prop);
            }
            config.paths[prop] = build.makeAbsPath(value, config.baseUrl);
        });

        //Set final output dir
        if (hasProp(config, "baseUrl")) {
            if (config.appDir) {
                if (!config.originalBaseUrl) {
                    throw new Error('Please set a baseUrl in the build config');
                }
                config.dirBaseUrl = build.makeAbsPath(config.originalBaseUrl, config.dir);
            } else {
                config.dirBaseUrl = config.dir || config.baseUrl;
            }
            //Make sure dirBaseUrl ends in a slash, since it is
            //concatenated with other strings.
            config.dirBaseUrl = endsWithSlash(config.dirBaseUrl);
        }

        if (config.bundlesConfigOutFile) {
            if (!config.dir) {
                throw new Error('bundlesConfigOutFile can only be used with optimizations ' +
                                'that use "dir".');
            }
            config.bundlesConfigOutFile = build.makeAbsPath(config.bundlesConfigOutFile, config.dir);
        }

        //If out=stdout, write output to STDOUT instead of a file.
        if (config.out && config.out === 'stdout') {
            config.out = function (content) {
                var e = env.get();
                if (e === 'rhino') {
                    var out = new java.io.PrintStream(java.lang.System.out, true, 'UTF-8');
                    out.println(content);
                } else if (e === 'node') {
                    process.stdout.write(content, 'utf8');
                } else {
                    console.log(content);
                }
            };
        }

        //Check for errors in config
        if (config.main) {
            throw new Error('"main" passed as an option, but the ' +
                            'supported option is called "name".');
        }
        if (config.out && !config.name && !config.modules && !config.include &&
                !config.cssIn) {
            throw new Error('Missing either a "name", "include" or "modules" ' +
                            'option');
        }
        if (config.cssIn) {
            if (config.dir || config.appDir) {
                throw new Error('cssIn is only for the output of single file ' +
                    'CSS optimizations and is not compatible with "dir" or "appDir" configuration.');
            }
            if (!config.out) {
                throw new Error('"out" option missing.');
            }
        }
        if (!config.cssIn && !config.baseUrl) {
            //Just use the current directory as the baseUrl
            config.baseUrl = './';
        }
        if (!config.out && !config.dir) {
            throw new Error('Missing either an "out" or "dir" config value. ' +
                            'If using "appDir" for a full project optimization, ' +
                            'use "dir". If you want to optimize to one file, ' +
                            'use "out".');
        }
        if (config.appDir && config.out) {
            throw new Error('"appDir" is not compatible with "out". Use "dir" ' +
                            'instead. appDir is used to copy whole projects, ' +
                            'where "out" with "baseUrl" is used to just ' +
                            'optimize to one file.');
        }
        if (config.out && config.dir) {
            throw new Error('The "out" and "dir" options are incompatible.' +
                            ' Use "out" if you are targeting a single file' +
                            ' for optimization, and "dir" if you want the appDir' +
                            ' or baseUrl directories optimized.');
        }


        if (config.dir) {
            // Make sure the output dir is not set to a parent of the
            // source dir or the same dir, as it will result in source
            // code deletion.
            if (!config.allowSourceOverwrites && (config.dir === config.baseUrl ||
                config.dir === config.appDir ||
                (config.baseUrl && build.makeRelativeFilePath(config.dir,
                                           config.baseUrl).indexOf('..') !== 0) ||
                (config.appDir &&
                    build.makeRelativeFilePath(config.dir, config.appDir).indexOf('..') !== 0))) {
                throw new Error('"dir" is set to a parent or same directory as' +
                                ' "appDir" or "baseUrl". This can result in' +
                                ' the deletion of source code. Stopping. If' +
                                ' you want to allow possible overwriting of' +
                                ' source code, set "allowSourceOverwrites"' +
                                ' to true in the build config, but do so at' +
                                ' your own risk. In that case, you may want' +
                                ' to also set "keepBuildDir" to true.');
            }
        }

        if (config.insertRequire && !lang.isArray(config.insertRequire)) {
            throw new Error('insertRequire should be a list of module IDs' +
                            ' to insert in to a require([]) call.');
        }

        //Support older configs with uglify2 settings, but now that uglify1 has
        //been removed, just translate it to 'uglify' settings.
        if (config.optimize === 'uglify2') {
            config.optimize = 'uglify';
        }
        if (config.uglify2) {
            config.uglify = config.uglify2;
            delete config.uglify2;
        }

        if (config.generateSourceMaps) {
            if (config.preserveLicenseComments && !(config.optimize === 'none' || config.optimize === 'uglify')) {
                throw new Error('Cannot use preserveLicenseComments and ' +
                    'generateSourceMaps together, unless optimize is set ' +
                    'to \'uglify\'. Either explicitly set preserveLicenseComments ' +
                    'to false (default is true) or turn off generateSourceMaps. ' +
                    'If you want source maps with license comments, see: ' +
                    'http://requirejs.org/docs/errors.html#sourcemapcomments');
            } else if (config.optimize !== 'none' &&
                       config.optimize !== 'closure' &&
                       config.optimize !== 'uglify') {
                //Allow optimize: none to pass, since it is useful when toggling
                //minification on and off to debug something, and it implicitly
                //works, since it does not need a source map.
                throw new Error('optimize: "' + config.optimize +
                    '" does not support generateSourceMaps.');
            }
        }

        if ((config.name || config.include) && !config.modules) {
            //Just need to build one file, but may be part of a whole appDir/
            //baseUrl copy, but specified on the command line, so cannot do
            //the modules array setup. So create a modules section in that
            //case.
            config.modules = [
                {
                    name: config.name,
                    out: config.out,
                    create: config.create,
                    include: config.include,
                    exclude: config.exclude,
                    excludeShallow: config.excludeShallow,
                    insertRequire: config.insertRequire,
                    stubModules: config.stubModules
                }
            ];
            delete config.stubModules;
        } else if (config.modules && config.out) {
            throw new Error('If the "modules" option is used, then there ' +
                            'should be a "dir" option set and "out" should ' +
                            'not be used since "out" is only for single file ' +
                            'optimization output.');
        } else if (config.modules && config.name) {
            throw new Error('"name" and "modules" options are incompatible. ' +
                            'Either use "name" if doing a single file ' +
                            'optimization, or "modules" if you want to target ' +
                            'more than one file for optimization.');
        }

        if (config.out && !config.cssIn) {
            //Just one file to optimize.

            //Does not have a build file, so set up some defaults.
            //Optimizing CSS should not be allowed, unless explicitly
            //asked for on command line. In that case the only task is
            //to optimize a CSS file.
            if (!cfg.optimizeCss) {
                config.optimizeCss = "none";
            }
        }

        //Normalize cssPrefix
        if (config.cssPrefix) {
            //Make sure cssPrefix ends in a slash
            config.cssPrefix = endsWithSlash(config.cssPrefix);
        } else {
            config.cssPrefix = '';
        }

        //Cycle through modules and normalize
        if (config.modules && config.modules.length) {
            config.modules.forEach(function (mod) {
                if (lang.isArray(mod) || typeof mod === 'string' || !mod) {
                    throw new Error('modules config item is malformed: it should' +
                                    ' be an object with a \'name\' property.');
                }

                //Combine any local stubModules with global values.
                if (config.stubModules) {
                    mod.stubModules = config.stubModules.concat(mod.stubModules || []);
                }

                //Create a hash lookup for the stubModules config to make lookup
                //cheaper later.
                if (mod.stubModules) {
                    mod.stubModules._byName = {};
                    mod.stubModules.forEach(function (id) {
                        mod.stubModules._byName[id] = true;
                    });
                }

                // Legacy command support, which allowed a single string ID
                // for include.
                if (typeof mod.include === 'string') {
                    mod.include = [mod.include];
                }

                //Allow wrap config in overrides, but normalize it.
                if (mod.override) {
                    normalizeWrapConfig(mod.override, absFilePath);
                }
            });
        }

        normalizeWrapConfig(config, absFilePath);

        //Do final input verification
        if (config.context) {
            throw new Error('The build argument "context" is not supported' +
                            ' in a build. It should only be used in web' +
                            ' pages.');
        }

        //Set up normalizeDirDefines. If not explicitly set, if optimize "none",
        //set to "skip" otherwise set to "all".
        if (!hasProp(config, 'normalizeDirDefines')) {
            if (config.optimize === 'none' || config.skipDirOptimize) {
                config.normalizeDirDefines = 'skip';
            } else {
                config.normalizeDirDefines = 'all';
            }
        }

        //Set file.fileExclusionRegExp if desired
        if (hasProp(config, 'fileExclusionRegExp')) {
            if (typeof config.fileExclusionRegExp === "string") {
                file.exclusionRegExp = new RegExp(config.fileExclusionRegExp);
            } else {
                file.exclusionRegExp = config.fileExclusionRegExp;
            }
        } else if (hasProp(config, 'dirExclusionRegExp')) {
            //Set file.dirExclusionRegExp if desired, this is the old
            //name for fileExclusionRegExp before 1.0.2. Support for backwards
            //compatibility
            file.exclusionRegExp = config.dirExclusionRegExp;
        }

        //Track the deps, but in a different key, so that they are not loaded
        //as part of config seeding before all config is in play (#648). Was
        //going to merge this in with "include", but include is added after
        //the "name" target. To preserve what r.js has done previously, make
        //sure "deps" comes before the "name".
        if (config.deps) {
            config._depsInclude = config.deps;
        }


        //Remove things that may cause problems in the build.
        //deps already merged above
        delete config.deps;
        delete config.jQuery;
        delete config.enforceDefine;
        delete config.urlArgs;

        return config;
    };

    /**
     * finds the module being built/optimized with the given moduleName,
     * or returns null.
     * @param {String} moduleName
     * @param {Array} modules
     * @returns {Object} the module object from the build profile, or null.
     */
    build.findBuildModule = function (moduleName, modules) {
        var i, module;
        for (i = 0; i < modules.length; i++) {
            module = modules[i];
            if (module.name === moduleName) {
                return module;
            }
        }
        return null;
    };

    /**
     * Removes a module name and path from a layer, if it is supposed to be
     * excluded from the layer.
     * @param {String} moduleName the name of the module
     * @param {String} path the file path for the module
     * @param {Object} layer the layer to remove the module/path from
     */
    build.removeModulePath = function (module, path, layer) {
        var index = layer.buildFilePaths.indexOf(path);
        if (index !== -1) {
            layer.buildFilePaths.splice(index, 1);
        }
    };

    /**
     * Uses the module build config object to trace the dependencies for the
     * given module.
     *
     * @param {Object} module the module object from the build config info.
     * @param {Object} config the build config object.
     * @param {Object} [baseLoaderConfig] the base loader config to use for env resets.
     *
     * @returns {Object} layer information about what paths and modules should
     * be in the flattened module.
     */
    build.traceDependencies = function (module, config, baseLoaderConfig) {
        var include, override, layer, context, oldContext,
            rawTextByIds,
            syncChecks = {
                rhino: true,
                node: true,
                xpconnect: true
            },
            deferred = prim();

        //Reset some state set up in requirePatch.js, and clean up require's
        //current context.
        oldContext = require._buildReset();

        //Grab the reset layer and context after the reset, but keep the
        //old config to reuse in the new context.
        layer = require._layer;
        context = layer.context;

        //Put back basic config, use a fresh object for it.
        if (baseLoaderConfig) {
            require(copyConfig(baseLoaderConfig));
        }

        logger.trace("\nTracing dependencies for: " + (module.name ||
                     (typeof module.out === 'function' ? 'FUNCTION' : module.out)));
        include = config._depsInclude ||  [];
        include = include.concat(module.name && !module.create ? [module.name] : []);
        if (module.include) {
            include = include.concat(module.include);
        }

        //If there are overrides to basic config, set that up now.;
        if (module.override) {
            if (baseLoaderConfig) {
                override = build.createOverrideConfig(baseLoaderConfig, module.override);
            } else {
                override = copyConfig(module.override);
            }
            require(override);
        }

        //Now, populate the rawText cache with any values explicitly passed in
        //via config.
        rawTextByIds = require.s.contexts._.config.rawText;
        if (rawTextByIds) {
            lang.eachProp(rawTextByIds, function (contents, id) {
                var url = require.toUrl(id) + '.js';
                require._cachedRawText[url] = contents;
            });
        }


        //Configure the callbacks to be called.
        deferred.reject.__requireJsBuild = true;

        //Use a wrapping function so can check for errors.
        function includeFinished(value) {
            //If a sync build environment, check for errors here, instead of
            //in the then callback below, since some errors, like two IDs pointed
            //to same URL but only one anon ID will leave the loader in an
            //unresolved state since a setTimeout cannot be used to check for
            //timeout.
            var hasError = false;
            if (syncChecks[env.get()]) {
                try {
                    build.checkForErrors(context, layer);
                } catch (e) {
                    hasError = true;
                    deferred.reject(e);
                }
            }

            if (!hasError) {
                deferred.resolve(value);
            }
        }
        includeFinished.__requireJsBuild = true;

        //Figure out module layer dependencies by calling require to do the work.
        require(include, includeFinished, deferred.reject);

        // If a sync env, then with the "two IDs to same anon module path"
        // issue, the require never completes, need to check for errors
        // here.
        if (syncChecks[env.get()]) {
            build.checkForErrors(context, layer);
        }

        return deferred.promise.then(function () {
            //Reset config
            if (module.override && baseLoaderConfig) {
                require(copyConfig(baseLoaderConfig));
            }

            build.checkForErrors(context, layer);

            return layer;
        });
    };

    build.checkForErrors = function (context, layer) {
        //Check to see if it all loaded. If not, then throw, and give
        //a message on what is left.
        var id, prop, mod, idParts, pluginId, pluginResources,
            errMessage = '',
            failedPluginMap = {},
            failedPluginIds = [],
            errIds = [],
            errUrlMap = {},
            errUrlConflicts = {},
            hasErrUrl = false,
            hasUndefined = false,
            defined = context.defined,
            registry = context.registry;

        function populateErrUrlMap(id, errUrl, skipNew) {
            // Loader plugins do not have an errUrl, so skip them.
            if (!errUrl) {
                return;
            }

            if (!skipNew) {
                errIds.push(id);
            }

            if (errUrlMap[errUrl]) {
                hasErrUrl = true;
                //This error module has the same URL as another
                //error module, could be misconfiguration.
                if (!errUrlConflicts[errUrl]) {
                    errUrlConflicts[errUrl] = [];
                    //Store the original module that had the same URL.
                    errUrlConflicts[errUrl].push(errUrlMap[errUrl]);
                }
                errUrlConflicts[errUrl].push(id);
            } else if (!skipNew) {
                errUrlMap[errUrl] = id;
            }
        }

        for (id in registry) {
            if (hasProp(registry, id) && id.indexOf('_@r') !== 0) {
                hasUndefined = true;
                mod = getOwn(registry, id);
                idParts = id.split('!');
                pluginId = idParts[0];

                if (id.indexOf('_unnormalized') === -1 && mod && mod.enabled) {
                    populateErrUrlMap(id, mod.map.url);
                }

                //Look for plugins that did not call load()
                //But skip plugin IDs that were already inlined and called
                //define() with a name.
                if (!hasProp(layer.modulesWithNames, id) && idParts.length > 1) {
                    if (falseProp(failedPluginMap, pluginId)) {
                        failedPluginIds.push(pluginId);
                    }
                    pluginResources = failedPluginMap[pluginId];
                    if (!pluginResources) {
                        pluginResources = failedPluginMap[pluginId] = [];
                    }
                    pluginResources.push(id + (mod.error ? ': ' + mod.error : ''));
                }
            }
        }

        // If have some modules that are not defined/stuck in the registry,
        // then check defined modules for URL overlap.
        if (hasUndefined) {
            for (id in defined) {
                if (hasProp(defined, id) && id.indexOf('!') === -1) {
                    populateErrUrlMap(id, require.toUrl(id) + '.js', true);
                }
            }
        }

        if (errIds.length || failedPluginIds.length) {
            if (failedPluginIds.length) {
                errMessage += 'Loader plugin' +
                    (failedPluginIds.length === 1 ? '' : 's') +
                    ' did not call ' +
                    'the load callback in the build:\n' +
                    failedPluginIds.map(function (pluginId) {
                        var pluginResources = failedPluginMap[pluginId];
                        return pluginId + ':\n  ' + pluginResources.join('\n  ');
                    }).join('\n') + '\n';
            }
            errMessage += 'Module loading did not complete for: ' + errIds.join(', ');

            if (hasErrUrl) {
                errMessage += '\nThe following modules share the same URL. This ' +
                              'could be a misconfiguration if that URL only has ' +
                              'one anonymous module in it:';
                for (prop in errUrlConflicts) {
                    if (hasProp(errUrlConflicts, prop)) {
                        errMessage += '\n' + prop + ': ' +
                                      errUrlConflicts[prop].join(', ');
                    }
                }
            }
            throw new Error(errMessage);
        }
    };

    build.createOverrideConfig = function (config, override) {
        var cfg = copyConfig(config),
            oride = copyConfig(override);

        lang.eachProp(oride, function (value, prop) {
            if (hasProp(build.objProps, prop)) {
                //An object property, merge keys. Start a new object
                //so that source object in config does not get modified.
                cfg[prop] = {};
                lang.mixin(cfg[prop], config[prop], true);
                lang.mixin(cfg[prop], override[prop], true);
            } else {
                cfg[prop] = override[prop];
            }
        });

        return cfg;
    };

    /**
     * Uses the module build config object to create an flattened version
     * of the module, with deep dependencies included.
     *
     * @param {Object} module the module object from the build config info.
     *
     * @param {Object} layer the layer object returned from build.traceDependencies.
     *
     * @param {Object} the build config object.
     *
     * @returns {Object} with two properties: "text", the text of the flattened
     * module, and "buildText", a string of text representing which files were
     * included in the flattened module text.
     */
    build.flattenModule = function (module, layer, config) {
        var fileContents, sourceMapGenerator,
            sourceMapBase,
            buildFileContents = '';

        return prim().start(function () {
            var reqIndex, currContents, fileForSourceMap,
                moduleName, shim, packageName,
                parts, builder, writeApi,
                namespace, namespaceWithDot, stubModulesByName,
                context = layer.context,
                onLayerEnds = [],
                onLayerEndAdded = {},
                pkgsMainMap = {};

            //Use override settings, particularly for pragmas
            //Do this before the var readings since it reads config values.
            if (module.override) {
                config = build.createOverrideConfig(config, module.override);
            }

            namespace = config.namespace || '';
            namespaceWithDot = namespace ? namespace + '.' : '';
            stubModulesByName = (module.stubModules && module.stubModules._byName) || {};

            //Start build output for the module.
            module.onCompleteData = {
                name: module.name,
                path: (config.dir ? module._buildPath.replace(config.dir, "") : module._buildPath),
                included: []
            };

            buildFileContents += "\n" +
                                  module.onCompleteData.path +
                                 "\n----------------\n";

            //If there was an existing file with require in it, hoist to the top.
            if (layer.existingRequireUrl) {
                reqIndex = layer.buildFilePaths.indexOf(layer.existingRequireUrl);
                if (reqIndex !== -1) {
                    layer.buildFilePaths.splice(reqIndex, 1);
                    layer.buildFilePaths.unshift(layer.existingRequireUrl);
                }
            }

            if (config.generateSourceMaps) {
                sourceMapBase = config.dir || config.baseUrl;
                if (module._buildPath === 'FUNCTION') {
                    fileForSourceMap = (module.name || module.include[0] || 'FUNCTION') + '.build.js';
                } else if (config.out) {
                    fileForSourceMap = module._buildPath.split('/').pop();
                } else {
                    fileForSourceMap = module._buildPath.replace(sourceMapBase, '');
                }
                sourceMapGenerator = new SourceMapGenerator({
                    file: fileForSourceMap
                });
            }

            //Create a reverse lookup for packages main module IDs to their package
            //names, useful for knowing when to write out define() package main ID
            //adapters.
            lang.eachProp(layer.context.config.pkgs, function(value, prop) {
                pkgsMainMap[value] = prop;
            });

            //Write the built module to disk, and build up the build output.
            fileContents = "";
            if (config.wrap && config.wrap.__startMap) {
                config.wrap.__startMap.forEach(function (wrapFunction) {
                    fileContents = wrapFunction(fileContents, config, sourceMapGenerator);
                });
            }

            return prim.serial(layer.buildFilePaths.map(function (path) {
                return function () {
                    var singleContents = '';

                    moduleName = layer.buildFileToModule[path];

                    //If the moduleName is a package main, then hold on to the
                    //packageName in case an adapter needs to be written.
                    packageName = getOwn(pkgsMainMap, moduleName);

                    return prim().start(function () {
                        //Figure out if the module is a result of a build plugin, and if so,
                        //then delegate to that plugin.
                        parts = context.makeModuleMap(moduleName);
                        builder = parts.prefix && getOwn(context.defined, parts.prefix);
                        if (builder) {
                            if (builder.onLayerEnd && falseProp(onLayerEndAdded, parts.prefix)) {
                                onLayerEnds.push(builder);
                                onLayerEndAdded[parts.prefix] = true;
                            }

                            if (builder.write) {
                                writeApi = function (input) {
                                    singleContents += "\n" + addSemiColon(input, config);
                                    if (config.onBuildWrite) {
                                        singleContents = config.onBuildWrite(moduleName, path, singleContents);
                                    }
                                };
                                writeApi.asModule = function (moduleName, input) {
                                    singleContents += "\n" +
                                        addSemiColon(build.toTransport(namespace, moduleName, path, input, layer, {
                                            useSourceUrl: layer.context.config.useSourceUrl
                                        }), config);
                                    if (config.onBuildWrite) {
                                        singleContents = config.onBuildWrite(moduleName, path, singleContents);
                                    }
                                };
                                builder.write(parts.prefix, parts.name, writeApi);
                            }
                            return;
                        } else {
                            return prim().start(function () {
                                if (hasProp(stubModulesByName, moduleName)) {
                                    //Just want to insert a simple module definition instead
                                    //of the source module. Useful for plugins that inline
                                    //all their resources.
                                    if (hasProp(layer.context.plugins, moduleName)) {
                                        //Slightly different content for plugins, to indicate
                                        //that dynamic loading will not work.
                                        return 'define({load: function(id){throw new Error("Dynamic load not allowed: " + id);}});';
                                    } else {
                                        return 'define({});';
                                    }
                                } else {
                                    return require._cacheReadAsync(path);
                                }
                            }).then(function (text) {
                                var hasPackageName;

                                currContents = text;

                                if (config.cjsTranslate &&
                                    (!config.shim || !lang.hasProp(config.shim, moduleName))) {
                                    currContents = commonJs.convert(path, currContents);
                                }

                                if (config.onBuildRead) {
                                    currContents = config.onBuildRead(moduleName, path, currContents);
                                }

                                if (packageName) {
                                    hasPackageName = (packageName === parse.getNamedDefine(currContents));
                                }

                                if (namespace) {
                                    currContents = pragma.namespace(currContents, namespace);
                                }

                                currContents = build.toTransport(namespace, moduleName, path, currContents, layer, {
                                    useSourceUrl: config.useSourceUrl
                                });

                                if (packageName && !hasPackageName) {
                                    currContents = addSemiColon(currContents, config) + '\n';
                                    currContents += namespaceWithDot + "define('" +
                                                    packageName + "', ['" + moduleName +
                                                    "'], function (main) { return main; });\n";
                                }

                                if (config.onBuildWrite) {
                                    currContents = config.onBuildWrite(moduleName, path, currContents);
                                }

                                //Semicolon is for files that are not well formed when
                                //concatenated with other content.
                                singleContents += addSemiColon(currContents, config);
                            });
                        }
                    }).then(function () {
                        var shimDeps, shortPath = path.replace(config.dir, "");

                        module.onCompleteData.included.push(shortPath);
                        buildFileContents += shortPath + "\n";

                        //Some files may not have declared a require module, and if so,
                        //put in a placeholder call so the require does not try to load them
                        //after the module is processed.
                        //If we have a name, but no defined module, then add in the placeholder.
                        if (moduleName && falseProp(layer.modulesWithNames, moduleName) && !config.skipModuleInsertion) {
                            shim = config.shim && (getOwn(config.shim, moduleName) || (packageName && getOwn(config.shim, packageName)));
                            if (shim) {
                                shimDeps = lang.isArray(shim) ? shim : shim.deps;
                                if (config.wrapShim) {

                                    singleContents = '(function(root) {\n' +
                                                     namespaceWithDot + 'define("' + moduleName + '", ' +
                                                     (shimDeps && shimDeps.length ?
                                                            build.makeJsArrayString(shimDeps) + ', ' : '[], ') +
                                                    'function() {\n' +
                                                    '  return (function() {\n' +
                                                             singleContents +
                                                             // Start with a \n in case last line is a comment
                                                             // in the singleContents, like a sourceURL comment.
                                                             '\n' + (shim.exportsFn ? shim.exportsFn() : '') +
                                                             '\n' +
                                                    '  }).apply(root, arguments);\n' +
                                                    '});\n' +
                                                    '}(this));\n';
                                } else {
                                    singleContents += '\n' + namespaceWithDot + 'define("' + moduleName + '", ' +
                                                     (shimDeps && shimDeps.length ?
                                                            build.makeJsArrayString(shimDeps) + ', ' : '') +
                                                     (shim.exportsFn ? shim.exportsFn() : 'function(){}') +
                                                     ');\n';
                                }
                            } else {
                                singleContents += '\n' + namespaceWithDot + 'define("' + moduleName + '", function(){});\n';
                            }
                        }

                        //Add line break at end of file, instead of at beginning,
                        //so source map line numbers stay correct, but still allow
                        //for some space separation between files in case ASI issues
                        //for concatenation would cause an error otherwise.
                        singleContents += '\n';

                        //Add to the source map and to the final contents
                        fileContents = appendToFileContents(fileContents, singleContents, path, config, module,
                                                            sourceMapGenerator);
                    });
                };
            })).then(function () {
                if (onLayerEnds.length) {
                    onLayerEnds.forEach(function (builder, index) {
                        var path;
                        if (typeof module.out === 'string') {
                            path = module.out;
                        } else if (typeof module._buildPath === 'string') {
                            path = module._buildPath;
                        }
                        builder.onLayerEnd(function (input) {
                            fileContents =
                                appendToFileContents(fileContents, "\n" + addSemiColon(input, config),
                                                     'onLayerEnd' + index + '.js', config, module, sourceMapGenerator);
                        }, {
                            name: module.name,
                            path: path
                        });
                    });
                }

                if (module.create) {
                    //The ID is for a created layer. Write out
                    //a module definition for it in case the
                    //built file is used with enforceDefine
                    //(#432)
                    fileContents =
                        appendToFileContents(fileContents, '\n' + namespaceWithDot + 'define("' + module.name +
                                                           '", function(){});\n', 'module-create.js', config, module,
                                             sourceMapGenerator);
                }

                //Add a require at the end to kick start module execution, if that
                //was desired. Usually this is only specified when using small shim
                //loaders like almond.
                if (module.insertRequire) {
                    fileContents =
                        appendToFileContents(fileContents, '\n' + namespaceWithDot + 'require(["' + module.insertRequire.join('", "') +
                                                           '"]);\n', 'module-insertRequire.js', config, module,
                                             sourceMapGenerator);
                }
            });
        }).then(function () {
            if (config.wrap && config.wrap.__endMap) {
                config.wrap.__endMap.forEach(function (wrapFunction) {
                    fileContents = wrapFunction(fileContents, config, sourceMapGenerator);
                });
            }
            return {
                text: fileContents,
                buildText: buildFileContents,
                sourceMap: sourceMapGenerator ?
                              JSON.stringify(sourceMapGenerator.toJSON(), null, '  ') :
                              undefined
            };
        });
    };

    //Converts an JS array of strings to a string representation.
    //Not using JSON.stringify() for Rhino's sake.
    build.makeJsArrayString = function (ary) {
        return '["' + ary.map(function (item) {
            //Escape any double quotes, backslashes
            return lang.jsEscape(item);
        }).join('","') + '"]';
    };

    build.toTransport = function (namespace, moduleName, path, contents, layer, options) {
        var baseUrl = layer && layer.context.config.baseUrl;

        function onFound(info) {
            //Only mark this module as having a name if not a named module,
            //or if a named module and the name matches expectations.
            if (layer && (info.needsId || info.foundId === moduleName)) {
                layer.modulesWithNames[moduleName] = true;
            }
        }

        //Convert path to be a local one to the baseUrl, useful for
        //useSourceUrl.
        if (baseUrl) {
            path = path.replace(baseUrl, '');
        }

        return transform.toTransport(namespace, moduleName, path, contents, onFound, options);
    };

    return build;
});
