/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint regexp: false, plusplus: false, nomen: false, strict: false  */
/*global define: false, require: false */


define([ 'lang', 'logger', 'env!env/file', 'parse', 'optimize', 'pragma',
         'env!env/load', 'requirePatch'],
function (lang,   logger,   file,          parse,    optimize,   pragma,
          load,           requirePatch) {
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
            dirExclusionRegExp: file.dirExclusionRegExp
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

    /**
     * If the path looks like an URL, throw an error. This is to prevent
     * people from using URLs with protocols in the build config, since
     * the optimizer is not set up to do network access. However, be
     * sure to allow absolute paths on Windows, like C:\directory.
     */
    function disallowUrls(path) {
        if (path.indexOf('://') !== -1 && path !== 'empty:') {
            throw new Error('Path is not supported: ' + path +
                            '\nOptimizer can only handle' +
                            ' local paths. Download the locally if necessary' +
                            ' and update the config to use a local path.\n' +
                            'http://requirejs.org/docs/errors.html#pathnotsupported');
        }
    }

    function endsWithSlash(dirName) {
        if (dirName.charAt(dirName.length - 1) !== "/") {
            dirName += "/";
        }
        disallowUrls(dirName);
        return dirName;
    }

    //Method used by plugin writeFile calls, defined up here to avoid
    //jslint warning about "making a function in a loop".
    function makeWriteFile(anonDefRegExp, namespaceWithDot, layer) {
        function writeFile(name, contents) {
            logger.trace('Saving plugin-optimized file: ' + name);
            file.saveUtf8File(name, contents);
        }

        writeFile.asModule = function (moduleName, fileName, contents) {
            writeFile(fileName,
                build.toTransport(anonDefRegExp, namespaceWithDot, moduleName, fileName, contents, layer));
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
        var buildFile, cmdConfig;

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
    };

    build._run = function (cmdConfig) {
        var buildFileContents = "",
            pluginCollector = {},
            buildPaths, fileName, fileNames,
            prop, paths, i,
            baseConfig, config,
            modules, builtModule, srcPath, buildContext,
            destPath, moduleName, moduleMap, parentModuleMap, context,
            resources, resource, pluginProcessed = {}, plugin;

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

        if (!config.out && !config.cssIn) {
            //This is not just a one-off file build but a full build profile, with
            //lots of files to process.

            //First copy all the baseUrl content
            file.copyDir((config.appDir || config.baseUrl), config.dir, /\w/, true);

            //Adjust baseUrl if config.appDir is in play, and set up build output paths.
            buildPaths = {};
            if (config.appDir) {
                //All the paths should be inside the appDir
                buildPaths = paths;
            } else {
                //If no appDir, then make sure to copy the other paths to this directory.
                for (prop in paths) {
                    if (paths.hasOwnProperty(prop)) {
                        //Set up build path for each path prefix.
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
                config.modules[0]._buildPath = config.out;
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
            optimize.css(config.dir, config);
        }

        if (modules) {
            //For each module layer, call require to calculate dependencies.
            modules.forEach(function (module) {
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
                file.saveUtf8File(module._buildPath + '-temp', builtModule.text);
                buildFileContents += builtModule.buildText;
            });

            //Now move the build layers to their final position.
            modules.forEach(function (module) {
                var finalPath = module._buildPath;
                if (file.exists(finalPath)) {
                    file.deleteFile(finalPath);
                }
                file.renameFile(finalPath + '-temp', finalPath);
            });
        }

        //Do other optimizations.
        if (config.out && !config.cssIn) {
            //Just need to worry about one JS file.
            fileName = config.modules[0]._buildPath;
            optimize.jsFile(fileName, fileName, config);
        } else if (!config.cssIn) {
            //Normal optimizations across modules.

            //JS optimizations.
            fileNames = file.getFilteredFileList(config.dir, /\.js$/, true);
            for (i = 0; (fileName = fileNames[i]); i++) {
                //Generate the module name from the config.dir root.
                moduleName = fileName.replace(config.dir, '');
                //Get rid of the extension
                moduleName = moduleName.substring(0, moduleName.length - 3);
                optimize.jsFile(fileName, fileName, config, moduleName, pluginCollector);
            }

            //Normalize all the plugin resources.
            context = require.s.contexts._;

            for (moduleName in pluginCollector) {
                if (pluginCollector.hasOwnProperty(moduleName)) {
                    parentModuleMap = context.makeModuleMap(moduleName);
                    resources = pluginCollector[moduleName];
                    for (i = 0; (resource = resources[i]); i++) {
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
                        if (!pluginProcessed[moduleMap.fullName]) {
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
                                        config.anonDefRegExp,
                                        config.namespaceWithDot
                                    ),
                                    context.config
                                );
                            }

                            pluginProcessed[moduleMap.fullName] = true;
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
            optimize.cssFile(config.cssIn, config.out, config);
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
    function stringDotToObj(result, prop, name, value) {
        if (!result[prop]) {
            result[prop] = {};
        }
        name = name.substring((prop + '.').length, name.length);
        result[prop][name] = value;
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
        'closure.'
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
                "excludeShallow": true
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
                stringDotToObj(result, prop.split('.')[0], prop, value);
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
            for (i = 0; (prop = props[i]); i++) {
                if (obj.hasOwnProperty(prop)) {
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
        var props, prop, i, originalBaseUrl;

        props = ["appDir", "dir", "baseUrl"];
        for (i = 0; (prop = props[i]); i++) {
            if (config[prop]) {
                //Add abspath if necessary, make sure these paths end in
                //slashes
                if (prop === "baseUrl") {
                    originalBaseUrl = config.baseUrl;
                    if (config.appDir) {
                        //If baseUrl with an appDir, the baseUrl is relative to
                        //the appDir, *not* the absFilePath. appDir and dir are
                        //made absolute before baseUrl, so this will work.
                        config.baseUrl = build.makeAbsPath(originalBaseUrl, config.appDir);
                        //Set up dir output baseUrl.
                        config.dirBaseUrl = build.makeAbsPath(originalBaseUrl, config.dir);
                    } else {
                        //The dir output baseUrl is same as regular baseUrl, both
                        //relative to the absFilePath.
                        config.baseUrl = build.makeAbsPath(config[prop], absFilePath);
                        config.dirBaseUrl = config.dir || config.baseUrl;
                    }

                    //Make sure dirBaseUrl ends in a slash, since it is
                    //concatenated with other strings.
                    config.dirBaseUrl = endsWithSlash(config.dirBaseUrl);
                } else {
                    config[prop] = build.makeAbsPath(config[prop], absFilePath);
                }

                config[prop] = endsWithSlash(config[prop]);
            }
        }

        //Do not allow URLs for paths resources.
        if (config.paths) {
            for (prop in config.paths) {
                if (config.paths.hasOwnProperty(prop)) {
                    config.paths[prop] = build.makeAbsPath(config.paths[prop],
                                              (config.baseUrl || absFilePath));
                }
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
                    if (!target[prop]) {
                        target[prop] = {};
                    }
                    lang.mixin(target[prop], source[prop], true);
                } else {
                    target[prop] = source[prop];
                }
            }
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
            mainConfigFile, prop, buildFile, absFilePath;

        lang.mixin(config, buildBaseConfig);
        lang.mixin(config, cfg, true);

        //Make sure all paths are relative to current directory.
        absFilePath = file.absPath('.');
        build.makeAbsConfig(config, absFilePath);

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

                if (!buildFileConfig.out && !buildFileConfig.dir) {
                    buildFileConfig.dir = (buildFileConfig.baseUrl || config.baseUrl) + "/build/";
                }

            } catch (e) {
                throw new Error("Build file " + buildFile + " is malformed: " + e);
            }
        }

        mainConfigFile = config.mainConfigFile || (buildFileConfig && buildFileConfig.mainConfigFile);
        if (mainConfigFile) {
            mainConfigFile = build.makeAbsPath(mainConfigFile, absFilePath);
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
                //If no baseUrl, then use the directory holding the main config.
                if (!mainConfig.baseUrl) {
                    mainConfig.baseUrl = mainConfigFile.substring(0, mainConfigFile.lastIndexOf('/'));
                }
                build.makeAbsConfig(mainConfig, mainConfigFile);
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

        //Check for errors in config
        if (config.cssIn && !config.out) {
            throw new Error("ERROR: 'out' option missing.");
        }
        if (!config.cssIn && !config.baseUrl) {
            throw new Error("ERROR: 'baseUrl' option missing.");
        }
        if (!config.out && !config.dir) {
            throw new Error('Missing either an "out" or "dir" config value.');
        }
        if (config.out && config.dir) {
            throw new Error('The "out" and "dir" options are incompatible.' +
                            ' Use "out" if you are targeting a single file for' +
                            ' for optimization, and "dir" if you want the appDir' +
                            ' or baseUrl directories optimized.');
        }

        if (config.out && !config.cssIn) {
            //Just one file to optimize.

            //Set up dummy module layer to build.
            config.modules = [
                {
                    name: config.name,
                    out: config.out,
                    include: config.include,
                    exclude: config.exclude,
                    excludeShallow: config.excludeShallow
                }
            ];

            //Does not have a build file, so set up some defaults.
            //Optimizing CSS should not be allowed, unless explicitly
            //asked for on command line. In that case the only task is
            //to optimize a CSS file.
            if (!cfg.optimizeCss) {
                config.optimizeCss = "none";
            }
        }

        //Do not allow URLs for paths resources.
        if (config.paths) {
            for (prop in config.paths) {
                if (config.paths.hasOwnProperty(prop)) {
                    disallowUrls(config.paths[prop]);
                }
            }
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
                    config.wrap.start = config.wrap.start ||
                            file.readFile(build.makeAbsPath(config.wrap.startFile, absFilePath));
                    config.wrap.end = config.wrap.end ||
                            file.readFile(build.makeAbsPath(config.wrap.endFile, absFilePath));
                }
            }
        } catch (wrapError) {
            throw new Error('Malformed wrap config: need both start/end or ' +
                            'startFile/endFile: ' + wrapError.toString());
        }


        //Set up proper info for namespaces and using namespaces in transport
        //wrappings.
        config.namespaceWithDot = config.namespace ? config.namespace + '.' : '';
        config.anonDefRegExp = build.makeAnonDefRegExp(config.namespaceWithDot);

        //Do final input verification
        if (config.context) {
            throw new Error('The build argument "context" is not supported' +
                            ' in a build. It should only be used in web' +
                            ' pages.');
        }

        //Set file.fileExclusionRegExp if desired
        if ('fileExclusionRegExp' in config) {
            if (typeof config.fileExclusionRegExp === "string") {
                file.exclusionRegExp = new RegExp(config.fileExclusionRegExp);
            } else {
                file.exclusionRegExp = config.fileExclusionRegExp;
            }
        } else if ('dirExclusionRegExp' in config) {
            //Set file.dirExclusionRegExp if desired, this is the old
            //name for fileExclusionRegExp before 1.0.2. Support for backwards
            //compatibility
            file.exclusionRegExp = config.dirExclusionRegExp;
        }

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
        for (i = 0; (module = modules[i]); i++) {
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

        //Take it out of the specified modules. Specified modules are mostly
        //used to find require modifiers.
        delete layer.specified[module];
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
        var include, override, layer, context, baseConfig, oldContext;

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
        require(lang.delegate(baseConfig));

        logger.trace("\nTracing dependencies for: " + (module.name || module.out));
        include = module.name && !module.create ? [module.name] : [];
        if (module.include) {
            include = include.concat(module.include);
        }

        //If there are overrides to basic config, set that up now.;
        if (module.override) {
            override = lang.delegate(baseConfig);
            lang.mixin(override, module.override, true);
            require(override);
        }

        //Figure out module layer dependencies by calling require to do the work.
        require(include);

        //Pull out the layer dependencies.
        layer.specified = context.specified;

        //Reset config
        if (module.override) {
            require(baseConfig);
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
        var buildFileContents = "",
            namespace = config.namespace ? config.namespace + '.' : '',
            context = layer.context,
            anonDefRegExp = config.anonDefRegExp,
            path, reqIndex, fileContents, currContents,
            i, moduleName,
            parts, builder, writeApi;

        //Use override settings, particularly for pragmas
        if (module.override) {
            config = lang.delegate(config);
            lang.mixin(config, module.override, true);
        }

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
        for (i = 0; (path = layer.buildFilePaths[i]); i++) {
            moduleName = layer.buildFileToModule[path];

            //Figure out if the module is a result of a build plugin, and if so,
            //then delegate to that plugin.
            parts = context.makeModuleMap(moduleName);
            builder = parts.prefix && context.defined[parts.prefix];
            if (builder) {
                if (builder.write) {
                    writeApi = function (input) {
                        fileContents += "\n" + addSemiColon(input);
                    };
                    writeApi.asModule = function (moduleName, input) {
                        fileContents += "\n" +
                                        addSemiColon(
                                            build.toTransport(anonDefRegExp, namespace, moduleName, path, input, layer));
                    };
                    builder.write(parts.prefix, parts.name, writeApi);
                }
            } else {
                currContents = file.readFile(path);

                if (config.namespace) {
                    currContents = pragma.namespace(currContents, config.namespace);
                }

                currContents = build.toTransport(anonDefRegExp, namespace, moduleName, path, currContents, layer);

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
                //If including jquery, register the module correctly, otherwise
                //register an empty function. For jquery, make sure jQuery is
                //a real object, and perhaps not some other file mapping, like
                //to zepto.
                if (moduleName === 'jquery') {
                    fileContents += '\n(function () {\n' +
                                   'var jq = typeof jQuery !== "undefined" && jQuery;\n' +
                                   namespace +
                                   'define("jquery", [], function () { return jq; });\n' +
                                   '}());\n';
                } else {
                    fileContents += '\n' + namespace + 'define("' + moduleName + '", function(){});\n';
                }
            }
        }

        return {
            text: config.wrap ?
                    config.wrap.start + fileContents + config.wrap.end :
                    fileContents,
            buildText: buildFileContents
        };
    };

    /**
     * Creates the regexp to find anonymous defines.
     * @param {String} namespace an optional namespace to use. The namespace
     * should *include* a trailing dot. So a valid value would be 'foo.'
     * @returns {RegExp}
     */
    build.makeAnonDefRegExp = function (namespace) {
        //This regexp is not bullet-proof, and it has one optional part to
        //avoid issues with some Dojo transition modules that use a
        //define(\n//begin v1.x content
        //for a comment.
        return new RegExp('(^|[^\\.])(' + (namespace || '').replace(/\./g, '\\.') +
                          'define|define)\\s*\\(\\s*(\\/\\/[^\\n\\r]*[\\r\\n])?(\\[|function|[\\w\\d_\\$]+\\s*\\)|\\{|["\']([^"\']+)["\'])(\\s*,\\s*f)?');
    };

    build.leadingCommaRegExp = /^\s*,/;

    build.toTransport = function (anonDefRegExp, namespace, moduleName, path, contents, layer) {

        //If anonymous module, insert the module name.
        return contents.replace(anonDefRegExp, function (match, start, callName, possibleComment, suffix, namedModule, namedFuncStart) {
            //A named module with either listed dependencies or an object
            //literal for a value. Skip it. If named module, only want ones
            //whose next argument is a function literal to scan for
            //require('') dependecies.
            if (namedModule && !namedFuncStart) {
                return match;
            }

            //Only mark this module as having a name if not a named module,
            //or if a named module and the name matches expectations.
            if (layer && (!namedModule || namedModule === moduleName)) {
                layer.modulesWithNames[moduleName] = true;
            }

            var deps = null;

            //Look for CommonJS require calls inside the function if this is
            //an anonymous define call that just has a function registered.
            //Also look if a named define function but has a factory function
            //as the second arg that should be scanned for dependencies.
            if (suffix.indexOf('f') !== -1 || (namedModule)) {
                deps = parse.getAnonDeps(path, contents);

                if (deps.length) {
                    deps = deps.map(function (dep) {
                        return "'" + dep + "'";
                    });
                } else {
                    deps = [];
                }
            }

            return start + namespace + "define('" + (namedModule || moduleName) + "'," +
                   (deps ? ('[' + deps.toString() + '],') : '') +
                   (namedModule ? namedFuncStart.replace(build.leadingCommaRegExp, '') : suffix);
        });

    };

    return build;
});
