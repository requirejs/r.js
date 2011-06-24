/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint plusplus: false, strict: false */
/*global define: false */

define(['uglifyjs/index'], function (uglify) {
    var parser = uglify.parser,
        processor = uglify.uglify,
        ostring = Object.prototype.toString,
        isArray;

    if (Array.isArray) {
        isArray = Array.isArray;
    } else {
        isArray = function (it) {
            return ostring.call(it) === "[object Array]";
        };
    }

    /**
     * Determines if the AST node is an array literal
     */
    function isArrayLiteral(node) {
        return node[0] === 'array';
    }

    /**
     * Determines if the AST node is an object literal
     */
    function isObjectLiteral(node) {
        return node[0] === 'object';
    }

    /**
     * Converts a regular JS array of strings to an AST node that
     * represents that array.
     * @param {Array} ary
     * @param {Node} an AST node that represents an array of strings.
     */
    function toAstArray(ary) {
        var output = [
            'array',
            []
        ],
        i, item;

        for (i = 0; (item = ary[i]); i++) {
            output[1].push([
                'string',
                item
            ]);
        }

        return output;
    }

    /**
     * Validates a node as being an object literal (like for i18n bundles)
     * or an array literal with just string members. If an array literal,
     * only return array members that are full strings. So the caller of
     * this function should use the return value as the new value for the
     * node.
     *
     * This function does not need to worry about comments, they are not
     * present in this AST.
     *
     * @param {Node} node an AST node.
     *
     * @returns {Node} an AST node to use for the valid dependencies.
     * If null is returned, then it means the input node was not a valid
     * dependency.
     */
    function validateDeps(node) {
        var newDeps = ['array', []],
            arrayArgs, i, dep;

        if (!node) {
            return null;
        }

        if (isObjectLiteral(node) || node[0] === 'function') {
            return node;
        }

        //Dependencies can be an object literal or an array.
        if (!isArrayLiteral(node)) {
            return null;
        }

        arrayArgs = node[1];

        for (i = 0; i < arrayArgs.length; i++) {
            dep = arrayArgs[i];
            if (dep[0] === 'string') {
                newDeps[1].push(dep);
            }
        }
        return newDeps[1].length ? newDeps : null;
    }

    /**
     * Main parse function. Returns a string of any valid require or define/require.def
     * calls as part of one JavaScript source string.
     * @param {String} fileName
     * @param {String} fileContents
     * @returns {String} JS source string or null, if no require or define/require.def
     * calls are found.
     */
    function parse(fileName, fileContents) {
        //Set up source input
        var matches = [], result = null,
            astRoot = parser.parse(fileContents);

        parse.recurse(astRoot, function () {
            var parsed = parse.callToString.apply(parse, arguments);
            if (parsed) {
                matches.push(parsed);
            }
        });

        if (matches.length) {
            result = matches.join("\n");
        }

        return result;
    }

    //Add some private methods to object for use in derived objects.
    parse.isArray = isArray;
    parse.isObjectLiteral = isObjectLiteral;
    parse.isArrayLiteral = isArrayLiteral;

    /**
     * Handles parsing a file recursively for require calls.
     * @param {Array} parentNode the AST node to start with.
     * @param {Function} onMatch function to call on a parse match.
     */
    parse.recurse = function (parentNode, onMatch) {
        var i, node;
        if (isArray(parentNode)) {
            for (i = 0; i < parentNode.length; i++) {
                node = parentNode[i];
                if (isArray(node)) {
                    this.parseNode(node, onMatch);
                    this.recurse(node, onMatch);
                }
            }
        }
    };

    /**
     * Determines if the file defines require().
     * @param {String} fileName
     * @param {String} fileContents
     * @returns {Boolean}
     */
    parse.definesRequire = function (fileName, fileContents) {
        var astRoot = parser.parse(fileContents);
        return this.nodeHasRequire(astRoot);
    };

    /**
     * Finds require("") calls inside a CommonJS anonymous module wrapped in a
     * define/require.def(function(require, exports, module){}) wrapper. These dependencies
     * will be added to a modified define() call that lists the dependencies
     * on the outside of the function.
     * @param {String} fileName
     * @param {String} fileContents
     * @returns {Array} an array of module names that are dependencies. Always
     * returns an array, but could be of length zero.
     */
    parse.getAnonDeps = function (fileName, fileContents) {
        var astRoot = parser.parse(fileContents),
            defFunc = this.findAnonRequireDefCallback(astRoot);

        return parse.getAnonDepsFromNode(defFunc);
    };

    /**
     * Finds require("") calls inside a CommonJS anonymous module wrapped
     * in a define function, given an AST node for the definition function.
     * @param {Node} node the AST node for the definition function.
     * @returns {Array} and array of dependency names. Can be of zero length.
     */
    parse.getAnonDepsFromNode = function (node) {
        var deps = [],
            funcArgLength;

        if (node) {
            this.findRequireDepNames(node, deps);

            //If no deps, still add the standard CommonJS require, exports, module,
            //in that order, to the deps, but only if specified as function args.
            //In particular, if exports is used, it is favored over the return
            //value of the function, so only add it if asked.
            funcArgLength = node[2] && node[2].length;
            if (funcArgLength) {
                deps = (funcArgLength > 1 ? ["require", "exports", "module"] :
                        ["require"]).concat(deps);
            }
        }
        return deps;
    };

    /**
     * Finds the function in require.def or define(function (require, exports, module){});
     * @param {Array} node
     * @returns {Boolean}
     */
    parse.findAnonRequireDefCallback = function (node) {
        var callback, i, n, call, args;

        if (isArray(node)) {
            if (node[0] === 'call') {
                call = node[1];
                args = node[2];
                if ((call[0] === 'name' && call[1] === 'define') ||
                           (call[0] === 'dot' && call[1][1] === 'require' && call[2] === 'def')) {

                    //There should only be one argument and it should be a function.
                    if (args.length === 1 && args[0][0] === 'function') {
                        return args[0];
                    }

                }
            }

            //Check child nodes
            for (i = 0; i < node.length; i++) {
                n = node[i];
                if ((callback = this.findAnonRequireDefCallback(n))) {
                    return callback;
                }
            }
        }

        return null;
    };

    /**
     * Finds all dependencies specified in dependency arrays and inside
     * simplified commonjs wrappers.
     * @param {String} fileName
     * @param {String} fileContents
     *
     * @returns {Array} an array of dependency strings. The dependencies
     * have not been normalized, they may be relative IDs.
     */
    parse.findDependencies = function (fileName, fileContents) {
        //This is a litle bit inefficient, it ends up with two uglifyjs parser
        //calls. Can revisit later, but trying to build out larger functional
        //pieces first.
        var dependencies = parse.getAnonDeps(fileName, fileContents),
            astRoot = parser.parse(fileContents),
            i, dep;

        parse.recurse(astRoot, function (callName, config, name, deps) {
            //Normalize the input args.
            if (name && isArrayLiteral(name)) {
                deps = name;
                name = null;
            }

            if (!(deps = validateDeps(deps)) || !isArrayLiteral(deps)) {
                return;
            }

            for (i = 0; (dep = deps[1][i]); i++) {
                dependencies.push(dep[1]);
            }
        });

        return dependencies;
    };

    parse.findRequireDepNames = function (node, deps) {
        var moduleName, i, n, call, args;

        if (isArray(node)) {
            if (node[0] === 'call') {
                call = node[1];
                args = node[2];

                if (call[0] === 'name' && call[1] === 'require') {
                    moduleName = args[0];
                    if (moduleName[0] === 'string') {
                        deps.push(moduleName[1]);
                    }
                }


            }

            //Check child nodes
            for (i = 0; i < node.length; i++) {
                n = node[i];
                this.findRequireDepNames(n, deps);
            }
        }
    };

    /**
     * Determines if a given node contains a require() definition.
     * @param {Array} node
     * @returns {Boolean}
     */
    parse.nodeHasRequire = function (node) {
        if (this.isDefineNode(node)) {
            return true;
        }

        if (isArray(node)) {
            for (var i = 0, n; i < node.length; i++) {
                n = node[i];
                if (this.nodeHasRequire(n)) {
                    return true;
                }
            }
        }

        return false;
    };

    /**
     * Is the given node the actual definition of define(). Actually uses
     * the definition of define.amd to find require.
     * @param {Array} node
     * @returns {Boolean}
     */
    parse.isDefineNode = function (node) {
        //Actually look for the define.amd = assignment, since
        //that is more indicative of RequireJS vs a plain require definition.
        var assign;
        if (!node) {
            return null;
        }

        if (node[0] === 'assign' && node[1] === true) {
            assign = node[2];
            if (assign[0] === 'dot' && assign[1][0] === 'name' &&
                assign[1][1] === 'define' && assign[2] === 'amd') {
                return true;
            }
        }
        return false;
    };

    function optionalString(node) {
        var str = null;
        if (node) {
            str = parse.nodeToString(node);
        }
        return str;
    }

    /**
     * Convert a require/require.def/define call to a string if it is a valid
     * call via static analysis of dependencies.
     * @param {String} callName the name of call (require or define)
     * @param {Array} the config node inside the call
     * @param {Array} the name node inside the call
     * @param {Array} the deps node inside the call
     */
    parse.callToString = function (callName, config, name, deps) {
        //If name is an array, it means it is an anonymous module,
        //so adjust args appropriately. An anonymous module could
        //have a FUNCTION as the name type, but just ignore those
        //since we just want to find dependencies.
        var configString, nameString, depString;
        if (name && isArrayLiteral(name)) {
            deps = name;
            name = null;
        }

        if (!(deps = validateDeps(deps))) {
            return null;
        }

        //Only serialize the call name, config, module name and dependencies,
        //otherwise could get local variable names for module value.
        configString = config && isObjectLiteral(config) && optionalString(config);
        nameString = optionalString(name);
        depString = optionalString(deps);

        return callName + "(" +
            (configString ? configString : "") +
            (nameString ? (configString ? "," : "") + nameString : "") +
            (depString ? (configString || nameString ? "," : "") + depString : "") +
            ");";
    };

    /**
     * Determines if a specific node is a valid require or define/require.def call.
     * @param {Array} node
     * @param {Function} onMatch a function to call when a match is found.
     * It is passed the match name, and the config, name, deps possible args.
     * The config, name and deps args are not normalized.
     *
     * @returns {String} a JS source string with the valid require/define call.
     * Otherwise null.
     */
    parse.parseNode = function (node, onMatch) {
        var call, name, config, deps, args, cjsDeps;

        if (!isArray(node)) {
            return null;
        }

        if (node[0] === 'call') {
            call = node[1];
            args = node[2];

            if (call) {
                if (call[0] === 'name' && call[1] === 'require') {

                    //It is a plain require() call.
                    config = args[0];
                    deps = args[1];
                    if (isArrayLiteral(config)) {
                        deps = config;
                        config = null;
                    }

                    if (!(deps = validateDeps(deps))) {
                        return null;
                    }

                    return onMatch("require", null, null, deps);

                } else if ((call[0] === 'name' && call[1] === 'define') ||
                           (call[0] === 'dot' && call[1][1] === 'require' &&
                            call[2] === 'def')) {

                    //A define or require.def call
                    name = args[0];
                    deps = args[1];
                    //Only allow define calls that match what is expected
                    //in an AMD call:
                    //* first arg should be string, array, function or object
                    //* second arg optional, or array, function or object.
                    //This helps weed out calls to a non-AMD define, but it is
                    //not completely robust. Someone could create a define
                    //function that still matches this shape, but this is the
                    //best that is possible, and at least allows UglifyJS,
                    //which does create its own internal define in one file,
                    //to be inlined.
                    if (((name[0] === 'string' || isArrayLiteral(name) ||
                          name[0] === 'function' || isObjectLiteral(name))) &&
                        (!deps || isArrayLiteral(deps) ||
                         deps[0] === 'function' || isObjectLiteral(deps))) {

                        //If first arg is a function, could be a commonjs wrapper,
                        //look inside for commonjs dependencies.
                        if (name && name[0] === 'function') {
                            cjsDeps = parse.getAnonDepsFromNode(name);
                            if (cjsDeps.length) {
                                name = toAstArray(cjsDeps);
                            }
                        }

                        return onMatch("define", null, name, deps);
                    }
                }
            }
        }

        return null;
    };

    /**
     * Converts an AST node into a JS source string. Does not maintain formatting
     * or even comments from original source, just returns valid JS source.
     * @param {Array} node
     * @returns {String} a JS source string.
     */
    parse.nodeToString = function (node) {
        return processor.gen_code(node, true);
    };

    return parse;
});
