/**
 * @license r.js 0.24.0+ Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This is a bootstrap script to allow running RequireJS in the command line
 * in either a Java/Rhino or Node environment. It is modified by the top-level
 * dist.js file to inject other files to completely enable this file. It is
 * the shell of the r.js file.
 */

/*jslint strict: false, evil: true */
/*global readFile: true, process: false, Packages: false, require: true
  print: false, console: false, java: false */

var require, define;
(function (console, args, readFileFunc) {

    var fileName, env, fs, vm, path, exec, rhinoContext, dir, nodeRequire, exists,
        version = '0.24.0+',
        jsSuffixRegExp = /\.js$/,
        //Indicates so build/build.js that the modules for the optimizer
        //are built-in.
        isRjs = true,
        commandOption = '',
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
        nodeRequire = require;
        require = undefined;

        readFile = function (path) {
            return fs.readFileSync(path, 'utf8');
        };

        exec = function (string, name) {
            return vm.runInThisContext(string, name ? fs.realpathSync(name) : '');
        };

        exists = function (fileName) {
            return path.existsSync(fileName);
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
        this.require = require;
        this.define = define;

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

    if (commandOption === 'o') {
        //Do the optimizer work.
        loadLib();

        //INSERT build/build.js

    } else if (commandOption === 'v') {
        console.log('r.js: ' + version + ', RequireJS: ' + require.version);
    } else if (commandOption === 'convert') {
        loadLib();

        require(['env!env/args', 'commonJs', 'env!env/print'],
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

        //Use the file name's directory as the baseUrl if available.
        dir = fileName.replace(/\\/g, '/');
        if (dir.indexOf('/') !== -1) {
            dir = dir.split('/');
            dir.pop();
            dir = dir.join('/');
            exec("require({baseUrl: '" + dir + "'});");
        }

        if (exists(fileName)) {
            try {
                exec(readFile(fileName), fileName);
            } catch (e) {
                //The optimizer may have been wanted, ask about it
                console.log('Trying to run the optimizer? Be sure to pass ' +
                            'the -o option.\nError evaluating file: ' + fileName +
                            ': ' + e);
            }
        } else {
            showHelp();
        }
    }

}((typeof console !== 'undefined' ? console : undefined),
  (typeof Packages !== 'undefined' ? Array.prototype.slice.call(arguments, 0) : []),
  (typeof readFile !== 'undefined' ? readFile : undefined)));
