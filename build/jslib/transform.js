/**
 * @license Copyright (c) 2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint */

define([ './esprima', './parse', 'logger', 'lang'],
function (esprima,     parse,     logger,   lang) {

    'use strict';
    var transform;

    return (transform = {
        toTransport: function (namespace, moduleName, path, contents, onFound, options) {
            options = options || {};

            var defineRanges = [],
                contentInsertion = '',
                depString = '',
                useSourceUrl = options.useSourceUrl,
                tokens, info, deps, urlData,
                functionContent, functionBody;

            try {
                tokens = esprima.parse(contents, {
                        tokens: true,
                        range: true
                    }).tokens;
            } catch(e) {
                logger.trace('toTransport skipping ' + path + ': ' +
                             e.toString());
                return contents;
            }

            //Find the define calls and their position in the files.
            tokens.forEach(function (token, i) {
                var namespaceExists = false,
                    prev, prev2, next, next2, next3, next4,
                    needsId, depAction, nameCommaRange, foundId,
                    sourceUrlData;

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

                    next2 = tokens[i + 2];
                    if (!next2) {
                        return;
                    }

                    //Figure out if this needs a named define call.
                    if (next2.type === 'Punctuator' &&
                        next2.value === '[') {
                        //Dependency array
                        needsId = true;
                        depAction = 'skip';

                        if (useSourceUrl) {
                            sourceUrlData = transform.getSourceUrlData(tokens, i + 2);
                        }
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

                        if (useSourceUrl) {
                            sourceUrlData = transform.getSourceUrlData(tokens, i + 2);
                        }
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

                            if (next4.type === 'Keyword' &&
                                next4.value === 'function'
                                && useSourceUrl) {
                                sourceUrlData = transform.getSourceUrlData(tokens, i + 4);
                            }
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
                    } else {
                        //Not a match, skip it.
                        return;
                    }

                    defineRanges.push({
                        foundId: foundId,
                        needsId: needsId,
                        depAction: depAction,
                        namespaceExists: namespaceExists,
                        defineRange: token.range,
                        parenRange: next.range,
                        nameCommaRange: nameCommaRange,
                        sourceUrlData: sourceUrlData
                    });
                }
            });

            //Only do naming and dependency injection if there is one define
            //call in the file.
            if (defineRanges.length > 1) {
                return contents;
            }
            if (!defineRanges.length) {
                return contents;
            }

            info = defineRanges[0];
            urlData = info.sourceUrlData;

            //Do the modifications "backwards", in other words, start with the
            //one that is farthest down and work up, so that the ranges in the
            //defineRanges still apply. So that means deps, id, then namespace.

            if (useSourceUrl && urlData) {
                //First, convert the function to a Function string, if
                //useSourceUrl is in play.
                functionBody = lang.jsEscape(contents.substring(urlData.bodyStart[1], urlData.bodyEnd[0]) +
                                             '\r\n//@ sourceURL=' + (path.indexOf('/') === 0 ? '' : '/') + path);

                functionContent = 'Function([' +
                                   (urlData.args.length ? '"' + urlData.args.join('","') + '"' : '') +
                                  '], "' + functionBody + '")';

                contents = contents.substring(0, urlData.functionStart[0]) +
                               functionContent +
                               contents.substring(urlData.bodyEnd[1],
                                              contents.length);
            }


            if (info.needsId && moduleName) {
                contentInsertion += "'" + moduleName + "',";
            }

            if (info.depAction === 'scan') {
                deps = parse.getAnonDeps(path, contents);

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
            } else if (info.depAction === 'empty') {
                contentInsertion += '[],';
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

            return contents;
        },

        getSourceUrlData: function (tokens, i) {
            var data = {},
                foundIt = false,
                curlyCount = 1,
                //This strange line for jslint
                init = i,
                token;

            for (i = init; i < tokens.length && !foundIt; i += 1) {
                token = tokens[i];

                //Look for starting function if it was not already found.
                if (!data.args && token.type === 'Keyword' && token.value === 'function') {
                    data.functionStart = token.range;

                    //Bingo. Now start finding the args.
                    data.args = [];
                    for (i += 1; i < tokens.length; i += 1) {
                        token = tokens[i];
                        if (token.type === 'Punctuator' && token.value === ')') {
                            //Found the end of the args
                            break;
                        }

                        if (token.type === 'Identifier') {
                            data.args.push(token.value);
                        }
                    }
                }

                if (data.args && token.type === 'Punctuator' && token.value === '{') {
                    //Found the start position
                    data.bodyStart = token.range;
                    for (i += 1; i < tokens.length; i += 1) {
                        token = tokens[i];
                        if (token.type === 'Punctuator') {
                            if (token.value === '{') {
                                curlyCount += 1;
                            } else if (token.value === '}') {
                                curlyCount -= 1;
                                if (curlyCount === 0) {
                                    data.bodyEnd = token.range;
                                    foundIt = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            return foundIt ? data : undefined;
        }
    });
});