/** vim: et:ts=4:sw=4:sts=4
 * @license amdefine 0.0.1 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/amdefine for details
 */

/*jslint strict: false, nomen: false, plusplus: false */
/*global module, process, require: true */

var path = require('path'),
    loaderCache = {},
    makeRequire;

// Null out require for this file so that it is not accidentally used
// below, where module.require should be used instead.
require = null;

/**
 * Given a relative module name, like ./something, normalize it to
 * a real name that can be mapped to a path.
 * @param {String} name the relative name
 * @param {String} baseName a real name that the name arg is relative
 * to.
 * @returns {String} normalized name
 */
function normalize(name, baseName) {
    return path.normalize(path.join(baseName, name));
}

/**
 * Create the normalize() function passed to a loader plugin's
 * normalize method.
 */
function makeNormalize(relName) {
    return function (name) {
        return normalize(name, relName);
    };
}

function makeLoad(id) {
    function load(value) {
        loaderCache[id] = value;
    }

    load.fromText = function (id, text) {
        //This one is difficult because the text can/probably uses
        //define, and any relative paths and requires should be relative
        //to that id was it would be found on disk. But this would require
        //bootstrapping a module/require fairly deeply from node core.
        //Not sure how best to go about that yet.
        throw new Error('amdefine does not implement load.fromText');
    };

    return load;
}

function stringRequire(module, id) {
    //Split the ID by a ! so that
    var index = id.indexOf('!'),
        relId = path.dirname(module.filename),
        prefix, plugin;

    if (index === -1) {
        //Straight module lookup. If it is one of the special dependencies,
        //deal with it, otherwise, delegate to node.
        if (id === 'require') {
            return makeRequire(module);
        } else if (id === 'exports') {
            return module.exports;
        } else if (id === 'module') {
            return module;
        } else {
            return module.require(id);
        }
    } else {
        //There is a plugin in play.
        prefix = id.substring(0, index);
        id = id.substring(index + 1, id.length);

        plugin = module.require(prefix);

        if (plugin.normalize) {
            id = plugin.normalize(id, makeNormalize(relId));
        } else {
            //Normalize the ID normally.
            id = normalize(id, relId);
        }

        if (loaderCache[id]) {
            return loaderCache[id];
        } else {
            plugin.load(id, makeRequire(module), makeLoad(id), {});

            return loaderCache[id];
        }
    }
}

makeRequire = function (module) {
    function amdRequire(deps, callback) {
        if (typeof deps === 'string') {
            //Synchronous, single module require('')
            return stringRequire(module, deps);
        } else {
            //Array of dependencies with a callback.

            //Convert the dependencies to modules.
            deps = deps.map(function (depName) {
                return stringRequire(module, depName);
            });

            //Wait for next tick to call back the require call.
            process.nextTick(function () {
                callback.apply(null, deps);
            });

            //Keeps strict checking in komodo happy.
            return undefined;
        }
    }

    amdRequire.toUrl = function (filePath) {
        if (filePath.indexOf('.') === 0) {
            return normalize(filePath, path.dirname(module.filename));
        } else {
            return filePath;
        }
    };

    return amdRequire;
};

function amdefine(module) {
    var alreadyCalled = false;

    //Create a define function specific to the module asking for amdefine.
    function define() {

        var args = arguments,
            factory = args[args.length - 1],
            isFactoryFunction = (typeof factory === 'function'),
            deps, result;

        //Only support one define call per file
        if (alreadyCalled) {
            throw new Error('amdefine cannot be called more than once per file.');
        }
        alreadyCalled = true;

        //Grab array of dependencies if it is there.
        if (args.length > 1) {
            deps = args[args.length - 2];
            if (!Array.isArray(deps)) {
                //deps is not an array, may be an ID. Discard it.
                deps = null;
            }
        }

        //If there are dependencies, they are strings, so need
        //to convert them to dependency values.
        if (deps) {
            deps = deps.map(function (depName) {
                return stringRequire(module, depName);
            });
        } else if (isFactoryFunction) {
            //Pass in the standard require, exports, module
            deps = [makeRequire(module), module.exports, module];
        }

        if (!isFactoryFunction) {
            //Factory is an object that should just be used for the define call.
            module.exports = factory;
        } else {
            //Call the factory with the right dependencies.
            result = factory.apply(module.exports, deps);

            if (result !== undefined) {
                module.exports = result;
            }
        }
    }

    define.amd = {};

    return define;
}

module.exports = amdefine;