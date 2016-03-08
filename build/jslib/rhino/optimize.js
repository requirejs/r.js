/*jslint sloppy: true, plusplus: true */
/*global define, java, Packages, com */

define(['logger', 'env!env/file'], function (logger, file) {

    //Add .reduce to Rhino so UglifyJS can run in Rhino,
    //inspired by https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
    //but rewritten for brevity, and to be good enough for use by UglifyJS.
    if (!Array.prototype.reduce) {
        Array.prototype.reduce = function (fn /*, initialValue */) {
            var i = 0,
                length = this.length,
                accumulator;

            if (arguments.length >= 2) {
                accumulator = arguments[1];
            } else {
                if (length) {
                    while (!(i in this)) {
                        i++;
                    }
                    accumulator = this[i++];
                }
            }

            for (; i < length; i++) {
                if (i in this) {
                    accumulator = fn.call(undefined, accumulator, this[i], i, this);
                }
            }

            return accumulator;
        };
    }

    var JSSourceFilefromCode, optimize,
        mapRegExp = /"file":"[^"]+"/;

    //Bind to Closure compiler, but if it is not available, do not sweat it.
    try {
        // Try older closure compiler that worked on Java 6
        JSSourceFilefromCode = java.lang.Class.forName('com.google.javascript.jscomp.JSSourceFile').getMethod('fromCode', [java.lang.String, java.lang.String]);
    } catch (e) {
        try {
            // Try for newer closure compiler that needs Java 7+
            JSSourceFilefromCode = java.lang.Class.forName('com.google.javascript.jscomp.SourceFile').getMethod('fromCode', [java.lang.String, java.lang.String]);
        } catch (e) {
            try {
                // Try Nashorn style
                var stringClass = Java.type("java.lang.String").class;
                JSSourceFilefromCode = Java.type("com.google.javascript.jscomp.SourceFile").class.getMethod("fromCode", [stringClass, stringClass]);
            } catch (e) {}
        }
    }

    //Helper for closure compiler, because of weird Java-JavaScript interactions.
    function closurefromCode(filename, content) {
        return JSSourceFilefromCode.invoke(null, [filename, content]);
    }


    function getFileWriter(fileName, encoding) {
        var outFile = new java.io.File(fileName), outWriter, parentDir;

        parentDir = outFile.getAbsoluteFile().getParentFile();
        if (!parentDir.exists()) {
            if (!parentDir.mkdirs()) {
                throw "Could not create directory: " + parentDir.getAbsolutePath();
            }
        }

        if (encoding) {
            outWriter = new java.io.OutputStreamWriter(new java.io.FileOutputStream(outFile), encoding);
        } else {
            outWriter = new java.io.OutputStreamWriter(new java.io.FileOutputStream(outFile));
        }

        return new java.io.BufferedWriter(outWriter);
    }

    optimize = {
        closure: function (fileName, fileContents, outFileName, keepLines, config) {
            config = config || {};
            var result, mappings, optimized, compressed, baseName, writer,
                outBaseName, outFileNameMap, outFileNameMapContent,
                srcOutFileName, concatNameMap,
                jscomp = Packages.com.google.javascript.jscomp,
                flags = Packages.com.google.common.flags,
                //Set up source input
                jsSourceFile = closurefromCode(String(fileName), String(fileContents)),
                sourceListArray = new java.util.ArrayList(),
                externList = new java.util.ArrayList(),
                options, option, FLAG_compilation_level, compiler, externExportsPath,
                Compiler = Packages.com.google.javascript.jscomp.Compiler,
                CommandLineRunner = Packages.com.google.javascript.jscomp.CommandLineRunner;

            logger.trace("Minifying file: " + fileName);

            baseName = (new java.io.File(fileName)).getName();

            //Set up options
            options = new jscomp.CompilerOptions();
            for (option in config.CompilerOptions) {
                // options are false by default and jslint wanted an if statement in this for loop
                if (config.CompilerOptions[option]) {
                    options[option] = config.CompilerOptions[option];
                }

            }
            options.prettyPrint = keepLines || options.prettyPrint;

            FLAG_compilation_level = jscomp.CompilationLevel[config.CompilationLevel || 'SIMPLE_OPTIMIZATIONS'];
            FLAG_compilation_level.setOptionsForCompilationLevel(options);

            if (config.generateSourceMaps) {
                mappings = new java.util.ArrayList();

                mappings.add(new com.google.javascript.jscomp.SourceMap.LocationMapping(fileName, baseName + ".src.js"));
                options.setSourceMapLocationMappings(mappings);
                options.setSourceMapOutputPath(fileName + ".map");
            }

            //If we need to pass an externs file to Closure so that it does not create aliases
            //for certain symbols, do so here.
            externList.addAll(CommandLineRunner.getDefaultExterns());
            if (config.externExportsPath) {
                externExportsPath = config.externExportsPath;
                externList.add(jscomp.SourceFile.fromFile(externExportsPath));
            }

            //Trigger the compiler
            Compiler.setLoggingLevel(Packages.java.util.logging.Level[config.loggingLevel || 'WARNING']);
            compiler = new Compiler();

            //fill the sourceArrrayList; we need the ArrayList because the only overload of compile
            //accepting the getDefaultExterns return value (a List) also wants the sources as a List
            sourceListArray.add(jsSourceFile);

            result = compiler.compile(externList, sourceListArray, options);
            if (result.success) {
                optimized = String(compiler.toSource());

                if (config.generateSourceMaps && result.sourceMap && outFileName) {
                    outBaseName = (new java.io.File(outFileName)).getName();

                    srcOutFileName = outFileName + ".src.js";
                    outFileNameMap = outFileName + ".map";

                    //If previous .map file exists, move it to the ".src.js"
                    //location. Need to update the sourceMappingURL part in the
                    //src.js file too.
                    if (file.exists(outFileNameMap)) {
                        concatNameMap = outFileNameMap.replace(/\.map$/, '.src.js.map');
                        file.saveFile(concatNameMap, file.readFile(outFileNameMap));
                        file.saveFile(srcOutFileName,
                                      fileContents.replace(/\/\# sourceMappingURL=(.+).map/,
                                                           '/# sourceMappingURL=$1.src.js.map'));
                    } else {
                        file.saveUtf8File(srcOutFileName, fileContents);
                    }

                    writer = getFileWriter(outFileNameMap, "utf-8");
                    result.sourceMap.appendTo(writer, outFileName);
                    writer.close();

                    //Not sure how better to do this, but right now the .map file
                    //leaks the full OS path in the "file" property. Manually
                    //modify it to not do that.
                    file.saveFile(outFileNameMap,
                        file.readFile(outFileNameMap).replace(mapRegExp, '"file":"' + baseName + '"'));

                    fileContents = optimized + "\n//# sourceMappingURL=" + outBaseName + ".map";
                } else {
                    fileContents = optimized;
                }
                return fileContents;
            } else {
                throw new Error('Cannot closure compile file: ' + fileName + '. Skipping it.');
            }

            return fileContents;
        }
    };

    return optimize;
});