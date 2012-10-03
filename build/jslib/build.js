/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint plusplus: true, nomen: true, regexp: true  */
/*global define, require */


define([ 'lang', 'logger', 'env!env/file', 'parse', 'optimize', 'pragma',
         'transform', 'env!env/load', 'requirePatch', 'env!env/quit',
         'commonJs'], function (lang, logger, file,  parse, optimize, pragma,
          transform,   load,           requirePatch,   quit,
          commonJs) {
    'use strict';

    var build, buildBaseConfig,
        endsWithSemiColonRegExp = /;\s*$/;

    buildBaseConfig = {
        appDir: "",
        pragmas: {},
        paths: {},
        optimize: "uglify",
        optimizeCss: "standard.keepLines",
        inlineText: true,
        isBuild: true,
        optimizeAllPluginResources: false,
        findNestedDependencies: false,
        preserveLicenseComments: true,
        //By default, all files/directories are copied, unless
        //they match this regexp, by default just excludes .folders
        dirExclusionRegExp: file.dirExclusionRegExp,
        _buildPathToModuleIndex: {}
    };

    /**
     * Some JS may not be valid if concatenated with other JS, in particular
     * the style of omitting semicolons and rely on ASI. Add a semicolon in
     * those cases.
     */
    function addSemiColon(text) {
        if (endsWithSemiColonRegExp.test(text)) {
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

        try {
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
        } catch (e) {
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

            if (logger.level > logger.ERROR) {
                throw new Error(errorMsg);
            } else {
                logger.error(errorMsg);
                quit(1);
            }
        }
    };

    build._run = function (cmdConfig) {
        var buildPaths, fileName, fileNames,
            prop, paths, i,
            baseConfig, config,
            modules, builtModule, srcPath, buildContext,
            destPath, moduleName, moduleMap, parentModuleMap, context,
            resources, resource, plugin, fileContents,
            pluginProcessed = {},
            buildFileContents = "",
            pluginCollector = {};

        //Can now run the patches to require.js to allow it to be used for
        //build generation. Do it here instead of at the top of the module
        //because we want normal require behavior to load the build tool
        //then want to switch to build mode.
        requirePatch();

        config = build.createConfig(cmdConfig);
        paths = config.paths;

        if (config.logLevel) {
            logger.logLevel(config.logLevel);
        }

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
                    if (paths.hasOwnProperty(prop)) {
                        buildPaths[prop] = paths[prop].replace(config.appDir, config.dir);
                    }
                }
            } else {
                //If no appDir, then make sure to copy the other paths to this directory.
                for (prop in paths) {
                    if (paths.hasOwnProperty(prop)) {
                        //Set up build path for each path prefix, but only do so
                        //if the path falls out of the current baseUrl
                        if (paths[prop].indexOf(config.baseUrl) === 0) {
                            buildPaths[prop] = paths[prop].replace(config.baseUrl, config.dirBaseUrl);
                        } else {
                            buildPaths[prop] = paths[prop] === 'empty:' ? 'empty:' : prop.replace(/\./g, "/");

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
                    //it is not a plugin-loaded resource, then throw an error.
                    if (!file.exists(module._sourcePath) && !module.create &&
                            module.name.indexOf('!') === -1) {
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
                        if (!module.create) {
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

        if (modules) {
            modules.forEach(function (module, i) {
                //Save off buildPath to module index in a hash for quicker
                //lookup later.
                config._buildPathToModuleIndex[module._buildPath] = i;

                //Call require to calculate dependencies.
                module.layer = build.traceDependencies(module, config);
            });

            //Now build up shadow layers for anything that should be excluded.
            //Do this after tracing dependencies for each module, in case one
            //of those modules end up being one of the excluded values.
            modules.forEach(function (module) {
                if (module.exclude) {
                    module.excludeLayers = [];
                    module.exclude.forEach(function (exclude, i) {
                        //See if it is already in the list of modules.
                        //If not trace dependencies for it.
                        module.excludeLayers[i] = build.findBuildModule(exclude, modules) ||
                                                 {layer: build.traceDependencies({name: exclude}, config)};
                    });
                }
            });

            modules.forEach(function (module) {
                if (module.exclude) {
                    //module.exclude is an array of module names. For each one,
                    //get the nested dependencies for it via a matching entry
                    //in the module.excludeLayers array.
                    module.exclude.forEach(function (excludeModule, i) {
                        var excludeLayer = module.excludeLayers[i].layer, map = excludeLayer.buildPathMap, prop;
                        for (prop in map) {
                            if (map.hasOwnProperty(prop)) {
                                build.removeModulePath(prop, map[prop], module.layer);
                            }
                        }
                    });
                }
                if (module.excludeShallow) {
                    //module.excludeShallow is an array of module names.
                    //shallow exclusions are just that module itself, and not
                    //its nested dependencies.
                    module.excludeShallow.forEach(function (excludeShallowModule) {
                        var path = module.layer.buildPathMap[excludeShallowModule];
                        if (path) {
                            build.removeModulePath(excludeShallowModule, path, module.layer);
                        }
                    });
                }

                //Flatten them and collect the build output for each module.
                builtModule = build.flattenModule(module, module.layer, config);

                //Save it to a temp file for now, in case there are other layers that
                //contain optimized content that should not be included in later
                //layer optimizations. See issue #56.
                if (module._buildPath === 'FUNCTION') {
                    module._buildText = builtModule.text;
                } else {
                    file.saveUtf8File(module._buildPath + '-temp', builtModule.text);
                }
                buildFileContents += builtModule.buildText;
            });

            //Now move the build layers to their final position.
            modules.forEach(function (module) {
                var finalPath = module._buildPath;
                if (finalPath !== 'FUNCTION') {
                    if (file.exists(finalPath)) {
                        file.deleteFile(finalPath);
                    }
                    file.renameFile(finalPath + '-temp', finalPath);

                    //And finally, if removeCombined is specified, remove
                    //any of the files that were used in this layer.
                    //Be sure not to remove other build layers.
                    if (config.removeCombined) {
                        module.layer.buildFilePaths.forEach(function (path) {
                            if (file.exists(path) && !modules.some(function (mod) {
                                    return mod._buildPath === path;
                                })) {
                                file.deleteFile(path);
                            }
                        });
                    }
                }
            });
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
                config.modules[0]._buildText = optimize.js(fileName,
                                                           config.modules[0]._buildText,
                                                           config);
            } else {
                optimize.jsFile(fileName, null, fileName, config);
            }
        } else if (!config.cssIn) {
            //Normal optimizations across modules.

            //JS optimizations.
            fileNames = file.getFilteredFileList(config.dir, /\.js$/, true);
            fileNames.forEach(function (fileName, i) {
                var cfg, moduleIndex, override;

                //Generate the module name from the config.dir root.
                moduleName = fileName.replace(config.dir, '');
                //Get rid of the extension
                moduleName = moduleName.substring(0, moduleName.length - 3);

                //Convert the file to transport format, but without a name
                //inserted (by passing null for moduleName) since the files are
                //standalone, one module per file.
                fileContents = file.readFile(fileName);

                //For builds, if wanting cjs translation, do it now, so that
                //the individual modules can be loaded cross domain via
                //plain script tags.
                if (config.cjsTranslate) {
                    fileContents = commonJs.convert(fileName, fileContents);
                }

                fileContents = build.toTransport(config.namespace,
                                                 null,
                                                 fileName,
                                                 fileContents);

                //If there is an override for a specific layer build module,
                //and this file is that module, mix in the override for use
                //by optimize.jsFile.
                moduleIndex = config._buildPathToModuleIndex[fileName];
                override = moduleIndex === 0 || moduleIndex > 0 ?
                           config.modules[moduleIndex].override : null;
                if (override) {
                    cfg = {};
                    lang.mixin(cfg, config, override, true);
                } else {
                    cfg = config;
                }

                optimize.jsFile(fileName, fileContents, fileName, cfg, pluginCollector);
            });

            //Normalize all the plugin resources.
            context = require.s.contexts._;

            for (moduleName in pluginCollector) {
                if (pluginCollector.hasOwnProperty(moduleName)) {
                    parentModuleMap = context.makeModuleMap(moduleName);
                    resources = pluginCollector[moduleName];
                    for (i = 0; i < resources.length; i++) {
                        resource = resources[i];
                        moduleMap = context.makeModuleMap(resource, parentModuleMap);
                        if (!context.plugins[moduleMap.prefix]) {
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
                        if (!pluginProcessed[moduleMap.id]) {
                            //Only do the work if the plugin was really loaded.
                            //Using an internal access because the file may
                            //not really be loaded.
                            plugin = context.defined[moduleMap.prefix];
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
            file.saveUtf8File(config.dir + "build.txt", buildFileContents);
        }

        //If just have one CSS file to optimize, do that here.
        if (config.cssIn) {
            buildFileContents += optimize.cssFile(config.cssIn, config.out, config);
        }

        if (typeof config.out === 'function') {
            config.out(config.modules[0]._buildText);
        }

        //Print out what was built into which layers.
        if (buildFileContents) {
            logger.info(buildFileContents);
            return buildFileContents;
        }

        return '';
    };

    /**
     * Converts command line args like "paths.foo=../some/path"
     * result.paths = { foo: '../some/path' } where prop = paths,
     * name = paths.foo and value = ../some/path, so it assumes the
     * name=value splitting has already happened.
     */
    function stringDotToObj(result, name, value) {
        var parts = name.split('.'),
            prop = parts[0];

        parts.forEach(function (prop, i) {
            if (i === parts.length - 1) {
                result[prop] = value;
            } else {
                if (!result[prop]) {
                    result[prop] = {};
                }
                result = result[prop];
            }

        });
    }

    //Used by convertArrayToObject to convert some things from prop.name=value
    //to a prop: { name: value}
    build.dotProps = [
        'paths.',
        'wrap.',
        'pragmas.',
        'pragmasOnSave.',
        'has.',
        'hasOnSave.',
        'wrap.',
        'uglify.',
        'closure.',
        'map.'
    ];

    build.hasDotPropMatch = function (prop) {
        return build.dotProps.some(function (dotProp) {
            return prop.indexOf(dotProp) === 0;
        });
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
                "insertRequire": true
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
            if (needArray[prop]) {
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
                if (obj.hasOwnProperty(prop) && typeof obj[prop] === 'string') {
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

            if (config[prop]) {
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

        build.makeAbsObject(["out", "cssIn"], config, absFilePath);
        build.makeAbsObject(["startFile", "endFile"], config.wrap, absFilePath);
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
    function mixConfig(target, source) {
        var prop, value;

        for (prop in source) {
            if (source.hasOwnProperty(prop)) {
                //If the value of the property is a plain object, then
                //allow a one-level-deep mixing of it.
                value = source[prop];
                if (typeof value === 'object' && value &&
                        !lang.isArray(value) && !lang.isFunction(value) &&
                        !lang.isRegExp(value)) {
                    target[prop] = lang.mixin({}, target[prop], value, true);
                } else {
                    target[prop] = value;
                }
            }
        }
    }

    /**
     * Converts a wrap.startFile or endFile to be start/end as a string.
     * the startFile/endFile values can be arrays.
     */
    function flattenWrapFile(wrap, keyName, absFilePath) {
        var keyFileName = keyName + 'File';

        if (typeof wrap[keyName] !== 'string' && wrap[keyFileName]) {
            wrap[keyName] = '';
            if (typeof wrap[keyFileName] === 'string') {
                wrap[keyFileName] = [wrap[keyFileName]];
            }
            wrap[keyFileName].forEach(function (fileName) {
                wrap[keyName] += (wrap[keyName] ? '\n' : '') +
                    file.readFile(build.makeAbsPath(fileName, absFilePath));
            });
        } else if (typeof wrap[keyName] !== 'string') {
            throw new Error('wrap.' + keyName + ' or wrap.' + keyFileName + ' malformed');
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
        var config = {}, buildFileContents, buildFileConfig, mainConfig,
            mainConfigFile, mainConfigPath, prop, buildFile, absFilePath;

        //Make sure all paths are relative to current directory.
        absFilePath = file.absPath('.');
        build.makeAbsConfig(cfg, absFilePath);
        build.makeAbsConfig(buildBaseConfig, absFilePath);

        lang.mixin(config, buildBaseConfig);
        lang.mixin(config, cfg, true);

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
            mainConfigFile = build.makeAbsPath(mainConfigFile, absFilePath);
            if (!file.exists(mainConfigFile)) {
                throw new Error(mainConfigFile + ' does not exist.');
            }
            try {
                mainConfig = parse.findConfig(mainConfigFile, file.readFile(mainConfigFile));
            } catch (configError) {
                throw new Error('The config in mainConfigFile ' +
                        mainConfigFile +
                        ' cannot be used because it cannot be evaluated' +
                        ' correctly while running in the optimizer. Try only' +
                        ' using a config that is also valid JSON, or do not use' +
                        ' mainConfigFile and instead copy the config values needed' +
                        ' into a build file or command line arguments given to the optimizer.');
            }
            if (mainConfig) {
                mainConfigPath = mainConfigFile.substring(0, mainConfigFile.lastIndexOf('/'));

                //Add in some existing config, like appDir, since they can be
                //used inside the mainConfigFile -- paths and baseUrl are
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
        }

        //Mix in build file config, but only after mainConfig has been mixed in.
        if (buildFileConfig) {
            mixConfig(config, buildFileConfig);
        }

        //Re-apply the override config values. Command line
        //args should take precedence over build file values.
        mixConfig(config, cfg);

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
        if (config.hasOwnProperty("baseUrl")) {
            if (config.appDir) {
                config.dirBaseUrl = build.makeAbsPath(config.originalBaseUrl, config.dir);
            } else {
                config.dirBaseUrl = config.dir || config.baseUrl;
            }
            //Make sure dirBaseUrl ends in a slash, since it is
            //concatenated with other strings.
            config.dirBaseUrl = endsWithSlash(config.dirBaseUrl);
        }

        //Check for errors in config
        if (config.main) {
            throw new Error('"main" passed as an option, but the ' +
                            'supported option is called "name".');
        }
        if (!config.name && !config.modules && !config.include && !config.cssIn) {
            throw new Error('Missing either a "name", "include" or "modules" ' +
                            'option');
        }
        if (config.cssIn && !config.out) {
            throw new Error("ERROR: 'out' option missing.");
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
                            'where "out" is used to just optimize to one file.');
        }
        if (config.out && config.dir) {
            throw new Error('The "out" and "dir" options are incompatible.' +
                            ' Use "out" if you are targeting a single file for' +
                            ' for optimization, and "dir" if you want the appDir' +
                            ' or baseUrl directories optimized.');
        }

        if (config.insertRequire && !lang.isArray(config.insertRequire)) {
            throw new Error('insertRequire should be a list of module IDs' +
                            ' to insert in to a require([]) call.');
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
                    insertRequire: config.insertRequire
                }
            ];
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

        //Create a hash lookup for the stubModules config to make lookup
        //cheaper later.
        if (config.stubModules) {
            config.stubModules._byName = {};
            config.stubModules.forEach(function (id) {
                config.stubModules._byName[id] = true;
            });
        }

        //Get any wrap text.
        try {
            if (config.wrap) {
                if (config.wrap === true) {
                    //Use default values.
                    config.wrap = {
                        start: '(function () {',
                        end: '}());'
                    };
                } else {
                    flattenWrapFile(config.wrap, 'start', absFilePath);
                    flattenWrapFile(config.wrap, 'end', absFilePath);
                }
            }
        } catch (wrapError) {
            throw new Error('Malformed wrap config: need both start/end or ' +
                            'startFile/endFile: ' + wrapError.toString());
        }

        //Do final input verification
        if (config.context) {
            throw new Error('The build argument "context" is not supported' +
                            ' in a build. It should only be used in web' +
                            ' pages.');
        }

        //Set file.fileExclusionRegExp if desired
        if (config.hasOwnProperty('fileExclusionRegExp')) {
            if (typeof config.fileExclusionRegExp === "string") {
                file.exclusionRegExp = new RegExp(config.fileExclusionRegExp);
            } else {
                file.exclusionRegExp = config.fileExclusionRegExp;
            }
        } else if (config.hasOwnProperty('dirExclusionRegExp')) {
            //Set file.dirExclusionRegExp if desired, this is the old
            //name for fileExclusionRegExp before 1.0.2. Support for backwards
            //compatibility
            file.exclusionRegExp = config.dirExclusionRegExp;
        }

        //Remove things that may cause problems in the build.
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
     * @param {Object} the build config object.
     *
     * @returns {Object} layer information about what paths and modules should
     * be in the flattened module.
     */
    build.traceDependencies = function (module, config) {
        var include, override, layer, context, baseConfig, oldContext,
            registry, id, idParts, pluginId,
            errMessage = '',
            failedPluginMap = {},
            failedPluginIds = [],
            errIds = [],
            errUrlMap = {},
            errUrlConflicts = {},
            hasErrUrl = false,
            errUrl, prop;

        //Reset some state set up in requirePatch.js, and clean up require's
        //current context.
        oldContext = require._buildReset();

        //Grab the reset layer and context after the reset, but keep the
        //old config to reuse in the new context.
        baseConfig = oldContext.config;
        layer = require._layer;
        context = layer.context;

        //Put back basic config, use a fresh object for it.
        //WARNING: probably not robust for paths and packages/packagePaths,
        //since those property's objects can be modified. But for basic
        //config clone it works out.
        require(lang.mixin({}, baseConfig, true));

        logger.trace("\nTracing dependencies for: " + (module.name || module.out));
        include = module.name && !module.create ? [module.name] : [];
        if (module.include) {
            include = include.concat(module.include);
        }

        //If there are overrides to basic config, set that up now.;
        if (module.override) {
            override = lang.mixin({}, baseConfig, true);
            lang.mixin(override, module.override, true);
            require(override);
        }

        //Figure out module layer dependencies by calling require to do the work.
        require(include);

        //Reset config
        if (module.override) {
            require(baseConfig);
        }

        //Check to see if it all loaded. If not, then stop, and give
        //a message on what is left.
        registry = context.registry;
        for (id in registry) {
            if (registry.hasOwnProperty(id) && id.indexOf('_@r') !== 0) {
                if (id.indexOf('_unnormalized') === -1 && registry[id].enabled) {
                    errIds.push(id);
                    errUrl = registry[id].map.url;

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
                    } else {
                        errUrlMap[errUrl] = id;
                    }
                }

                //Look for plugins that did not call load()
                idParts = id.split('!');
                pluginId = idParts[0];
                if (idParts.length > 1 && !failedPluginMap.hasOwnProperty(pluginId)) {
                    failedPluginIds.push(pluginId);
                    failedPluginMap[pluginId] = true;
                }
            }
        }

        if (errIds.length || failedPluginIds.length) {
            if (failedPluginIds.length) {
                errMessage += 'Loader plugin' +
                    (failedPluginIds.length === 1 ? '' : 's') +
                    ' did not call ' +
                    'the load callback in the build: ' +
                    failedPluginIds.join(', ') + '\n';
            }
            errMessage += 'Module loading did not complete for: ' + errIds.join(', ');

            if (hasErrUrl) {
                errMessage += '\nThe following modules share the same URL. This ' +
                              'could be a misconfiguration if that URL only has ' +
                              'one anonymous module in it:';
                for (prop in errUrlConflicts) {
                    if (errUrlConflicts.hasOwnProperty(prop)) {
                        errMessage += '\n' + prop + ': ' +
                                      errUrlConflicts[prop].join(', ');
                    }
                }
            }
            throw new Error(errMessage);
        }

        return layer;
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

        //Use override settings, particularly for pragmas
        //Do this before the var readings since it reads config values.
        if (module.override) {
            config = lang.mixin({}, config, true);
            lang.mixin(config, module.override, true);
        }

        var path, reqIndex, fileContents, currContents,
            i, moduleName, shim, packageConfig,
            parts, builder, writeApi,
            context = layer.context,
            buildFileContents = "",
            namespace = config.namespace || '',
            namespaceWithDot = namespace ? namespace + '.' : '',
            stubModulesByName = (config.stubModules && config.stubModules._byName) || {},
            onLayerEnds = [],
            onLayerEndAdded = {};

        //Start build output for the module.
        buildFileContents += "\n" +
                             (config.dir ? module._buildPath.replace(config.dir, "") : module._buildPath) +
                             "\n----------------\n";

        //If there was an existing file with require in it, hoist to the top.
        if (layer.existingRequireUrl) {
            reqIndex = layer.buildFilePaths.indexOf(layer.existingRequireUrl);
            if (reqIndex !== -1) {
                layer.buildFilePaths.splice(reqIndex, 1);
                layer.buildFilePaths.unshift(layer.existingRequireUrl);
            }
        }

        //Write the built module to disk, and build up the build output.
        fileContents = "";
        for (i = 0; i < layer.buildFilePaths.length; i++) {
            path = layer.buildFilePaths[i];
            moduleName = layer.buildFileToModule[path];

            //If the moduleName is for a package main, then update it to the
            //real main value.
            packageConfig = layer.context.config.pkgs &&
                            layer.context.config.pkgs[moduleName];
            if (packageConfig) {
                moduleName += '/' + packageConfig.main;
            }

            //Figure out if the module is a result of a build plugin, and if so,
            //then delegate to that plugin.
            parts = context.makeModuleMap(moduleName);
            builder = parts.prefix && context.defined[parts.prefix];
            if (builder) {
                if (builder.onLayerEnd && !onLayerEndAdded[parts.prefix]) {
                    onLayerEnds.push(builder);
                    onLayerEndAdded[parts.prefix] = true;
                }

                if (builder.write) {
                    writeApi = function (input) {
                        fileContents += "\n" + addSemiColon(input);
                        if (config.onBuildWrite) {
                            fileContents = config.onBuildWrite(moduleName, path, fileContents);
                        }
                    };
                    writeApi.asModule = function (moduleName, input) {
                        fileContents += "\n" +
                            addSemiColon(build.toTransport(namespace, moduleName, path, input, layer, {
                                useSourceUrl: layer.context.config.useSourceUrl
                            }));
                        if (config.onBuildWrite) {
                            fileContents = config.onBuildWrite(moduleName, path, fileContents);
                        }
                    };
                    builder.write(parts.prefix, parts.name, writeApi);
                }
            } else {
                if (stubModulesByName.hasOwnProperty(moduleName)) {
                    //Just want to insert a simple module definition instead
                    //of the source module. Useful for plugins that inline
                    //all their resources.
                    if (layer.context.plugins.hasOwnProperty(moduleName)) {
                        //Slightly different content for plugins, to indicate
                        //that dynamic loading will not work.
                        currContents = 'define({load: function(id){throw new Error("Dynamic load not allowed: " + id);}});';
                    } else {
                        currContents = 'define({});';
                    }
                } else {
                    currContents = file.readFile(path);
                }

                if (config.cjsTranslate) {
                    currContents = commonJs.convert(path, currContents);
                }

                if (config.onBuildRead) {
                    currContents = config.onBuildRead(moduleName, path, currContents);
                }

                if (namespace) {
                    currContents = pragma.namespace(currContents, namespace);
                }

                currContents = build.toTransport(namespace, moduleName, path, currContents, layer, {
                    useSourceUrl: config.useSourceUrl
                });

                if (packageConfig) {
                    currContents = addSemiColon(currContents) + '\n';
                    currContents += namespaceWithDot + "define('" +
                                    packageConfig.name + "', ['" + moduleName +
                                    "'], function (main) { return main; });\n";
                }

                if (config.onBuildWrite) {
                    currContents = config.onBuildWrite(moduleName, path, currContents);
                }

                //Semicolon is for files that are not well formed when
                //concatenated with other content.
                fileContents += "\n" + addSemiColon(currContents);
            }

            buildFileContents += path.replace(config.dir, "") + "\n";
            //Some files may not have declared a require module, and if so,
            //put in a placeholder call so the require does not try to load them
            //after the module is processed.
            //If we have a name, but no defined module, then add in the placeholder.
            if (moduleName && !layer.modulesWithNames[moduleName] && !config.skipModuleInsertion) {
                shim = config.shim && config.shim[moduleName];
                if (shim) {
                    fileContents += '\n' + namespaceWithDot + 'define("' + moduleName + '", ' +
                                     (shim.deps && shim.deps.length ?
                                            build.makeJsArrayString(shim.deps) + ', ' : '') +
                                     (shim.exportsFn ? shim.exportsFn() : 'function(){}') +
                                     ');\n';
                } else {
                    fileContents += '\n' + namespaceWithDot + 'define("' + moduleName + '", function(){});\n';
                }
            }
        }

        if (onLayerEnds.length) {
            onLayerEnds.forEach(function (builder) {
                var path;
                if (typeof module.out === 'string') {
                    path = module.out;
                } else if (typeof module._buildPath === 'string') {
                    path = module._buildPath;
                }
                builder.onLayerEnd(function (input) {
                    fileContents += "\n" + addSemiColon(input);
                }, {
                    name: module.name,
                    path: path
                });
            });
        }

        //Add a require at the end to kick start module execution, if that
        //was desired. Usually this is only specified when using small shim
        //loaders like almond.
        if (module.insertRequire) {
            fileContents += '\n' + namespaceWithDot + 'require(["' + module.insertRequire.join('", "') + '"]);\n';
        }

        return {
            text: config.wrap ?
                    config.wrap.start + fileContents + config.wrap.end :
                    fileContents,
            buildText: buildFileContents
        };
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
