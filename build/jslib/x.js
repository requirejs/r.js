/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This is a bootstrap script to allow running RequireJS in the command line
 * in either a Java/Rhino or Node environment. It is best to call this script
 * via the x script that is a sibling to it.
 */

/*jslint strict: false, evil: true */
/*global readFile: true, process: false, Packages: false, require: true
  print: false, console: false */

var require, define;
(function (console, args, readFileFunc) {

    var fileName, env, fs, vm, exec, rhinoContext, dir, nodeRequire,
        jsSuffixRegExp = /\.js$/,
        commandOption = '',
        showHelp = false;
        readFile = typeof readFileFunc !== 'undefined' ? readFileFunc : null;

    if (typeof Packages !== 'undefined') {
        env = 'rhino';

        fileName = args[0];

        if (!fileName) {
            showHelp = true;
        } else if (fileName.indexOf('-') === 0) {
            commandOption = fileName.substring(1);
            fileName = args[1];
        }

        //Set up execution context.
        rhinoContext = Packages.org.mozilla.javascript.ContextFactory.getGlobal().enterContext();

        exec = function (string, name) {
            return rhinoContext.evaluateString(this, string, name, 0, null);
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
        nodeRequire = require;
        require = undefined;

        readFile = function (path) {
            return fs.readFileSync(path, 'utf8');
        };

        exec = function (string, name) {
            return vm.runInThisContext(string, name);
        };

        fileName = process.argv[2];

        if (!fileName) {
            showHelp = true;
        } else if (fileName.indexOf('-') === 0) {
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
    //script.
    if (!fileName || !jsSuffixRegExp.test(fileName)) {
        fileName = 'main.js';
    }

    if (showHelp) {
        console.log('See https://github.com/jrburke/r.js for usage.');
    } else if (commandOption === 'o') {
        //Do the optimizer work.

        //INSERT OPTIMIZER
    } else {
        //Just run an app

        //Use the file name's directory as the baseUrl if available.
        dir = fileName.replace(/\\/g, '/');
        if (dir.indexOf('/') !== -1) {
            dir = dir.split('/');
            dir.pop();
            dir = dir.join('/');
            exec("require({baseUrl: '" + dir + "'});");
        }

        exec(readFile(fileName), fileName);
    }

}((typeof console !== 'undefined' ? console : undefined),
  (typeof Packages !== 'undefined' ? arguments : []),
  (typeof readFile !== 'undefined' ? readFile : undefined)));
