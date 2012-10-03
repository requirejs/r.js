/**
 * @license r.js 2.1.0 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This is a bootstrap script to allow running RequireJS in the command line
 * in either a Java/Rhino or Node environment. It is modified by the top-level
 * dist.js file to inject other files to completely enable this file. It is
 * the shell of the r.js file.
 */

/*jslint evil: true, nomen: true, sloppy: true */
/*global readFile: true, process: false, Packages: false, print: false,
console: false, java: false, module: false, requirejsVars */

var requirejs, require, define;
(function (console, args, readFileFunc) {

    var fileName, env, fs, vm, path, exec, rhinoContext, dir, nodeRequire,
        nodeDefine, exists, reqMain, loadedOptimizedLib, existsForNode,
        version = '2.1.0',
        jsSuffixRegExp = /\.js$/,
        commandOption = '',
        useLibLoaded = {},
        //Used by jslib/rhino/args.js
        rhinoArgs = args,
        readFile = typeof readFileFunc !== 'undefined' ? readFileFunc : null;

    function showHelp() {
        console.log('See https://github.com/jrburke/r.js for usage.');
    }

    if (typeof Packages !== 'undefined') {
        env = 'rhino';

        fileName = args[0];

        if (fileName && fileName.indexOf('-') === 0) {
            commandOption = fileName.substring(1);
            fileName = args[1];
        }

        //Set up execution context.
        rhinoContext = Packages.org.mozilla.javascript.ContextFactory.getGlobal().enterContext();

        exec = function (string, name) {
            return rhinoContext.evaluateString(this, string, name, 0, null);
        };

        exists = function (fileName) {
            return (new java.io.File(fileName)).exists();
        };

        //Define a console.log for easier logging. Don't
        //get fancy though.
        if (typeof console === 'undefined') {
            console = {
                log: function () {
                    print.apply(undefined, arguments);
                }
            };
        }
    } else if (typeof process !== 'undefined') {
        env = 'node';

        //Get the fs module via Node's require before it
        //gets replaced. Used in require/node.js
        fs = require('fs');
        vm = require('vm');
        path = require('path');
        //In Node 0.7+ existsSync is on fs.
        existsForNode = fs.existsSync || path.existsSync;

        nodeRequire = require;
        nodeDefine = define;
        reqMain = require.main;

        //Temporarily hide require and define to allow require.js to define
        //them.
        require = undefined;
        define = undefined;

        readFile = function (path) {
            return fs.readFileSync(path, 'utf8');
        };

        exec = function (string, name) {
            return vm.runInThisContext(this.requirejsVars.require.makeNodeWrapper(string),
                                       name ? fs.realpathSync(name) : '');
        };

        exists = function (fileName) {
            return existsForNode(fileName);
        };


        fileName = process.argv[2];

        if (fileName && fileName.indexOf('-') === 0) {
            commandOption = fileName.substring(1);
            fileName = process.argv[3];
        }
    }

    //INSERT require.js

    if (env === 'rhino') {
        //INSERT build/jslib/rhino.js
    } else if (env === 'node') {
        this.requirejsVars = {
            require: require,
            requirejs: require,
            define: define,
            nodeRequire: nodeRequire
        };
        require.nodeRequire = nodeRequire;

        //INSERT build/jslib/node.js

    }

    //Support a default file name to execute. Useful for hosted envs
    //like Joyent where it defaults to a server.js as the only executed
    //script. But only do it if this is not an optimization run.
    if (commandOption !== 'o' && (!fileName || !jsSuffixRegExp.test(fileName))) {
        fileName = 'main.js';
    }

    /**
     * Loads the library files that can be used for the optimizer, or for other
     * tasks.
     */
    function loadLib() {
        //INSERT LIB
    }


    /**
     * Sets the default baseUrl for requirejs to be directory of top level
     * script.
     */
    function setBaseUrl(fileName) {
        //Use the file name's directory as the baseUrl if available.
        dir = fileName.replace(/\\/g, '/');
        if (dir.indexOf('/') !== -1) {
            dir = dir.split('/');
            dir.pop();
            dir = dir.join('/');
            exec("require({baseUrl: '" + dir + "'});");
        }
    }

    //If in Node, and included via a require('requirejs'), just export and
    //THROW IT ON THE GROUND!
    if (env === 'node' && reqMain !== module) {
        setBaseUrl(path.resolve(reqMain ? reqMain.filename : '.'));

        //Create a method that will run the optimzer given an object
        //config.
        requirejs.optimize = function (config, callback) {
            if (!loadedOptimizedLib) {
                loadLib();
                loadedOptimizedLib = true;
            }

            //Create the function that will be called once build modules
            //have been loaded.
            var runBuild = function (build, logger) {
                //Make sure config has a log level, and if not,
                //make it "silent" by default.
                config.logLevel = config.hasOwnProperty('logLevel') ?
                                  config.logLevel : logger.SILENT;

                //Reset build internals first in case this is part
                //of a long-running server process that could have
                //exceptioned out in a bad state. It is only defined
                //after the first call though.
                if (requirejs._buildReset) {
                    requirejs._buildReset();
                    requirejs._cacheReset();
                }

                var result = build(config);

                //And clean up, in case something else triggers
                //a build in another pathway.
                requirejs._buildReset();
                requirejs._cacheReset();

                if (callback) {
                    callback(result);
                }
            };

            requirejs({
                context: 'build'
            }, ['build', 'logger'], runBuild);
        };

        requirejs.tools = {
            useLib: function (contextName, callback) {
                if (!callback) {
                    callback = contextName;
                    contextName = 'uselib';
                }

                if (!useLibLoaded[contextName]) {
                    loadLib();
                    useLibLoaded[contextName] = true;
                }

                var req = requirejs({
                    context: contextName
                });

                req(['build'], function () {
                    callback(req);
                });
            }
        };

        requirejs.define = define;

        module.exports = requirejs;
        return;
    }

    if (commandOption === 'o') {
        //Do the optimizer work.
        loadLib();

        //INSERT build/build.js

    } else if (commandOption === 'v') {
        console.log('r.js: ' + version + ', RequireJS: ' + this.requirejsVars.require.version);
    } else if (commandOption === 'convert') {
        loadLib();

        this.requirejsVars.require(['env!env/args', 'commonJs', 'env!env/print'],
        function (args,           commonJs,   print) {

            var srcDir, outDir;
            srcDir = args[0];
            outDir = args[1];

            if (!srcDir || !outDir) {
                print('Usage: path/to/commonjs/modules output/dir');
                return;
            }

            commonJs.convertDir(args[0], args[1]);
        });
    } else {
        //Just run an app

        //Load the bundled libraries for use in the app.
        if (commandOption === 'lib') {
            loadLib();
        }

        setBaseUrl(fileName);

        if (exists(fileName)) {
            exec(readFile(fileName), fileName);
        } else {
            showHelp();
        }
    }

}((typeof console !== 'undefined' ? console : undefined),
  (typeof Packages !== 'undefined' ? Array.prototype.slice.call(arguments, 0) : []),
  (typeof readFile !== 'undefined' ? readFile : undefined)));
