/**
 * @license Copyright (c) 2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint */
/*global define */

define([ './esprima', './parse', 'logger', 'lang'], function (esprima, parse, logger, lang) {
    'use strict';
    var transform;

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
            tokens.forEach(function (token, i) {
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
                        if (lastRange) {
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
                            throw new Error(path +
                                ' has two many anonymous modules in it.');
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
            });

            if (options.useSourceUrl) {
                contents = 'eval("' + lang.jsEscape(contents) +
                    '\\n//@ sourceURL=' + (path.indexOf('/') === 0 ? '' : '/') +
                    path +
                    '");\n';
            }

            return contents;
        }
    });
});