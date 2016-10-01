/*global define */

define([ './esprimaAdapter', './parse', 'logger', 'lang'],
function (esprima, parse, logger, lang) {
    'use strict';
    var transform,
        baseIndentRegExp = /^([ \t]+)/,
        indentRegExp = /\{[\r\n]+([ \t]+)/,
        keyRegExp = /^[_A-Za-z]([A-Za-z\d_]*)$/,
        bulkIndentRegExps = {
            '\n': /\n/g,
            '\r\n': /\r\n/g
        };

    function applyIndent(str, indent, lineReturn) {
        var regExp = bulkIndentRegExps[lineReturn];
        return str.replace(regExp, '$&' + indent);
    }

    transform = {
        toTransport: function (namespace, moduleName, path, contents, onFound, options) {
            options = options || {};

            var astRoot, contentLines, modLine,
                foundAnon,
                scanCount = 0,
                scanReset = false,
                defineInfos = [],
                applySourceUrl = function (contents) {
                    if (options.useSourceUrl) {
                        contents = 'eval("' + lang.jsEscape(contents) +
                            '\\n//# sourceURL=' + (path.indexOf('/') === 0 ? '' : '/') +
                            path +
                            '");\n';
                    }
                    return contents;
                };

            try {
                astRoot = esprima.parse(contents, {
                    loc: true
                });
            } catch (e) {
                logger.trace('toTransport skipping ' + path + ': ' +
                             e.toString());
                return contents;
            }

            //Find the define calls and their position in the files.
            parse.traverse(astRoot, function (node) {
                var args, firstArg, firstArgLoc, factoryNode,
                    needsId, depAction, foundId, init,
                    sourceUrlData, range,
                    namespaceExists = false;

                // If a bundle script with a define declaration, do not
                // parse any further at this level. Likely a built layer
                // by some other tool.
                if (node.type === 'VariableDeclarator' &&
                    node.id && node.id.name === 'define' &&
                    node.id.type === 'Identifier') {
                    init = node.init;
                    if (init && init.callee &&
                        init.callee.type === 'CallExpression' &&
                        init.callee.callee &&
                        init.callee.callee.type === 'Identifier' &&
                        init.callee.callee.name === 'require' &&
                        init.callee.arguments && init.callee.arguments.length === 1 &&
                        init.callee.arguments[0].type === 'Literal' &&
                        init.callee.arguments[0].value &&
                        init.callee.arguments[0].value.indexOf('amdefine') !== -1) {
                        // the var define = require('amdefine')(module) case,
                        // keep going in that case.
                    } else {
                        return false;
                    }
                }

                namespaceExists = namespace &&
                                node.type === 'CallExpression' &&
                                node.callee  && node.callee.object &&
                                node.callee.object.type === 'Identifier' &&
                                node.callee.object.name === namespace &&
                                node.callee.property.type === 'Identifier' &&
                                node.callee.property.name === 'define';

                if (namespaceExists || parse.isDefineNodeWithArgs(node)) {
                    //The arguments are where its at.
                    args = node.arguments;
                    if (!args || !args.length) {
                        return;
                    }

                    firstArg = args[0];
                    firstArgLoc = firstArg.loc;

                    if (args.length === 1) {
                        if (firstArg.type === 'Identifier') {
                            //The define(factory) case, but
                            //only allow it if one Identifier arg,
                            //to limit impact of false positives.
                            needsId = true;
                            depAction = 'empty';
                        } else if (parse.isFnExpression(firstArg)) {
                            //define(function(){})
                            factoryNode = firstArg;
                            needsId = true;
                            depAction = 'scan';
                        } else if (firstArg.type === 'ObjectExpression') {
                            //define({});
                            needsId = true;
                            depAction = 'skip';
                        } else if (firstArg.type === 'Literal' &&
                                   typeof firstArg.value === 'number') {
                            //define('12345');
                            needsId = true;
                            depAction = 'skip';
                        } else if (firstArg.type === 'UnaryExpression' &&
                                   firstArg.operator === '-' &&
                                   firstArg.argument &&
                                   firstArg.argument.type === 'Literal' &&
                                   typeof firstArg.argument.value === 'number') {
                            //define('-12345');
                            needsId = true;
                            depAction = 'skip';
                        } else if (firstArg.type === 'MemberExpression' &&
                                   firstArg.object &&
                                   firstArg.property &&
                                   firstArg.property.type === 'Identifier') {
                            //define(this.key);
                            needsId = true;
                            depAction = 'empty';
                        }
                    } else if (firstArg.type === 'ArrayExpression') {
                        //define([], ...);
                        needsId = true;
                        depAction = 'skip';
                    } else if (firstArg.type === 'Literal' &&
                               typeof firstArg.value === 'string') {
                        //define('string', ....)
                        //Already has an ID.
                        needsId = false;
                        if (args.length === 2 &&
                            parse.isFnExpression(args[1])) {
                            //Needs dependency scanning.
                            factoryNode = args[1];
                            depAction = 'scan';
                        } else {
                            depAction = 'skip';
                        }
                    } else {
                        //Unknown define entity, keep looking, even
                        //in the subtree for this node.
                        return;
                    }

                    range = {
                        foundId: foundId,
                        needsId: needsId,
                        depAction: depAction,
                        namespaceExists: namespaceExists,
                        node: node,
                        defineLoc: node.loc,
                        firstArgLoc: firstArgLoc,
                        factoryNode: factoryNode,
                        sourceUrlData: sourceUrlData
                    };

                    //Only transform ones that do not have IDs. If it has an
                    //ID but no dependency array, assume it is something like
                    //a phonegap implementation, that has its own internal
                    //define that cannot handle dependency array constructs,
                    //and if it is a named module, then it means it has been
                    //set for transport form.
                    if (range.needsId) {
                        if (foundAnon) {
                            logger.trace(path + ' has more than one anonymous ' +
                                'define. May be a built file from another ' +
                                'build system like, Ender. Skipping normalization.');
                            defineInfos = [];
                            return false;
                        } else {
                            foundAnon = range;
                            defineInfos.push(range);
                        }
                    } else if (depAction === 'scan') {
                        scanCount += 1;
                        if (scanCount > 1) {
                            //Just go back to an array that just has the
                            //anon one, since this is an already optimized
                            //file like the phonegap one.
                            if (!scanReset) {
                                defineInfos =  foundAnon ? [foundAnon] : [];
                                scanReset = true;
                            }
                        } else {
                            defineInfos.push(range);
                        }
                    }
                }
            });


            if (!defineInfos.length) {
                return applySourceUrl(contents);
            }

            //Reverse the matches, need to start from the bottom of
            //the file to modify it, so that the ranges are still true
            //further up.
            defineInfos.reverse();

            contentLines = contents.split('\n');

            modLine = function (loc, contentInsertion) {
                var startIndex = loc.start.column,
                //start.line is 1-based, not 0 based.
                lineIndex = loc.start.line - 1,
                line = contentLines[lineIndex];
                contentLines[lineIndex] = line.substring(0, startIndex) +
                                           contentInsertion +
                                           line.substring(startIndex,
                                                              line.length);
            };

            defineInfos.forEach(function (info) {
                var deps,
                    contentInsertion = '',
                    depString = '';

                //Do the modifications "backwards", in other words, start with the
                //one that is farthest down and work up, so that the ranges in the
                //defineInfos still apply. So that means deps, id, then namespace.
                if (info.needsId && moduleName) {
                    contentInsertion += "'" + moduleName + "',";
                }

                if (info.depAction === 'scan') {
                    deps = parse.getAnonDepsFromNode(info.factoryNode);

                    if (deps.length) {
                        depString = '[' + deps.map(function (dep) {
                            return "'" + dep + "'";
                        }) + ']';
                    } else {
                        depString = '[]';
                    }
                    depString +=  ',';

                    if (info.factoryNode) {
                        //Already have a named module, need to insert the
                        //dependencies after the name.
                        modLine(info.factoryNode.loc, depString);
                    } else {
                        contentInsertion += depString;
                    }
                }

                if (contentInsertion) {
                    modLine(info.firstArgLoc, contentInsertion);
                }

                //Do namespace last so that ui does not mess upthe parenRange
                //used above.
                if (namespace && !info.namespaceExists) {
                    modLine(info.defineLoc, namespace + '.');
                }

                //Notify any listener for the found info
                if (onFound) {
                    onFound(info);
                }
            });

            contents = contentLines.join('\n');

            return applySourceUrl(contents);
        },

        /**
         * Modify the contents of a require.config/requirejs.config call. This
         * call will LOSE any existing comments that are in the config string.
         *
         * @param  {String} fileContents String that may contain a config call
         * @param  {Function} onConfig Function called when the first config
         * call is found. It will be passed an Object which is the current
         * config, and the onConfig function should return an Object to use
         * as the config.
         * @return {String} the fileContents with the config changes applied.
         */
        modifyConfig: function (fileContents, onConfig) {
            var details = parse.findConfig(fileContents),
                config = details.config;

            if (config) {
                config = onConfig(config);
                if (config) {
                    return transform.serializeConfig(config,
                                              fileContents,
                                              details.range[0],
                                              details.range[1],
                                              {
                                                quote: details.quote
                                              });
                }
            }

            return fileContents;
        },

        serializeConfig: function (config, fileContents, start, end, options) {
            //Calculate base level of indent
            var indent, match, configString, outDentRegExp,
                baseIndent = '',
                startString = fileContents.substring(0, start),
                existingConfigString = fileContents.substring(start, end),
                lineReturn = existingConfigString.indexOf('\r') === -1 ? '\n' : '\r\n',
                lastReturnIndex = startString.lastIndexOf('\n');

            //Get the basic amount of indent for the require config call.
            if (lastReturnIndex === -1) {
                lastReturnIndex = 0;
            }

            match = baseIndentRegExp.exec(startString.substring(lastReturnIndex + 1, start));
            if (match && match[1]) {
                baseIndent = match[1];
            }

            //Calculate internal indentation for config
            match = indentRegExp.exec(existingConfigString);
            if (match && match[1]) {
                indent = match[1];
            }

            if (!indent || indent.length < baseIndent) {
                indent = '  ';
            } else {
                indent = indent.substring(baseIndent.length);
            }

            outDentRegExp = new RegExp('(' + lineReturn + ')' + indent, 'g');

            configString = transform.objectToString(config, {
                                                    indent: indent,
                                                    lineReturn: lineReturn,
                                                    outDentRegExp: outDentRegExp,
                                                    quote: options && options.quote
                                                });

            //Add in the base indenting level.
            configString = applyIndent(configString, baseIndent, lineReturn);

            return startString + configString + fileContents.substring(end);
        },

        /**
         * Tries converting a JS object to a string. This will likely suck, and
         * is tailored to the type of config expected in a loader config call.
         * So, hasOwnProperty fields, strings, numbers, arrays and functions,
         * no weird recursively referenced stuff.
         * @param  {Object} obj        the object to convert
         * @param  {Object} options    options object with the following values:
         *         {String} indent     the indentation to use for each level
         *         {String} lineReturn the type of line return to use
         *         {outDentRegExp} outDentRegExp the regexp to use to outdent functions
         *         {String} quote      the quote type to use, ' or ". Optional. Default is "
         * @param  {String} totalIndent the total indent to print for this level
         * @return {String}            a string representation of the object.
         */
        objectToString: function (obj, options, totalIndent) {
            var startBrace, endBrace, nextIndent,
                first = true,
                value = '',
                lineReturn = options.lineReturn,
                indent = options.indent,
                outDentRegExp = options.outDentRegExp,
                quote = options.quote || '"';

            totalIndent = totalIndent || '';
            nextIndent = totalIndent + indent;

            if (obj === null) {
                value = 'null';
            } else if (obj === undefined) {
                value = 'undefined';
            } else if (typeof obj === 'number' || typeof obj === 'boolean') {
                value = obj;
            } else if (typeof obj === 'string') {
                //Use double quotes in case the config may also work as JSON.
                value = quote + lang.jsEscape(obj) + quote;
            } else if (lang.isArray(obj)) {
                lang.each(obj, function (item, i) {
                    value += (i !== 0 ? ',' + lineReturn : '' ) +
                        nextIndent +
                        transform.objectToString(item,
                                                 options,
                                                 nextIndent);
                });

                startBrace = '[';
                endBrace = ']';
            } else if (lang.isFunction(obj) || lang.isRegExp(obj)) {
                //The outdent regexp just helps pretty up the conversion
                //just in node. Rhino strips comments and does a different
                //indent scheme for Function toString, so not really helpful
                //there.
                value = obj.toString().replace(outDentRegExp, '$1');
            } else {
                //An object
                lang.eachProp(obj, function (v, prop) {
                    value += (first ? '': ',' + lineReturn) +
                        nextIndent +
                        (keyRegExp.test(prop) ? prop : quote + lang.jsEscape(prop) + quote )+
                        ': ' +
                        transform.objectToString(v,
                                                 options,
                                                 nextIndent);
                    first = false;
                });
                startBrace = '{';
                endBrace = '}';
            }

            if (startBrace) {
                value = startBrace +
                        lineReturn +
                        value +
                        lineReturn + totalIndent +
                        endBrace;
            }

            return value;
        }
    };

    return transform;
});
