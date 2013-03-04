/**
 * @license Copyright (c) 2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint */
/*global define */

define([ './esprima', './parse', 'logger', 'lang'], function (esprima, parse, logger, lang) {
    'use strict';
    var transform,
        baseIndentRegExp = /^([ \t]+)/,
        indentRegExp = /\{[\r\n]+([ \t]+)/,
        bulkIndentRegExps = {
            '\n': /\n/g,
            '\r\n': /\r\n/g
        };

    function applyIndent(str, indent, lineReturn) {
        var regExp = bulkIndentRegExps[lineReturn];
        return str.replace(regExp, '$&' + indent);
    }

    return (transform = {
        toTransport: function (namespace, moduleName, path, contents, onFound, options) {
            options = options || {};

            var tokens, foundAnon, deps, lastRange, parenCount, inDefine,
                scanCount = 0,
                scanReset = false,
                defineRanges = [],
                contentInsertion = '',
                depString = '';

            try {
                tokens = esprima.parse(contents, {
                    tokens: true,
                    range: true
                }).tokens;
            } catch (e) {
                logger.trace('toTransport skipping ' + path + ': ' +
                             e.toString());
                return contents;
            }

            //Find the define calls and their position in the files.
            tokens.some(function (token, i) {
                var prev, prev2, next, next2, next3, next4, next5,
                    needsId, depAction, nameCommaRange, foundId,
                    sourceUrlData, range,
                    namespaceExists = false;

                if (inDefine && token.type === 'Punctuator') {
                    //Looking for the end of the define call.
                    if (token.value === '(') {
                        parenCount += 1;
                    } else if (token.value === ')') {
                        parenCount -= 1;
                    }

                    if (parenCount === 0) {
                        inDefine = false;

                        //Found the end of the define call. Hold onto
                        //it.
                        lastRange = defineRanges.length &&
                            defineRanges[defineRanges.length - 1];
                        if (lastRange && !lastRange.defineEndRange) {
                            lastRange.defineEndRange = token.range;
                        }
                    }
                }

                if (token.type === 'Identifier' && token.value === 'define') {
                    //Possible match. Do not want something.define calls
                    //though, and only defines follow by a paren
                    prev = tokens[i - 1];
                    next = tokens[i + 1];

                    if (prev && prev.type === 'Punctuator' &&
                            prev.value === '.') {
                        //a define on a sub-object, not a top level
                        //define() call. If the sub object is the
                        //namespace, then it is ok.
                        prev2 = tokens[i - 2];
                        if (!prev2) {
                            return;
                        }

                        //If the prev2 does not match namespace, then bail.
                        if (!namespace || prev2.type !== 'Identifier' ||
                                prev2.value !== namespace) {
                            return;
                        } else if (namespace) {
                            namespaceExists = true;
                        }
                    }

                    if (!next || next.type !== 'Punctuator' ||
                            next.value !== '(') {
                       //Not a define() function call. Bail.
                        return;
                    }

                    if (prev && prev.type === 'Keyword' &&
                            prev.value === 'function') {
                        //A declaration of a define function. Skip it.
                        return;
                    }

                    next2 = tokens[i + 2];
                    if (!next2) {
                        return;
                    }

                    //Figure out if this needs a named define call.
                    if (next2.type === 'Punctuator' && next2.value === '[') {
                        //Dependency array
                        needsId = true;
                        depAction = 'skip';
                    } else if (next2.type === 'Punctuator' &&
                            next2.value === '{') {
                        //Object literal
                        needsId = true;
                        depAction = 'skip';
                    } else if (next2.type === 'Keyword' &&
                               next2.value === 'function') {
                        //function
                        needsId = true;
                        depAction = 'scan';
                    } else if (next2.type === 'String') {
                        //Named module
                        needsId = false;

                        //The value includes the quotes around the string,
                        //so remove them.
                        foundId = next2.value.substring(1,
                                                        next2.value.length - 1);

                        //assumed it does not need dependencies injected

                        //If next argument is a function it means we need
                        //dependency scanning.
                        next3 = tokens[i + 3];
                        next4 = tokens[i + 4];
                        if (!next3 || !next4) {
                            return;
                        }

                        if (next3.type === 'Punctuator' &&
                                next3.value === ',' &&
                                next4.type === 'Keyword' &&
                                next4.value === 'function') {
                            depAction = 'scan';
                            nameCommaRange = next3.range;
                        } else {
                            depAction = 'skip';
                        }
                    } else if (next2.type === 'Identifier') {
                        //May be the define(factory); type.
                        next3 = tokens[i + 3];
                        if (!next3) {
                            return;
                        }
                        if (next3.type === 'Punctuator' &&
                                next3.value === ')') {
                            needsId = true;
                            depAction = 'empty';
                        } else {
                            return;
                        }
                    } else if (next2.type === 'Numeric') {
                        //May be the define(12345); type.
                        next3 = tokens[i + 3];
                        if (!next3) {
                            return;
                        }
                        if (next3.type === 'Punctuator' &&
                                next3.value === ')') {
                            needsId = true;
                            depAction = 'skip';
                        } else {
                            return;
                        }
                    } else if (next2.type === 'Punctuator' &&
                               next2.value === '-') {
                        //May be the define(-12345); type.
                        next3 = tokens[i + 3];
                        if (!next3) {
                            return;
                        }
                        if (next3.type === 'Numeric') {
                            next4 = tokens[i + 4];
                            if (!next4) {
                                return;
                            }
                            if (next4.type === 'Punctuator' &&
                                    next4.value === ')') {
                                needsId = true;
                                depAction = 'skip';
                            } else {
                                return;
                            }
                        } else {
                            return;
                        }
                    } else if (next2.type === 'Keyword' && next2.value === 'this') {
                        //May be the define(this.key); type
                        next3 = tokens[i + 3];
                        next4 = tokens[i + 4];
                        next5 = tokens[i + 5];
                        if (!next3 || !next4 || !next5) {
                            return;
                        }

                        if (next3.type === 'Punctuator' && next3.value === '.' &&
                                next4.type === 'Identifier' &&
                                next5.type === 'Punctuator' && next5.value === ')') {
                            needsId = true;
                            depAction = 'empty';
                        } else {
                            return;
                        }
                    } else {
                        //Not a match, skip it.
                        return;
                    }

                    //A valid define call. Need to find the end, start counting
                    //parentheses.
                    inDefine = true;
                    parenCount = 0;

                    range = {
                        foundId: foundId,
                        needsId: needsId,
                        depAction: depAction,
                        namespaceExists: namespaceExists,
                        defineRange: token.range,
                        parenRange: next.range,
                        nameCommaRange: nameCommaRange,
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
                            defineRanges = [];
                            return true;
                        } else {
                            foundAnon = range;
                            defineRanges.push(range);
                        }
                    } else if (depAction === 'scan') {
                        scanCount += 1;
                        if (scanCount > 1) {
                            //Just go back to an array that just has the
                            //anon one, since this is an already optimized
                            //file like the phonegap one.
                            if (!scanReset) {
                                defineRanges =  foundAnon ? [foundAnon] : [];
                                scanReset = true;
                            }
                        } else {
                            defineRanges.push(range);
                        }
                    }
                }
            });

            if (!defineRanges.length) {
                return contents;
            }

            //Reverse the matches, need to start from the bottom of
            //the file to modify it, so that the ranges are still true
            //further up.
            defineRanges.reverse();

            defineRanges.forEach(function (info) {
                //Do the modifications "backwards", in other words, start with the
                //one that is farthest down and work up, so that the ranges in the
                //defineRanges still apply. So that means deps, id, then namespace.

                if (info.needsId && moduleName) {
                    contentInsertion += "'" + moduleName + "',";
                }

                if (info.depAction === 'scan') {
                    deps = parse.getAnonDeps(path, contents.substring(info.defineRange[0], info.defineEndRange[1]));

                    if (deps.length) {
                        depString = '[' + deps.map(function (dep) {
                            return "'" + dep + "'";
                        }) + ']';
                    } else {
                        depString = '[]';
                    }
                    depString +=  ',';

                    if (info.nameCommaRange) {
                        //Already have a named module, need to insert the
                        //dependencies after the name.
                        contents = contents.substring(0, info.nameCommaRange[1]) +
                                   depString +
                                   contents.substring(info.nameCommaRange[1],
                                                  contents.length);
                    } else {
                        contentInsertion +=  depString;
                    }
                }

                if (contentInsertion) {
                    contents = contents.substring(0, info.parenRange[1]) +
                               contentInsertion +
                               contents.substring(info.parenRange[1],
                                                  contents.length);
                }

                //Do namespace last so that ui does not mess upthe parenRange
                //used above.
                if (namespace && !info.namespaceExists) {
                    contents = contents.substring(0, info.defineRange[0]) +
                               namespace + '.' +
                               contents.substring(info.defineRange[0],
                                                  contents.length);
                }

                //Notify any listener for the found info
                if (onFound) {
                    onFound(info);
                }
            });

            if (options.useSourceUrl) {
                contents = 'eval("' + lang.jsEscape(contents) +
                    '\\n//@ sourceURL=' + (path.indexOf('/') === 0 ? '' : '/') +
                    path +
                    '");\n';
            }

            return contents;
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
                                              details.range[1]);
                }
            }

            return fileContents;
        },

        serializeConfig: function (config, fileContents, start, end) {
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

            configString = transform.objectToString(config,
                                                    indent,
                                                    lineReturn,
                                                    outDentRegExp);

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
         * @param  {String} indent     the indentation to use for each level
         * @param  {String} lineReturn the type of line return to use
         * @param  {outDentRegExp} outDentRegExp the regexp to use to outdent functions
         * @param  {String} totalIndent the total indent to print for this level
         * @return {String}            a string representation of the object.
         */
        objectToString: function (obj, indent, lineReturn, outDentRegExp, totalIndent) {
            var startBrace, endBrace, nextIndent,
                first = true,
                value = '';

            totalIndent = totalIndent || '';
            nextIndent = totalIndent + indent;

            if (obj === null) {
                value = 'null';
            } else if (obj === undefined) {
                value = 'undefined';
            } else if (typeof obj === 'number') {
                value = obj;
            } else if (typeof obj === 'string') {
                //Use double quotes in case the config may also work as JSON.
                value = '"' + lang.jsEscape(obj) + '"';
            } else if (lang.isArray(obj)) {
                lang.each(obj, function (item, i) {
                    value += (i !== 0 ? ',' + lineReturn : '' ) +
                        nextIndent +
                        transform.objectToString(item,
                                                 indent,
                                                 lineReturn,
                                                 outDentRegExp,
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
                        '"' + lang.jsEscape(prop) + '": ' +
                        transform.objectToString(v,
                                                 indent,
                                                 lineReturn,
                                                 outDentRegExp,
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
    });
});