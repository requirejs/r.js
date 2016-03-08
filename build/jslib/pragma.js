/*jslint regexp: true, plusplus: true  */
/*global define: false */

define(['parse', 'logger'], function (parse, logger) {
    'use strict';
    function Temp() {}

    function create(obj, mixin) {
        Temp.prototype = obj;
        var temp = new Temp(), prop;

        //Avoid any extra memory hanging around
        Temp.prototype = null;

        if (mixin) {
            for (prop in mixin) {
                if (mixin.hasOwnProperty(prop) && !temp.hasOwnProperty(prop)) {
                    temp[prop] = mixin[prop];
                }
            }
        }

        return temp; // Object
    }

    var pragma = {
        conditionalRegExp: /(exclude|include)Start\s*\(\s*["'](\w+)["']\s*,(.*)\)/,
        useStrictRegExp: /(^|[^{]\r?\n)['"]use strict['"];/g,
        hasRegExp: /has\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        configRegExp: /(^|[^\.])(requirejs|require)(\.config)\s*\(/g,
        nsWrapRegExp: /\/\*requirejs namespace: true \*\//,
        apiDefRegExp: /var requirejs,\s*require,\s*define;/,
        defineCheckRegExp: /typeof(\s+|\s*\(\s*)define(\s*\))?\s*===?\s*["']function["']\s*&&\s*define\s*\.\s*amd/g,
        defineStringCheckRegExp: /typeof\s+define\s*===?\s*["']function["']\s*&&\s*define\s*\[\s*["']amd["']\s*\]/g,
        defineTypeFirstCheckRegExp: /\s*["']function["']\s*==(=?)\s*typeof\s+define\s*&&\s*define\s*\.\s*amd/g,
        defineJQueryRegExp: /typeof\s+define\s*===?\s*["']function["']\s*&&\s*define\s*\.\s*amd\s*&&\s*define\s*\.\s*amd\s*\.\s*jQuery/g,
        defineHasRegExp: /typeof\s+define\s*==(=)?\s*['"]function['"]\s*&&\s*typeof\s+define\.amd\s*==(=)?\s*['"]object['"]\s*&&\s*define\.amd/g,
        defineTernaryRegExp: /typeof\s+define\s*===?\s*['"]function["']\s*&&\s*define\s*\.\s*amd\s*\?\s*define/,
        defineExistsRegExp: /\s+typeof\s+define\s*!==?\s*['"]undefined["']\s*/,
        defineExistsAndAmdRegExp: /typeof\s+define\s*!==?\s*['"]undefined["']\s*&&\s*define\s*\.\s*amd\s*/,
        amdefineRegExp: /if\s*\(\s*typeof define\s*\!==\s*['"]function['"]\s*\)\s*\{\s*[^\{\}]+amdefine[^\{\}]+\}/g,

        removeStrict: function (contents, config) {
            return config.useStrict ? contents : contents.replace(pragma.useStrictRegExp, '$1');
        },

        namespace: function (fileContents, ns, onLifecycleName) {
            if (ns) {
                //Namespace require/define calls
                fileContents = fileContents.replace(pragma.configRegExp, '$1' + ns + '.$2$3(');


                fileContents = parse.renameNamespace(fileContents, ns);

                //Namespace define ternary use:
                fileContents = fileContents.replace(pragma.defineTernaryRegExp,
                                                    "typeof " + ns + ".define === 'function' && " + ns + ".define.amd ? " + ns + ".define");

                //Namespace define jquery use:
                fileContents = fileContents.replace(pragma.defineJQueryRegExp,
                                                    "typeof " + ns + ".define === 'function' && " + ns + ".define.amd && " + ns + ".define.amd.jQuery");

                //Namespace has.js define use:
                fileContents = fileContents.replace(pragma.defineHasRegExp,
                                                    "typeof " + ns + ".define === 'function' && typeof " + ns + ".define.amd === 'object' && " + ns + ".define.amd");

                //Namespace async.js define use:
                fileContents = fileContents.replace(pragma.defineExistsAndAmdRegExp,
                                                    "typeof " + ns + ".define !== 'undefined' && " + ns + ".define.amd");

                //Namespace define checks.
                //Do these ones last, since they are a subset of the more specific
                //checks above.
                fileContents = fileContents.replace(pragma.defineCheckRegExp,
                                                    "typeof " + ns + ".define === 'function' && " + ns + ".define.amd");
                fileContents = fileContents.replace(pragma.defineStringCheckRegExp,
                                                    "typeof " + ns + ".define === 'function' && " + ns + ".define['amd']");
                fileContents = fileContents.replace(pragma.defineTypeFirstCheckRegExp,
                                                    "'function' === typeof " + ns + ".define && " + ns + ".define.amd");
                fileContents = fileContents.replace(pragma.defineExistsRegExp,
                                                    "typeof " + ns + ".define !== 'undefined'");

                //Check for require.js with the require/define definitions
                if (pragma.apiDefRegExp.test(fileContents) &&
                    fileContents.indexOf("if (!" + ns + " || !" + ns + ".requirejs)") === -1) {
                    //Wrap the file contents in a typeof check, and a function
                    //to contain the API globals.
                    fileContents = "var " + ns + ";(function () { if (!" + ns + " || !" + ns + ".requirejs) {\n" +
                                    "if (!" + ns + ") { " + ns + ' = {}; } else { require = ' + ns + '; }\n' +
                                    fileContents +
                                    "\n" +
                                    ns + ".requirejs = requirejs;" +
                                    ns + ".require = require;" +
                                    ns + ".define = define;\n" +
                                    "}\n}());";
                }

                //Finally, if the file wants a special wrapper because it ties
                //in to the requirejs internals in a way that would not fit
                //the above matches, do that. Look for /*requirejs namespace: true*/
                if (pragma.nsWrapRegExp.test(fileContents)) {
                    //Remove the pragma.
                    fileContents = fileContents.replace(pragma.nsWrapRegExp, '');

                    //Alter the contents.
                    fileContents = '(function () {\n' +
                                   'var require = ' + ns + '.require,' +
                                   'requirejs = ' + ns + '.requirejs,' +
                                   'define = ' + ns + '.define;\n' +
                                   fileContents +
                                   '\n}());';
                }
            }

            return fileContents;
        },

        /**
         * processes the fileContents for some //>> conditional statements
         */
        process: function (fileName, fileContents, config, onLifecycleName, pluginCollector) {
            /*jslint evil: true */
            var foundIndex = -1, startIndex = 0, lineEndIndex, conditionLine,
                matches, type, marker, condition, isTrue, endRegExp, endMatches,
                endMarkerIndex, shouldInclude, startLength, lifecycleHas, deps,
                i, dep, moduleName, collectorMod,
                lifecyclePragmas, pragmas = config.pragmas, hasConfig = config.has,
                //Legacy arg defined to help in dojo conversion script. Remove later
                //when dojo no longer needs conversion:
                kwArgs = pragmas;

            //Mix in a specific lifecycle scoped object, to allow targeting
            //some pragmas/has tests to only when files are saved, or at different
            //lifecycle events. Do not bother with kwArgs in this section, since
            //the old dojo kwArgs were for all points in the build lifecycle.
            if (onLifecycleName) {
                lifecyclePragmas = config['pragmas' + onLifecycleName];
                lifecycleHas = config['has' + onLifecycleName];

                if (lifecyclePragmas) {
                    pragmas = create(pragmas || {}, lifecyclePragmas);
                }

                if (lifecycleHas) {
                    hasConfig = create(hasConfig || {}, lifecycleHas);
                }
            }

            //Replace has references if desired
            if (hasConfig) {
                fileContents = fileContents.replace(pragma.hasRegExp, function (match, test) {
                    if (hasConfig.hasOwnProperty(test)) {
                        return !!hasConfig[test];
                    }
                    return match;
                });
            }

            if (!config.skipPragmas) {

                while ((foundIndex = fileContents.indexOf("//>>", startIndex)) !== -1) {
                    //Found a conditional. Get the conditional line.
                    lineEndIndex = fileContents.indexOf("\n", foundIndex);
                    if (lineEndIndex === -1) {
                        lineEndIndex = fileContents.length - 1;
                    }

                    //Increment startIndex past the line so the next conditional search can be done.
                    startIndex = lineEndIndex + 1;

                    //Break apart the conditional.
                    conditionLine = fileContents.substring(foundIndex, lineEndIndex + 1);
                    matches = conditionLine.match(pragma.conditionalRegExp);
                    if (matches) {
                        type = matches[1];
                        marker = matches[2];
                        condition = matches[3];
                        isTrue = false;
                        //See if the condition is true.
                        try {
                            isTrue = !!eval("(" + condition + ")");
                        } catch (e) {
                            throw "Error in file: " +
                                   fileName +
                                   ". Conditional comment: " +
                                   conditionLine +
                                   " failed with this error: " + e;
                        }

                        //Find the endpoint marker.
                        endRegExp = new RegExp('\\/\\/\\>\\>\\s*' + type + 'End\\(\\s*[\'"]' + marker + '[\'"]\\s*\\)', "g");
                        endMatches = endRegExp.exec(fileContents.substring(startIndex, fileContents.length));
                        if (endMatches) {
                            endMarkerIndex = startIndex + endRegExp.lastIndex - endMatches[0].length;

                            //Find the next line return based on the match position.
                            lineEndIndex = fileContents.indexOf("\n", endMarkerIndex);
                            if (lineEndIndex === -1) {
                                lineEndIndex = fileContents.length - 1;
                            }

                            //Should we include the segment?
                            shouldInclude = ((type === "exclude" && !isTrue) || (type === "include" && isTrue));

                            //Remove the conditional comments, and optionally remove the content inside
                            //the conditional comments.
                            startLength = startIndex - foundIndex;
                            fileContents = fileContents.substring(0, foundIndex) +
                                (shouldInclude ? fileContents.substring(startIndex, endMarkerIndex) : "") +
                                fileContents.substring(lineEndIndex + 1, fileContents.length);

                            //Move startIndex to foundIndex, since that is the new position in the file
                            //where we need to look for more conditionals in the next while loop pass.
                            startIndex = foundIndex;
                        } else {
                            throw "Error in file: " +
                                  fileName +
                                  ". Cannot find end marker for conditional comment: " +
                                  conditionLine;

                        }
                    }
                }
            }

            //If need to find all plugin resources to optimize, do that now,
            //before namespacing, since the namespacing will change the API
            //names.
            //If there is a plugin collector, scan the file for plugin resources.
            if (config.optimizeAllPluginResources && pluginCollector) {
                try {
                    deps = parse.findDependencies(fileName, fileContents);
                    if (deps.length) {
                        for (i = 0; i < deps.length; i++) {
                            dep = deps[i];
                            if (dep.indexOf('!') !== -1) {
                                moduleName = dep.split('!')[0];
                                collectorMod = pluginCollector[moduleName];
                                if (!collectorMod) {
                                 collectorMod = pluginCollector[moduleName] = [];
                                }
                                collectorMod.push(dep);
                            }
                        }
                    }
                } catch (eDep) {
                    logger.error('Parse error looking for plugin resources in ' +
                                 fileName + ', skipping.');
                }
            }

            //Strip amdefine use for node-shared modules.
            if (!config.keepAmdefine) {
                fileContents = fileContents.replace(pragma.amdefineRegExp, '');
            }

            //Do namespacing
            if (onLifecycleName === 'OnSave' && config.namespace) {
                fileContents = pragma.namespace(fileContents, config.namespace, onLifecycleName);
            }


            return pragma.removeStrict(fileContents, config);
        }
    };

    return pragma;
});
