/*jslint plusplus: true, nomen: true */
/*global define: false, require: false, doh: false */

define(['build', 'env!env/file', 'env', 'lang'], function (build, file, env, lang) {
    'use strict';

    //Remove any old builds
    file.deleteFile("builds");

    function c(fileName) {
        return file.readFile(fileName);
    }

    //Remove line returns to make comparisons easier.
    function nol(contents) {
        return contents.replace(/[\r\n]/g, "");
    }

    //Remove \n and \r string literals, since rhino and node
    //do not always agree on what was read from disk, if a
    //trailing \n should be in there. After an optimization,
    //the text file can write out modules with these \r or \n
    //strings.
    function noSlashRn(contents) {
        return contents.replace(/\\n|\\r/g, '');
    }

    function sourcemapEquals(t, expected, actual) {
        var expectedJson = JSON.parse(expected),
            actualJson = JSON.parse(actual),
            index,
            segmentIndex,
            expectedMappings,
            actualMappings,
            expectedLine,
            actualLine;
        t.is(expectedJson.version, actualJson.version, "version properties differ");
        t.is(expectedJson.file, actualJson.file, "file properties differ");
        t.is(expectedJson.sourceRoot, actualJson.sourceRoot, "sourceRoot properties differ");
        t.is(expectedJson.sources, actualJson.sources, "sources properties differ");
        t.is((expectedJson.sourcesContent || []).length, (actualJson.sourcesContent || []).length, "sourcesContent array lengths differ");
        if (expectedJson.sourcesContent && actualJson.sourcesContent && expectedJson.sourcesContent.length === actualJson.sourcesContent.length) {
            for (index = 0; index < expectedJson.sourcesContent.length; index++) {
                t.is(noSlashRn(nol(expectedJson.sourcesContent[index])), noSlashRn(nol(actualJson.sourcesContent[index])), "sourcesContent[" + index + "] properties differ");
            }
        }
        t.is(expectedJson.names, actualJson.names, "names properties differ");
        if (typeof expectedJson.mappings === 'string' && typeof actualJson.mappings === 'string') {
            expectedMappings = expectedJson.mappings.split(";");
            actualMappings = actualJson.mappings.split(";");
            t.is(expectedMappings.length, actualMappings.length, "mappings group counts differ");
            if (expectedMappings.length === actualMappings.length) {
                for (index = 0; index < expectedMappings.length; index++) {
                    expectedLine = expectedMappings[index].split(",");
                    actualLine = actualMappings[index].split(",");
                    t.is(expectedLine.length, actualLine.length, "mapping arrays differ in segment count at group index " + index);
                    if (expectedLine.length === actualLine.length) {
                        for (segmentIndex = 0; segmentIndex < expectedLine.length; segmentIndex++) {
                            t.is(expectedLine[segmentIndex], actualLine[segmentIndex], "mapping arrays differ at group index " + index + ", segment index " + segmentIndex);
                        }
                    }
                }
            }
        } else {
            t.is(expectedJson.mappings, actualJson.mappings, "mappings properties differ");
        }
    }

    //Do a build of the text plugin to get any pragmas processed.
    build(["name=text", "baseUrl=../../../text", "out=builds/text.js", "optimize=none"]);

    //Reset build state for next run.
    require._buildReset();

    var requireTextContents = c("builds/text.js"),
        oneResult = [
            c("../../../requirejs/tests/two.js"),
            c("../../../requirejs/tests/one.js"),
            ";",
            c("../../../requirejs/tests/dimple.js")
        ].join("");

    doh.register("buildOneCssFile",
        [
            function buildOneCssFile(t) {
                build(["cssIn=css/sub/sub1.css", "out=builds/sub1.css"]);

                t.is(nol(c("cssTestCompare.css")), nol(c("builds/sub1.css")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildOneJsFile",
        [
            function buildOneJsFile(t) {
                build(["name=one", "include=dimple", "out=builds/outSingle.js",
                       "baseUrl=../../../requirejs/tests", "optimize=none"]);

                t.is(nol(oneResult), nol(c("builds/outSingle.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildOneJsFileOnlyInclude",
        [
            function buildOneJsFileOnlyInclude(t) {
                build(["include=one,dimple", "out=builds/outSingleOnlyInclude.js",
                       "baseUrl=../../../requirejs/tests", "optimize=none"]);

                t.is(nol(oneResult), nol(c("builds/outSingleOnlyInclude.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();



    doh.register("buildOneJsFileWrapped",
        [
            function buildOneJsFile(t) {
                build(["name=one", "include=dimple", "out=builds/outSingleWrap.js",
                       "baseUrl=../../../requirejs/tests", "optimize=none",
                       "wrap.start=START", "wrap.end=END"]);

                t.is(nol("START" + oneResult + "END"), nol(c("builds/outSingleWrap.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildOneJsFileWrappedArray",
        [
            function buildOneJsFileWrappedArray(t) {
                build(["name=one", "include=dimple", "out=builds/outSingleWrapArray.js",
                       "baseUrl=../../../requirejs/tests", "optimize=none",
                       "wrap.startFile=support/wrap/pre1.js,support/wrap/pre2.js",
                       "wrap.endFile=support/wrap/post1.js,support/wrap/post2.js"]);

                t.is(nol("//pre1.js//pre2.js" + oneResult + "//post1.js//post2.js"),
                     nol(c("builds/outSingleWrapArray.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildOneJsFileWrappedTrue",
        [
            function buildOneJsFile(t) {
                build(["name=one", "include=dimple", "out=builds/outSingleWrapTrue.js",
                       "baseUrl=../../../requirejs/tests", "optimize=none",
                       "wrap=true"]);

                t.is(nol("(function () {" + oneResult + "}());"), nol(c("builds/outSingleWrapTrue.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildOneJsFileWrappedFile",
        [
            function buildOneJsFile(t) {
                build(["name=one", "include=dimple", "out=builds/outSingleWrap.js",
                       "baseUrl=../../../requirejs/tests", "optimize=none",
                       "wrap.startFile=start.frag", "wrap.endFile=end.frag"]);

                t.is(nol(c("start.frag") + oneResult + c("end.frag")), nol(c("builds/outSingleWrap.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildWrapBothArray",
        [
            function buildWrapBothArray(t) {

                file.deleteFile("lib/wrap/outBothArray.js");

                build(["lib/wrap/buildBothArray.js"]);

                t.is(nol(c("lib/wrap/expectedBothArray.js")),
                     nol(c("lib/wrap/outBothArray.js")));

                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildWrapOnlyEnd",
        [
            function buildWrapOnlyEnd(t) {

                file.deleteFile("lib/wrap/outOnlyEnd.js");

                build(["lib/wrap/buildOnlyEnd.js"]);

                t.is(nol(c("lib/wrap/expectedOnlyEnd.js")),
                     nol(c("lib/wrap/outOnlyEnd.js")));

                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildWrapOnlyEndArray",
        [
            function buildWrapOnlyEndArray(t) {

                file.deleteFile("lib/wrap/outOnlyEndArray.js");

                build(["lib/wrap/buildOnlyEndArray.js"]);

                t.is(nol(c("lib/wrap/expectedOnlyEndArray.js")),
                     nol(c("lib/wrap/outOnlyEndArray.js")));

                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildWrapOnlyStart",
        [
            function buildWrapOnlyStart(t) {

                file.deleteFile("lib/wrap/outOnlyStart.js");

                build(["lib/wrap/buildOnlyStart.js"]);

                t.is(nol(c("lib/wrap/expectedOnlyStart.js")),
                     nol(c("lib/wrap/outOnlyStart.js")));

                require._buildReset();
            }
        ]
    );
    doh.run();


    doh.register("buildWrapOnlyStartArray",
        [
            function buildWrapOnlyStartArray(t) {

                file.deleteFile("lib/wrap/outOnlyStartArray.js");

                build(["lib/wrap/buildOnlyStartArray.js"]);

                t.is(nol(c("lib/wrap/expectedOnlyStartArray.js")),
                     nol(c("lib/wrap/outOnlyStartArray.js")));

                require._buildReset();
            }
        ]
    );
    doh.run();


    doh.register("buildSimple",
        [
            function buildSimple(t) {
                //Do the build
                build(["simple.build.js"]);

                t.is(nol(oneResult), nol(c("builds/simple/one.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildSimpleOverride",
        [
            function buildSimple(t) {
                //Do the build
                build(["simple.build.js", "dir=builds/simpleOverride"]);

                t.is(nol(oneResult), nol(c("builds/simpleOverride/one.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();


    doh.register("buildSimpleCommandLineName",
        [
            function buildSimpleCommandLineName(t) {
                //Do the build
                build([
                    "baseUrl=../../../requirejs/tests",
                    "optimize=none",
                    "dir=builds/simpleCommandLineName",
                    "name=one",
                    "include=dimple"
                ]);

                t.is(nol(oneResult), nol(c("builds/simpleCommandLineName/one.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();


    doh.register("buildExcludeShallow",
        [
            function buildExcludeShallow(t) {
                build(["name=uno", "excludeShallow=dos", "out=builds/unoExcludeShallow.js",
                       "baseUrl=../../../requirejs/tests", "optimize=none"]);

                t.is(nol(c("expected/unoExcludeShallow.js")), nol(c("builds/unoExcludeShallow.js")));
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildExclude",
        [
            function buildExclude(t) {
                build(["name=uno", "exclude=dos", "out=builds/unoExclude.js",
                       "baseUrl=../../../requirejs/tests", "optimize=none"]);

                t.is(nol(c("../../../requirejs/tests/uno.js")), nol(c("builds/unoExclude.js")));
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildTextPluginIncluded",
        [
            function buildTextPluginIncluded(t) {
                build(["name=one", "include=text", "out=builds/oneText.js",
                       "baseUrl=../../../requirejs/tests", "paths.text=../../text/text", "optimize=none"]);

                t.is(nol(nol(c("../../../requirejs/tests/two.js") +
                         c("../../../requirejs/tests/one.js") + ";") +
                         requireTextContents), nol(c("builds/oneText.js")));
                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("buildPluginAsModule",
        [
            function buildPluginAsModule(t) {
                build(["name=refine!a", "out=builds/refineATest.js",
                       "baseUrl=../../../requirejs/tests/plugins/fromText",
                       "exclude=text,refine",
                       "paths.text=../../../../text/text", "optimize=none"]);

                t.is(nol(nol((c("../../../requirejs/tests/plugins/fromText/a.refine"))
                             .replace(/refine\(/g, 'define(')))
                             .replace(/define\(\{/, "define('refine!a',{"),
                         nol(c("builds/refineATest.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();


    doh.register("buildUniversal",
        [
            function buildUniversal(t) {
                build(["baseUrl=../../../requirejs/tests/universal",
                       "name=universal-tests",
                       "out=../../../requirejs/tests/universal/universal-tests-built.js",
                       "optimize=none"]);

                t.is(nol(c("../../../requirejs/tests/universal/universal-tests-built-expected.js")),
                     nol(c("../../../requirejs/tests/universal/universal-tests-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("buildNamespace",
        [
            function buildNamespace(t) {
                build(["baseUrl=lib/namespace", "optimize=none", "namespace=foo",
                       "name=main", "out=lib/namespace/foo.js"]);

                t.is(nol(c("lib/namespace/expected.js")),
                     nol(c("lib/namespace/foo.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("buildNamespaceConfig",
        [
            function buildNamespaceConfig(t) {
                build(["lib/namespaceConfig/build.js"]);

                t.is(nol(c("lib/namespaceConfig/expected.js")),
                     nol(c("lib/namespaceConfig/foo.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("buildNamespaceMinified",
        [
            function buildNamespaceMinified(t) {
                build(["lib/namespaceMinified/build.js"]);

                t.is(nol(c("lib/namespaceMinified/expected.js")),
                     nol(c("lib/namespaceMinified/foo.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("useDotPackage",
        [
            function useDotPackage(t) {
                build(["lib/dotpackage/scripts/app.build.js"]);

                t.is(nol(c("lib/dotpackage/scripts/main-expected.js")),
                     nol(c("lib/dotpackage/built/scripts/main.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("multipleEmpty",
        [
            function multipleEmpty(t) {

                build(["lib/empty/build.js"]);

                t.is(nol(c("lib/empty/expected.js")),
                     nol(c("lib/empty/built/main.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("paths.valid",
        [
            function (t) {
                try {
                    build(["lib/paths/valid/build.js"]);
                    t.is(nol(c("lib/paths/valid/expected.js")),
                         nol(c("lib/paths/valid/built/main.js")));
                }
                finally {
                    file.deleteFile("lib/paths/valid/built");
                    require._buildReset();
                }
            }
        ]
    );
    doh.run();

    //Skip in xpconnect's since Reflect's parser cannot maintain comments.
    if (env.get() !== 'xpconnect') {
        doh.register("preserveLicense",
            [
                function preserveLicense(t) {
                    file.deleteFile("lib/comments/built.js");

                    build(["lib/comments/build.js"]);

                    t.is(nol(c("lib/comments/expected.js")),
                         nol(c("lib/comments/built.js")));

                    require._buildReset();
                }

            ]
        );
        doh.run();

        //Only keep unique comments
        //https://github.com/requirejs/r.js/issues/251
        doh.register("preserveLicenseUnique",
            [
                function preserveLicenseUnique(t) {
                    file.deleteFile("lib/comments/unique/built.js");

                    build(["lib/comments/unique/build.js"]);

                    t.is(nol(c("lib/comments/unique/expected.js")),
                         nol(c("lib/comments/unique/built.js")));

                    require._buildReset();
                }

            ]
        );
        doh.run();

        //Do not dupe parts of comments when at the end of the file.
        //https://github.com/requirejs/r.js/issues/264
        doh.register("preserveLicenseNoPartialDupe",
            [
                function preserveLicenseNoPartialDupe(t) {
                    file.deleteFile("lib/comments/noPartialDupe/built");

                    //Run two builds, this profile has keepBuildDir set to true.
                    build(["lib/comments/noPartialDupe/build.js"]);
                    build(["lib/comments/noPartialDupe/build.js"]);

                    t.is(nol(c("lib/comments/noPartialDupe/expected.js")),
                         nol(c("lib/comments/noPartialDupe/built/underscore.js")));

                    require._buildReset();
                }

            ]
        );
        doh.run();
    }


    doh.register("nestedFind",
        [
            function nestedFind(t) {
                file.deleteFile("lib/nested/main-builtWithCE.js");

                //Clear the cached file contents since the
                //findNestedDependencies config actually modifies
                //what the contents could be.
                require._cachedFileContents = {};

                build(["lib/nested/buildWithCE.js"]);

                t.is(nol(c("lib/nested/expected-builtWithCE.js")),
                     nol(c("lib/nested/main-builtWithCE.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("nestedSkip",
        [
            function nestedSkip(t) {
                file.deleteFile("lib/nested/main-built.js");

                //Clear the cached file contents since the
                //findNestedDependencies config actually modifies
                //what the contents could be.
                require._cachedFileContents = {};

                build(["lib/nested/build.js"]);

                t.is(nol(c("lib/nested/expected-built.js")),
                     nol(c("lib/nested/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("nestedHas",
        [
            function nestedHas(t) {
                file.deleteFile("lib/nestedHas/main-built.js");

                //Clear the cached file contents since the
                //findNestedDependencies config actually modifies
                //what the contents could be.
                require._cachedFileContents = {};

                build(["lib/nestedHas/build.js"]);

                t.is(nol(c("lib/nestedHas/expected-built.js")),
                     nol(c("lib/nestedHas/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("nestedHasNeedAll",
        [
            function nestedHasNeedAll(t) {
                file.deleteFile("lib/nestedHas/main-builtNeedAll.js");

                //Clear the cached file contents since the
                //findNestedDependencies config actually modifies
                //what the contents could be.
                require._cachedFileContents = {};

                build(["lib/nestedHas/buildNeedAll.js"]);

                t.is(nol(c("lib/nestedHas/expected-builtNeedAll.js")),
                     nol(c("lib/nestedHas/main-builtNeedAll.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("nestedHasNeedB",
        [
            function nestedHasNeed(t) {
                file.deleteFile("lib/nestedHas/main-builtNeedB.js");

                //Clear the cached file contents since the
                //findNestedDependencies config actually modifies
                //what the contents could be.
                require._cachedFileContents = {};

                build(["lib/nestedHas/buildNeedB.js"]);

                t.is(nol(c("lib/nestedHas/expected-builtNeedB.js")),
                     nol(c("lib/nestedHas/main-builtNeedB.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("nestedHasNeedC",
        [
            function nestedHasNeed(t) {
                file.deleteFile("lib/nestedHas/main-builtNeedC.js");

                //Clear the cached file contents since the
                //findNestedDependencies config actually modifies
                //what the contents could be.
                require._cachedFileContents = {};

                build(["lib/nestedHas/buildNeedC.js"]);

                t.is(nol(c("lib/nestedHas/expected-builtNeedC.js")),
                     nol(c("lib/nestedHas/main-builtNeedC.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("nestedHasNeedD",
        [
            function nestedHasNeedD(t) {
                file.deleteFile("lib/nestedHas/main-builtNeedD.js");

                //Clear the cached file contents since the
                //findNestedDependencies config actually modifies
                //what the contents could be.
                require._cachedFileContents = {};

                build(["lib/nestedHas/buildNeedD.js"]);

                t.is(nol(c("lib/nestedHas/expected-builtNeedD.js")),
                     nol(c("lib/nestedHas/main-builtNeedD.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("nestedHasNested",
        [
            function nestedHasNested(t) {
                file.deleteFile("lib/nestedHas/main-builtNested.js");

                //Clear the cached file contents since the
                //findNestedDependencies config actually modifies
                //what the contents could be.
                require._cachedFileContents = {};

                build(["lib/nestedHas/buildNested.js"]);

                t.is(nol(c("lib/nestedHas/expected-builtNested.js")),
                     nol(c("lib/nestedHas/main-builtNested.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("amdefineStrip",
        [
            function amdefineStrip(t) {
                file.deleteFile("lib/amdefine/built.js");

                build(["lib/amdefine/build.js"]);

                t.is(nol(c("lib/amdefine/expected.js")),
                     nol(c("lib/amdefine/built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //https://github.com/requirejs/r.js/issues/574
    doh.register("keepAmdefine",
        [
            function amdefineStrip(t) {
                file.deleteFile("lib/keepAmdefine/built.js");

                build(["lib/keepAmdefine/build.js"]);

                t.is(nol(c("lib/keepAmdefine/expected.js")),
                     nol(c("lib/keepAmdefine/built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("nameInsertion",
        [
            function nameInsertion(t) {
                file.deleteFile("lib/nameInsertion/built.js");

                build(["lib/nameInsertion/build.js"]);

                t.is(nol(c("lib/nameInsertion/expected.js")),
                     nol(c("lib/nameInsertion/built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Make sure a nested function declaration for a define function is not
    //renamed: https://github.com/requirejs/r.js/issues/388
    doh.register("nameInsertionNested",
        [
            function nameInsertionNested(t) {
                file.deleteFile("lib/nameInsertion/nested/built.js");

                build(["lib/nameInsertion/nested/build.js"]);

                t.is(nol(c("lib/nameInsertion/nested/expected.js")),
                     nol(c("lib/nameInsertion/nested/built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("moduleThenPlugin",
        [
            function moduleThenPlugin(t) {
                file.deleteFile("lib/moduleThenPlugin/built.js");

                build(["lib/moduleThenPlugin/build.js"]);

                t.is(nol(c("lib/moduleThenPlugin/expected.js")),
                     nol(c("lib/moduleThenPlugin/built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("pluginsWithDeps",
        [
            function pluginsWithDeps(t) {
                file.deleteFile("lib/plugins/main-built.js");

                build(["lib/plugins/build.js"]);

                t.is(nol(c("lib/plugins/expected.js")),
                     nol(c("lib/plugins/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("pluginFirstWithDeps",
        [
            function pluginFirstWithDeps(t) {
                file.deleteFile("lib/plugins/main-builtPluginFirst.js");

                build(["lib/plugins/buildPluginFirst.js"]);

                t.is(nol(c("lib/plugins/expected.js")),
                     nol(c("lib/plugins/main-builtPluginFirst.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("mainConfigFileBasic",
        [
            function mainConfigFileBasic(t) {
                file.deleteFile("lib/mainConfigFile/basic/main-built.js");

                build(["lib/mainConfigFile/basic/tools/build.js"]);

                t.is(nol(c("lib/mainConfigFile/basic/expected.js")),
                     nol(c("lib/mainConfigFile/basic/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Confirms that only the first requirejs.config() is found
    //https://github.com/requirejs/r.js/issues/257
    //https://github.com/requirejs/r.js/issues/258
    doh.register("mainConfigFileFirst",
        [
            function mainConfigFileFirst(t) {
                file.deleteFile("lib/mainConfigFile/first/main-built.js");

                build(["lib/mainConfigFile/first/tools/build.js"]);

                t.is(nol(c("lib/mainConfigFile/first/expected.js")),
                     nol(c("lib/mainConfigFile/first/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("mainConfigFileBasicCommand",
        [
            function mainConfigFileBasic(t) {
                file.deleteFile("lib/mainConfigFile/basic/main-built.js");

                build([
                    "mainConfigFile=lib/mainConfigFile/basic/www/js/main.js",
                    "name=main",
                    "out=lib/mainConfigFile/basic/main-built.js",
                    "optimize=none"
                ]);

                t.is(nol(c("lib/mainConfigFile/basic/expected.js")),
                     nol(c("lib/mainConfigFile/basic/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("mainConfigFileMerged",
        [
            function mainConfigFileMerged(t) {
                file.deleteFile("lib/mainConfigFile/mergeConfig/main-built.js");

                build(["lib/mainConfigFile/mergeConfig/tools/build.js"]);

                t.is(nol(c("lib/mainConfigFile/mergeConfig/expected.js")),
                     nol(c("lib/mainConfigFile/mergeConfig/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Multiple mainConfigFile entries
    //https://github.com/requirejs/r.js/pull/572
    doh.register("mainConfigFileMulti",
        [
            function mainConfigFileMulti(t) {
                file.deleteFile("lib/mainConfigFile/multi/main-built.js");

                build(["lib/mainConfigFile/multi/tools/build.js"]);

                t.is(nol(c("lib/mainConfigFile/multi/expected.js")),
                     nol(c("lib/mainConfigFile/multi/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();


    doh.register("onBuildAllDir",
        [
            function onBuildAllDir(t) {
                file.deleteFile("lib/onBuildAllDir/js-built");

                build(["lib/onBuildAllDir/build.js"]);

                t.is(nol(c("lib/onBuildAllDir/expected-main.js")),
                     nol(c("lib/onBuildAllDir/js-built/main.js")));

                t.is(nol(c("lib/onBuildAllDir/expected-a.js")),
                     nol(c("lib/onBuildAllDir/js-built/a.js")));

                t.is(nol(c("lib/onBuildAllDir/expected-b.js")),
                     nol(c("lib/onBuildAllDir/js-built/b.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("onBuildRead",
        [
            function onBuildRead(t) {
                file.deleteFile("lib/onBuildRead/main-built.js");

                build(["lib/onBuildRead/build.js"]);

                t.is(nol(c("lib/onBuildRead/expected.js")),
                     nol(c("lib/onBuildRead/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("onBuildWrite",
        [
            function onBuildWrite(t) {
                file.deleteFile("lib/onBuildWrite/main-built.js");

                build(["lib/onBuildWrite/build.js"]);

                t.is(nol(c("lib/onBuildWrite/expected.js")),
                     nol(c("lib/onBuildWrite/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("pristineSrc",
        [
            //Makes sure source locations are not overwritten by the
            //normalization of paths to be absolute, when an appDir is
            //in play.
            function pristineSrc(t) {

                build(["lib/pristineSrc/build.js"]);

                t.is(nol(c("lib/pristineSrc/expected-main.js")),
                     nol(c("lib/pristineSrc/built/main.js")));

                t.is(nol(c("lib/pristineSrc/expected-lib.js")),
                     nol(c("lib/pristineSrc/built/vendor/lib.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("intDefine",
        [
            function intDefine(t) {
                file.deleteFile("lib/intDefine/main-built.js");

                build(["lib/intDefine/build.js"]);

                t.is(nol(c("lib/intDefine/expected.js")),
                     nol(c("lib/intDefine/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("cssRelativeUrl",
        [
            function cssRelativeUrl(t) {
                file.deleteFile("lib/cssRelativeUrl/main-built.css");

                build(["lib/cssRelativeUrl/build.js"]);

                t.is(nol(c("lib/cssRelativeUrl/output/expected.css")),
                     nol(c("lib/cssRelativeUrl/output/main-built.css")));

                require._buildReset();
            }

        ]
    );
    doh.run();


    doh.register("cssDuplicates",
        [
            function cssDuplicates(t) {
                file.deleteFile("lib/cssDuplicates/main-built.css");

                build(["lib/cssDuplicates/build.js"]);

                t.is(nol(c("lib/cssDuplicates/expected.css")),
                     nol(c("lib/cssDuplicates/main-built.css")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("cssKeepComments",
        [
            function cssKeepComments(t) {
                file.deleteFile("lib/cssKeepComments/main-built.css");

                build(["lib/cssKeepComments/build.js"]);

                t.is(nol(c("lib/cssKeepComments/expected.css")),
                     nol(c("lib/cssKeepComments/main-built.css")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("cssKeepWhitespace",
        [
            function cssKeepComments(t) {
                file.deleteFile("lib/cssKeepWhitespace/main-built.css");

                build(["lib/cssKeepWhitespace/build.js"]);

                t.is(nol(c("lib/cssKeepWhitespace/expected.css")),
                     nol(c("lib/cssKeepWhitespace/main-built.css")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("cssKeepLicense",
        [
            function cssKeepLicense(t) {
                file.deleteFile("lib/cssKeepLicense/main-built.css");

                build(["lib/cssKeepLicense/build.js"]);

                t.is(nol(c("lib/cssKeepLicense/expected.css")),
                     nol(c("lib/cssKeepLicense/main-built.css")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("cssKeepLicenseNoLicense",
        [
            function cssKeepLicenseNoLicense(t) {
                file.deleteFile("lib/cssKeepLicense/main-nolicense-built.css");

                build(["lib/cssKeepLicense/build-nolicense.js"]);

                t.is(nol(c("lib/cssKeepLicense/expected-nolicense.css")),
                     nol(c("lib/cssKeepLicense/main-nolicense-built.css")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/167 @import in media query
    doh.register("cssMediaQuery",
        [
            function cssMediaQuery(t) {
                file.deleteFile("lib/cssMediaQuery/main-built.css");

                build(["lib/cssMediaQuery/build.js"]);

                t.is(nol(c("lib/cssMediaQuery/expected.css")),
                     nol(c("lib/cssMediaQuery/main-built.css")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/350 CSS optimizer makes
    //url() relative to cssIn option
    doh.register("cssPrefix",
        [
            function cssPrefix(t) {
                file.deleteFile("lib/cssPrefix/output/main-built.css");

                build(["lib/cssPrefix/build.js"]);

                t.is(nol(c("lib/cssPrefix/output/expected.css")),
                     nol(c("lib/cssPrefix/output/main-built.css")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/356 cssPrefix normalization
    //done even in directory builds
    doh.register("cssPrefixDirNormalization",
        [
            function cssPrefixDirNormalization(t) {
                file.deleteFile("lib/cssPrefix/356/www-built");

                build(["lib/cssPrefix/356/build.js"]);

                t.is(nol(c("lib/cssPrefix/356/expected/main.css")),
                     nol(c("lib/cssPrefix/356/www-built/main.css")));

                t.is(nol(c("lib/cssPrefix/356/expected/sub.css")),
                     nol(c("lib/cssPrefix/356/www-built/sub.css")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/296 removeCombined should
    //remove files that have been inlined.
    doh.register("cssRemoveCombined",
        [
            function cssRemoveCombined(t) {
                file.deleteFile("lib/cssRemoveCombined/main-built.css");

                build(["lib/cssRemoveCombined/build.js"]);

                t.is(false, file.exists("lib/cssRemoveCombined/www-built/css/two.css"));
                t.is(false, file.exists("lib/cssRemoveCombined/www-built/css/sub/one.css"));
                t.is(false, file.exists("lib/cssRemoveCombined/www-built/css/sub/misc.css"));

                t.is(nol(c("lib/cssRemoveCombined/expected.css")),
                     nol(c("lib/cssRemoveCombined/www-built/css/main.css")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/150
    doh.register("appDirSrcOverwrite",
        [
            function appDirSrcOverwrite(t) {

                build(["lib/appDirSrcOverwrite/build.js"]);

                //Make sure source file was not accidentally overwritten
                t.is(nol(c("lib/appDirSrcOverwrite/src-app.js")),
                     nol(c("lib/appDirSrcOverwrite/www/js/app.js")));

                //Make sure built file contains the expected contents.
                t.is(nol(c("lib/appDirSrcOverwrite/expected-app.js")),
                     nol(c("lib/appDirSrcOverwrite/www-built/js/app.js")));


                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/151
    doh.register("jqueryConfig",
        [
            function jqueryConfig(t) {
                file.deleteFile("lib/jqueryConfig/main-built.js");

                build(["lib/jqueryConfig/build.js"]);

                t.is(nol(c("lib/jqueryConfig/expected.js")),
                     nol(c("lib/jqueryConfig/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/125
    doh.register("transportBeforeMinify",
        [
            function transportBeforeMinify(t) {

                build(["lib/transportBeforeMinify/build.js"]);

                //Make sure the dependencies are listed as an array in the
                //file that is not part of a build layer, but still uglified
                var contents = nol(c("lib/transportBeforeMinify/www-built/js/b.js"));
                t.is(true, /define\(\["require"\,"a"\]\,function/.test(contents));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/138
    doh.register("cssComment138",
        [
            function cssComment138(t) {
                file.deleteFile("lib/cssComment138/main-built.css");

                build(["lib/cssComment138/build.js"]);

                t.is(nol(c("lib/cssComment138/expected.css")),
                     nol(c("lib/cssComment138/main-built.css")));

                require._buildReset();
            }

        ]
    );
    doh.run();


    doh.register("shimBasic",
        [
            function shimBasic(t) {
                var outFile = "../../../requirejs/tests/shim/built/basic-tests.js";

                file.deleteFile(outFile);

                build(["lib/shimBasic/build.js"]);

                //Also remove spaces, since rhino and node differ on their
                //Function.prototype.toString() output by whitespace, and
                //the semicolon on end of A.name, and string quotes.
                t.is(nol(c("lib/shimBasic/expected.js")).replace(/\s+/g, '').replace(/A\.name\;/g, 'A.name'),
                     nol(c(outFile)).replace(/\s+/g, '').replace(/A\.name\;/g, 'A.name')
                     .replace(/['"]Modified["']/, "'Modified'"));

                require._buildReset();
            }

        ]
    );
    doh.run();

    // test wrapShim: true config
    //
    doh.register("shimBasicWrap",
        [
            function shimBasicWrap(t) {
                var outFile = "lib/shimBasicWrap/basic-tests-built.js";

                file.deleteFile(outFile);

                build(["lib/shimBasicWrap/build.js"]);

                //Also remove spaces, since rhino and node differ on their
                //Function.prototype.toString() output by whitespace, and
                //the semicolon on end of A.name, and string quotes.
                t.is(nol(c("lib/shimBasicWrap/expected.js")).replace(/\s+/g, '').replace(/A\.name\;/g, 'A.name'),
                     nol(c(outFile)).replace(/\s+/g, '').replace(/A\.name\;/g, 'A.name')
                     .replace(/['"]Modified["']/, "'Modified'"));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("shimFakeDefine",
        [
            function shimFakeDefine(t) {
                file.deleteFile("lib/shimFakeDefine/main-built.js");

                build(["lib/shimFakeDefine/build.js"]);

                t.is(nol(c("lib/shimFakeDefine/expected.js")),
                     nol(c("lib/shimFakeDefine/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("shimWrapShort",
        [
            function shimWrapShort(t) {
                file.deleteFile("lib/shimWrapShort/main-built.js");

                build(["lib/shimWrapShort/build.js"]);

                t.is(nol(c("lib/shimWrapShort/expected.js")),
                     nol(c("lib/shimWrapShort/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();





    doh.register("mapConfig",
        [
            function mapConfig(t) {
                var outFile = "../../../requirejs/tests/mapConfig/built/mapConfig-tests.js";

                file.deleteFile(outFile);

                build(["lib/mapConfig/build.js"]);

                t.is(nol(c("lib/mapConfig/expected.js")),
                     nol(c(outFile)));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("mapConfigStar",
        [
            function mapConfigStar(t) {
                var outFile = "../../../requirejs/tests/mapConfig/built/mapConfigStar-tests.js";

                file.deleteFile(outFile);

                build(["lib/mapConfig/buildStar.js"]);

                t.is(nol(c("lib/mapConfig/expectedStar.js")),
                     nol(c(outFile)));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/requirejs/issues/277
    doh.register("mapConfigStarAdapter",
        [
            function mapConfigStar(t) {
                var outFile = "../../../requirejs/tests/mapConfig/built/mapConfigStarAdapter-tests.js";

                file.deleteFile(outFile);

                build(["lib/mapConfig/buildStarAdapter.js"]);

                t.is(nol(c("lib/mapConfig/expectedStarAdapter.js")),
                     nol(c(outFile)));

                require._buildReset();
            }

        ]
    );
    doh.run();


    //https://github.com/requirejs/requirejs/issues/466
    doh.register("mapConfigPlugin",
        [
            function mapConfigPlugin(t) {
                var outFile = "../../../requirejs/tests/mapConfig/built/mapConfigPlugin-tests.js";

                file.deleteFile(outFile);

                build(["lib/mapConfig/buildPlugin.js"]);

                t.is(nol(c("lib/mapConfig/expectedPlugin.js")),
                     nol(c(outFile)));

                require._buildReset();
            }

        ]
    );
    doh.run();


    doh.register("mapConfigMix",
        [
            function mapConfigMix(t) {
                file.deleteFile("lib/mapConfigMix/a-built.js");

                build(["lib/mapConfigMix/build.js"]);

                t.is(nol(c("lib/mapConfigMix/expected.js")),
                     nol(c("lib/mapConfigMix/a-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/165 insertRequire
    doh.register("insertRequire",
        [
            function insertRequire(t) {
                file.deleteFile("lib/insertRequire/main-built.js");

                build(["lib/insertRequire/build.js"]);

                t.is(nol(c("lib/insertRequire/expected.js")),
                     nol(c("lib/insertRequire/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/30 removeCombined
    doh.register("removeCombinedApp",
        [
            function removeCombinedApp(t) {

                build(["lib/removeCombined/build.js"]);

                t.is(nol(c("lib/removeCombined/expected-main.js")),
                     nol(c("lib/removeCombined/app-built/js/main.js")));
                t.is(nol(c("lib/removeCombined/expected-secondary.js")),
                     nol(c("lib/removeCombined/app-built/js/secondary.js")));
                t.is(false, file.exists("lib/removeCombined/app-built/js/a.js"));
                t.is(false, file.exists("lib/removeCombined/app-built/js/b.js"));
                t.is(false, file.exists("lib/removeCombined/app-built/js/c.js"));
                t.is(true, file.exists("lib/removeCombined/app-built/js/d.js"));

                //Make sure empty directories are pruned
                t.is(false, file.exists('lib/removeCombined/app-built/js/sub'), 'empty directories removed');

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/30 removeCombined
    doh.register("removeCombinedBaseUrl",
        [
            function removeCombinedBaseUrl(t) {

                build(["lib/removeCombined/build-baseUrl.js"]);

                t.is(nol(c("lib/removeCombined/expected-main.js")),
                     nol(c("lib/removeCombined/baseUrl-built/main.js")));
                t.is(nol(c("lib/removeCombined/expected-secondary.js")),
                     nol(c("lib/removeCombined/baseUrl-built/secondary.js")));
                t.is(false, file.exists("lib/removeCombined/baseUrl-built/a.js"));
                t.is(false, file.exists("lib/removeCombined/baseUrl-built/b.js"));
                t.is(false, file.exists("lib/removeCombined/baseUrl-built/c.js"));
                t.is(true, file.exists("lib/removeCombined/baseUrl-built/d.js"));

                //Make sure empty directories are pruned
                t.is(false, file.exists('lib/removeCombined/baseUrl-built/sub'), 'empty directories removed');

                require._buildReset();
            }

        ]
    );
    doh.run();


    //Tests https://github.com/requirejs/r.js/issues/163 URLs as empty:
    doh.register("urlToEmpty",
        [
            function urlToEmpty(t) {
                file.deleteFile("lib/urlToEmpty/main-built.js");

                build(["lib/urlToEmpty/build.js"]);

                t.is(nol(c("lib/urlToEmpty/expected.js")),
                     nol(c("lib/urlToEmpty/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    // Tests https://github.com/requirejs/r.js/pull/322 multiple modules with shared excludes
    doh.register("modulesExclude",
        [
            function modulesExclude(t) {
                file.deleteFile("lib/modulesExclude/built");

                build(["lib/modulesExclude/build.js"]);

                t.is(nol(c("lib/modulesExclude/expected/a.js")),
                     nol(c("lib/modulesExclude/built/a.js")));
                t.is(nol(c("lib/modulesExclude/expected/b.js")),
                     nol(c("lib/modulesExclude/built/b.js")));
                t.is(nol(c("lib/modulesExclude/expected/z.js")),
                     nol(c("lib/modulesExclude/built/z.js")));

                require._buildReset();
            }
        ]
    );
    doh.run();


    //Tests https://github.com/requirejs/r.js/issues/116 stub modules
    doh.register("stubModules",
        [
            function stubModules(t) {
                file.deleteFile("lib/stubModules/main-built.js");

                build(["lib/stubModules/build.js"]);

                t.is(noSlashRn(nol(c("lib/stubModules/expected.js"))),
                     noSlashRn(nol(c("lib/stubModules/main-built.js"))));

                require._buildReset();
            }

        ]
    );
    doh.run();


    //Tests https://github.com/requirejs/r.js/issues/291 per layer stub modules
    doh.register("stubModulesPerModule",
        [
            function stubModulesPerModule(t) {
                file.deleteFile("lib/stubModules/perModule/built");

                build(["lib/stubModules/perModule/build.js"]);

                t.is(noSlashRn(nol(c("lib/stubModules/perModule/expected-first.js"))),
                     noSlashRn(nol(c("lib/stubModules/perModule/built/first.js"))));
                t.is(noSlashRn(nol(c("lib/stubModules/perModule/expected-second.js"))),
                     noSlashRn(nol(c("lib/stubModules/perModule/built/second.js"))));

                require._buildReset();
            }

        ]
    );
    doh.run();


    //Tests https://github.com/requirejs/r.js/issues/432 insert stub module
    //for module.create layers.
    doh.register("stubModulesCreate",
        [
            function stubModulesCreate(t) {
                file.deleteFile("lib/stubModules/create/foobar-built.js");

                build(["lib/stubModules/create/build.js"]);

                t.is(noSlashRn(nol(c("lib/stubModules/create/expected.js"))),
                     noSlashRn(nol(c("lib/stubModules/create/foobar-built.js"))));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/155 no copy of paths
    doh.register("pathsNoCopy",
        [
            function pathsNoCopy(t) {
                file.deleteFile("lib/pathsNoCopy/js-built");

                build(["lib/pathsNoCopy/build.js"]);

                t.is(true, file.exists("lib/pathsNoCopy/js-built/vendor/sub.js"));
                t.is(false, file.exists("lib/pathsNoCopy/js-built/sub.js"));
                t.is(true, file.exists("lib/pathsNoCopy/js-built/outside.js"));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Confirm that deps: [] works in a build config file.
    doh.register("depsConfig",
        [
            function depsConfig(t) {
                file.deleteFile("lib/depsConfig/main-built.js");

                build(["lib/depsConfig/build.js"]);

                t.is(nol(c("lib/depsConfig/expected.js")),
                     nol(c("lib/depsConfig/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();


    //Tests https://github.com/requirejs/requirejs/issues/278, make sure that
    //baseUrl inside a mainConfigFile is resolved relative to the appDir in
    //a build file.
    doh.register("mainConfigBaseUrl",
        [
            function mainConfigBaseUrl(t) {
                build(["lib/mainConfigBaseUrl/build.js"]);

                t.is(nol(c("lib/mainConfigBaseUrl/expected.js")),
                     nol(c("lib/mainConfigBaseUrl/www-built/js/main.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Confirm package config builds correctly so that it works in both
    //require.js and almond, which does not know about package config.
    //https://github.com/requirejs/r.js/issues/136
    doh.register("packages",
        [
            function packages(t) {
                file.deleteFile("lib/packages/main-built.js");

                build(["lib/packages/build.js"]);

                t.is(nol(c("lib/packages/expected.js")),
                     nol(c("lib/packages/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Confirm node-style package module IDs, which may end in '.js', work in
    //optimizer.
    //https://github.com/requirejs/r.js/pull/591
    doh.register("packagesNode",
        [
            function packagesNode(t) {
                file.deleteFile("lib/packagesNode/main-built.js");

                build(["lib/packagesNode/build.js"]);

                t.is(nol(c("lib/packagesNode/expected.js")),
                     nol(c("lib/packagesNode/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Confirm package adapter module is skipped if the main package
    //module names itself.
    //https://github.com/requirejs/r.js/issues/328
    doh.register("packagesNamed",
        [
            function packagesNamed(t) {
                file.deleteFile("lib/packages/named/main-built.js");

                build(["lib/packages/named/build.js"]);

                t.is(nol(c("lib/packages/named/expected.js")),
                     nol(c("lib/packages/named/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Peaceful coexistence of package config with shim in a built context.
    //https://github.com/requirejs/r.js/issues/331
    doh.register("configPackageShim",
        [
            function configPackageShim(t) {
                file.deleteFile("lib/configPackageShim/built");

                build(["lib/configPackageShim/build.js"]);

                t.is(nol(c("lib/configPackageShim/expected.js")),
                     nol(c("lib/configPackageShim/built/main.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();


    doh.register("packagesMultiLevel",
        [
            function packagesMultiLevel(t) {
                var startPath = "../../../requirejs/tests/packagesMultiLevel/",
                    builtPath = startPath + "packagesMultiLevel-tests-built.js";
                file.deleteFile(builtPath);

                build([startPath + "build.js"]);

                t.is(nol(c(startPath + "expected-built.js")), nol(c(builtPath)));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();


    //Make sure pluginBuilder works.
    //https://github.com/requirejs/r.js/issues/175
    doh.register("pluginBuilder",
        [
            function pluginBuilder(t) {
                file.deleteFile("lib/pluginBuilder/main-built.js");

                build(["lib/pluginBuilder/build.js"]);

                t.is(nol(c("lib/pluginBuilder/expected.js")),
                     nol(c("lib/pluginBuilder/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Make sure plugin dependencies that need normalization run in a build.
    //https://github.com/requirejs/r.js/issues/648
    doh.register("pluginDepExec",
        [
            function pluginDepExec(t) {
                file.deleteFile("lib/pluginDepExec/main-built.js");

                build(["lib/pluginDepExec/build.js"]);

                t.is(nol(c("lib/pluginDepExec/expected.js")),
                     nol(c("lib/pluginDepExec/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();


    //Make sure a non-strict plugin does not blow up in the build
    //https://github.com/requirejs/r.js/issues/181
    doh.register("nonStrict",
        [
            function nonStrict(t) {
                file.deleteFile("lib/nonStrict/main-built.js");

                build(["lib/nonStrict/build.js"]);

                t.is(nol(c("lib/nonStrict/expected.js")),
                     nol(c("lib/nonStrict/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests https://github.com/requirejs/r.js/issues/190,
    //optimizeAllPluginResources
    doh.register("optimizeAllPluginResources",
        [
            function optimizeAllPluginResources(t) {

                build(["lib/plugins/optimizeAllPluginResources/build.js"]);

                t.is(true, file.exists("lib/plugins/optimizeAllPluginResources/www-built/js/one.txt.js"));
                t.is(true, file.exists("lib/plugins/optimizeAllPluginResources/www-built/js/two.txt.js"));
                t.is(true, file.exists("lib/plugins/optimizeAllPluginResources/www-built/js/secondary.txt.js"));

                t.is(noSlashRn(nol(c("lib/plugins/optimizeAllPluginResources/expected-secondary.txt.js"))),
                     noSlashRn(nol(c("lib/plugins/optimizeAllPluginResources/www-built/js/secondary.txt.js"))));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests that under rhino paths are normalized to not have . or .. in them.
    //https://github.com/requirejs/r.js/issues/186
    doh.register("rhino186",
        [
            function rhino186(t) {
                build(["lib/rhino-186/app.build.js"]);

                t.is(noSlashRn(nol(c("lib/rhino-186/expected.js"))),
                     noSlashRn(nol(c("lib/rhino-186/built/main.js"))));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Tests cjsTranslate https://github.com/requirejs/r.js/issues/189
    doh.register("cjsTranslate",
        [
            function cjsTranslate(t) {

                build(["lib/cjsTranslate/www/app.build.js"]);

                var expected = nol(c("lib/cjsTranslate/expected.js")),
                    contents = nol(c("lib/cjsTranslate/www-built/js/lib.js"));

                t.is(expected, contents);

                require._buildReset();
            }

        ]
    );
    doh.run();


    //Make sure dormant, un-required modules in a build do not trigger
    //'module did not load error' https://github.com/requirejs/r.js/issues/213
    doh.register("dormant213",
        [
            function dormant213(t) {
                file.deleteFile("lib/dormant213/main-built.js");

                build(["lib/dormant213/build.js"]);

                t.is(nol(c("lib/dormant213/expected.js")),
                     nol(c("lib/dormant213/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Make sure evaled plugin dependencies in a build do not see the module
    //and exports value for r.js https://github.com/requirejs/r.js/issues/217
    doh.register("noexports",
        [
            function noexports(t) {
                file.deleteFile("lib/noexports/main-built.js");

                build(["lib/noexports/build.js"]);

                t.is(nol(c("lib/noexports/expected.js")),
                     nol(c("lib/noexports/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Allow JS 1.8 that works in spidermonkey to be built.
    //https://github.com/requirejs/r.js/issues/72
    doh.register("js18",
        [
            function js18(t) {
                file.deleteFile("lib/js18/main-built.js");

                build(["lib/js18/build.js"]);

                t.is(nol(c("lib/js18/expected.js")),
                     nol(c("lib/js18/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Allow some basic shimmed deps to work for plugins
    //https://github.com/requirejs/r.js/issues/203
    doh.register("pluginShimDep",
        [
            function pluginShimDep(t) {
                file.deleteFile("lib/pluginShimDep/main-built.js");

                build(["lib/pluginShimDep/build.js"]);

                t.is(nol(c("lib/pluginShimDep/expected.js")),
                     nol(c("lib/pluginShimDep/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Hoist require definition for multiple layer builds
    //https://github.com/requirejs/r.js/issues/263
    doh.register("requireHoistPerLayer",
        [
            function requireHoistPerLayer(t) {
                file.deleteFile("lib/requireHoist/perLayer/built");

                build(["lib/requireHoist/perLayer/build.js"]);

                t.is(nol(c("lib/requireHoist/perLayer/expectedMain1.js")),
                     nol(c("lib/requireHoist/perLayer/built/main1.js")));
                t.is(nol(c("lib/requireHoist/perLayer/expectedMain2.js")),
                     nol(c("lib/requireHoist/perLayer/built/main2.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Apply module overrides for final optimization/pragma work.
    //https://github.com/requirejs/r.js/issues/275
    doh.register("pragmasOverride",
        [
            function pragmasOverride(t) {
                file.deleteFile("lib/pragmas/override/built");

                build(["lib/pragmas/override/build.js"]);

                t.is(nol(c("lib/pragmas/override/expectedMain1.js")),
                     nol(c("lib/pragmas/override/built/main1.js")));
                t.is(nol(c("lib/pragmas/override/expectedMain2.js")),
                     nol(c("lib/pragmas/override/built/main2.js")));
                t.is(nol(c("lib/pragmas/override/expectedHelper.js")),
                     nol(c("lib/pragmas/override/built/helper.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Test onLayerEnd for loader plugins
    //https://github.com/requirejs/r.js/pull/241
    doh.register("pluginsOnLayerEnd",
        [
            function pluginsOnLayerEnd(t) {
                file.deleteFile("lib/plugins/onLayerEnd/main-built.js");

                build(["lib/plugins/onLayerEnd/build.js"]);

                t.is(nol(c("lib/plugins/onLayerEnd/expected.js")),
                     nol(c("lib/plugins/onLayerEnd/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("pluginsOnLayerEndMulti",
        [
            function pluginsOnLayerEndMulti(t) {
                file.deleteFile("lib/plugins/onLayerEnd/built");

                build(["lib/plugins/onLayerEnd/buildMulti.js"]);

                t.is(nol(c("lib/plugins/onLayerEnd/expectedMultiMain.js")),
                     nol(c("lib/plugins/onLayerEnd/built/main.js")));
                t.is(nol(c("lib/plugins/onLayerEnd/expectedMultiSecondary.js")),
                     nol(c("lib/plugins/onLayerEnd/built/secondary.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("hasOwnPropertyTest",
        [
            function hasOwnPropertyTest(t) {
                file.deleteFile("lib/hasOwnProperty/built.js");

                build(["lib/hasOwnProperty/build.js"]);

                t.is(nol(c("lib/hasOwnProperty/expected.js")),
                     nol(c("lib/hasOwnProperty/built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("rawText",
        [
            function rawText(t) {
                file.deleteFile("lib/rawText/built.js");

                build(["lib/rawText/build.js"]);

                t.is(nol(c("lib/rawText/expected.js")),
                     nol(c("lib/rawText/built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("rawTextLongId",
        [
            function rawTextLongId(t) {
                file.deleteFile("lib/rawTextLongId/built.js");

                build(["lib/rawTextLongId/build.js"]);

                t.is(nol(c("lib/rawTextLongId/expected.js")),
                     nol(c("lib/rawTextLongId/built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();


    // deps should be integrated into the build and not trigger
    // loads before traceDependencies, where rawText comes into play.
    // https://github.com/requirejs/r.js/issues/658
    doh.register("rawTextDeps",
        [
            function rawTextDeps(t) {
                file.deleteFile("lib/rawTextDeps/built.js");

                build(["lib/rawTextDeps/build.js"]);

                t.is(nol(c("lib/rawTextDeps/expected.js")),
                     nol(c("lib/rawTextDeps/built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Make sure multiple named modules do not mess up toTransport
    //https://github.com/requirejs/r.js/issues/366
    doh.register("iife",
        [
            function iife(t) {
                file.deleteFile("lib/iife/main-built.js");

                build(["lib/iife/build.js"]);

                t.is(nol(c("lib/iife/expected.js")),
                     nol(c("lib/iife/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //For UMD-wrapped code that is made up of interior modules, treat
    //the UMD define as the entry point for the module, and do not
    //parse the interior modules.
    //https://github.com/requirejs/r.js/issues/460
    doh.register("anonUmdInteriorModules",
        [
            function anonUmdInteriorModules(t) {
                file.deleteFile("lib/anonUmdInteriorModules/main-built.js");

                build(["lib/anonUmdInteriorModules/build.js"]);

                t.is(nol(c("lib/anonUmdInteriorModules/expected.js")),
                     nol(c("lib/anonUmdInteriorModules/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Test source map generation for a bundled file,
    //see https://github.com/requirejs/r.js/issues/397
    doh.register("sourcemap",
        [
            function sourcemap(t) {
                file.deleteFile("lib/sourcemap/www-built");

                build(["lib/sourcemap/build.js"]);

                sourcemapEquals(t, c("lib/sourcemap/expected-main.js.map"), c("lib/sourcemap/www-built/js/main.js.map"));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Test single file JS optimization with source map generation
    doh.register("sourcemapSingle",
        [
            function sourcemapSingle(t) {
                file.deleteFile("lib/sourcemapSingle/main-built.js");
                file.deleteFile("lib/sourcemapSingle/main-built.js.map");

                build(["lib/sourcemapSingle/build.js"]);

                sourcemapEquals(t, c("lib/sourcemapSingle/expected-main-built.js.map"), c("lib/sourcemapSingle/main-built.js.map"));

                require._buildReset();
            }

        ]
    );
    doh.run();

    // The output in rhino is slightly different, but enough to cause the
    // text compare to fail. So just disabling it for now. Long term,
    // a fancier sourcemap diff checking would be nice.
    if (env.get() !== 'rhino') {
        //Make sure "onejs" builds generate source map files relative to baseUrl,
        //and not the output file:
        //https://github.com/requirejs/r.js/issues/477
        doh.register("sourcemapOneJs",
            [
                function sourcemapOneJs(t) {
                    file.deleteFile("lib/sourcemap/onejs/www/js/built.js");
                    file.deleteFile("lib/sourcemap/onejs/www/js/built.js.map");

                    build(["lib/sourcemap/onejs/build.js"]);

                    sourcemapEquals(t, c("lib/sourcemap/onejs/expected.map"), c("lib/sourcemap/onejs/www/js/built.js.map"));

                    require._buildReset();
                }
            ]
        );
        doh.run();


        //Confirm target file is also in the source map.
        //https://github.com/requirejs/r.js/issues/829
        doh.register("sourcemapTwoJs",
            [
                function sourcemapTwoJs(t) {
                    file.deleteFile("lib/sourcemap/twojs/www-built");

                    build(["lib/sourcemap/twojs/build.js"]);

                    sourcemapEquals(t, c("lib/sourcemap/twojs/expected.map"), c("lib/sourcemap/twojs/www-built/core.js.map"));

                    require._buildReset();
                }
            ]
        );
        doh.run();
    }


    //Allow the target of an optimization to be a module that is only
    //provided in the rawText config.
    //Test single file JS optimization with source map generation
    doh.register("rawTextNameTarget",
        [
            function rawTextNameTarget(t) {
                file.deleteFile("lib/rawTextNameTarget/a-built.js");

                build(["lib/rawTextNameTarget/build.js"]);

                t.is(nol(c("lib/rawTextNameTarget/expected.js")),
                     nol(c("lib/rawTextNameTarget/a-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Allow skipping semicolon insertion
    //https://github.com/requirejs/r.js/issues/506
    doh.register("semicolonInsert",
        [
            function semicolonInsert(t) {
                file.deleteFile("lib/semicolonInsert/a-built.js");

                build(["lib/semicolonInsert/build.js"]);

                t.is(nol(c("lib/semicolonInsert/expected.js")),
                     nol(c("lib/semicolonInsert/a-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();


    //Make sure overrides for each build layer are pristine
    //https://github.com/requirejs/r.js/issues/500
    doh.register("dualLayerOverride",
        [
            function dualLayerOverride(t) {
                file.deleteFile("lib/dualLayerOverride/built");

                build(["lib/dualLayerOverride/build.js"]);

                t.is(nol(c("lib/dualLayerOverride/expectedMessage.js")),
                     nol(c("lib/dualLayerOverride/built/message.js")));
                t.is(nol(c("lib/dualLayerOverride/expectedWho.js")),
                     nol(c("lib/dualLayerOverride/built/who.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Allow wrap config in overrides
    //https://github.com/requirejs/r.js/issues/503
    doh.register("overrideWrap",
        [
            function overrideWrap(t) {
                file.deleteFile("lib/override/wrap/built");

                build(["lib/override/wrap/build.js"]);

                t.is(nol(c("lib/override/wrap/expected/a.js")),
                     nol(c("lib/override/wrap/built/a.js")));
                t.is(nol(c("lib/override/wrap/expected/b.js")),
                     nol(c("lib/override/wrap/built/b.js")));
                t.is(nol(c("lib/override/wrap/expected/c.js")),
                     nol(c("lib/override/wrap/built/c.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();


    //Do not removeCombined files that are outside the build dir.
    //https://github.com/requirejs/requirejs/issues/755
    doh.register("removeCombinedPaths",
        [
            function removeCombinedPaths(t) {
                file.deleteFile("lib/removeCombinedPaths/testcase/project/build/build_output");

                build(["lib/removeCombinedPaths/testcase/project/build/build.js"]);


                t.is(true, file.exists("lib/removeCombinedPaths/testcase/lib/main.js"));
                t.is(true, file.exists("lib/removeCombinedPaths/testcase/project/build/build_output/main.js"));

                require._buildReset();
            }

        ]
    );
    doh.run();


    //Test single file JS optimization with source map generation
    doh.register("unicode",
        [
            function unicode(t) {
                file.deleteFile("lib/unicode/main-built.js");

                build(["lib/unicode/build.js"]);

                t.is(nol(c("lib/unicode/expected.js")),
                     nol(c("lib/unicode/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Do not go into already concatenated files with an internal define
    //https://github.com/requirejs/requirejs/issues/883
    doh.register("umd",
        [
            function umd(t) {
                file.deleteFile("lib/umd/main-built.js");

                build(["lib/umd/build.js"]);

                t.is(nol(c("lib/umd/expected.js")),
                     nol(c("lib/umd/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Detect !function(e) {... define([], e) UMD wrappers
    //https://github.com/requirejs/requirejs/issues/733
    doh.register("umd2",
        [
            function umd2(t) {
                file.deleteFile("lib/umd2/built.js");

                build(["lib/umd2/build.js"]);

                t.is(nol(c("lib/umd2/expected.js")),
                     nol(c("lib/umd2/built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Detect !function(e) {... define(e) UMD wrappers
    //https://github.com/requirejs/requirejs/issues/833
    doh.register("umd3",
        [
            function umd2(t) {
                file.deleteFile("lib/umd3/app-built.js");

                build(["lib/umd3/build.js"]);

                t.is(nol(c("lib/umd3/expected.js")),
                     nol(c("lib/umd3/app-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Possible style of UMD wrapper used in TypeScript
    //https://github.com/requirejs/requirejs/issues/857
    doh.register("umd4",
        [
            function umd4(t) {
                file.deleteFile("lib/umd4/app-built.js");

                build(["lib/umd4/build.js"]);

                t.is(nol(c("lib/umd4/expected.js")),
                     nol(c("lib/umd4/app-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Do not not find nested deps in a UMD wrapper
    //https://github.com/requirejs/requirejs/issues/651
    doh.register("umdNested",
        [
            function umdNested(t) {
                file.deleteFile("lib/umdNested/main-built.js");

                build(["lib/umdNested/build.js"]);

                t.is(nol(c("lib/umdNested/expected.js")),
                     nol(c("lib/umdNested/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Keep parsing if a define uses an identifier, but is not part of
    //a function wrapper for UMD
    //https://github.com/requirejs/requirejs/issues/1133
    doh.register("nonUmdIdentifiers",
        [
            function nonUmdIdentifiers(t) {
                file.deleteFile("lib/nonUmdIdentifiers/main-built.js");

                build(["lib/nonUmdIdentifiers/build.js"]);

                t.is(nol(c("lib/nonUmdIdentifiers/expected.js")),
                     nol(c("lib/nonUmdIdentifiers/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //out function should get source map if available.
    //https://github.com/requirejs/r.js/issues/590
    doh.register("sourcemapOutFunction",
        [
            function sourcemapOutFunction(t) {

                var ugly, plain,
                    config = {
                        baseUrl: 'lib/sourcemapOutFunction/js',
                        generateSourceMaps: true,
                        preserveLicenseComments: false,
                        name: 'main'
                    };

                build(lang.mixin({
                    optimize: 'uglify2',
                    out: function (text, sourceMap) {
                        ugly = {
                            text: text,
                            sourceMap: sourceMap
                        };
                    }
                }, config));

                require._buildReset();

                build(lang.mixin({
                    optimize: 'none',
                    out: function (text, sourceMap) {
                        plain = {
                            text: text,
                            sourceMap: sourceMap
                        };
                    }
                }, config));

                /*
                console.log(ugly.text);
                console.log('=======');
                console.log(ugly.sourceMap);
                console.log('== NONE ==');
                console.log(plain.text);
                console.log('=======');
                console.log(plain.sourceMap);
                */

                t.is(true, !!plain.text, 'has plain text');
                t.is(true, !!ugly.text, 'has uglified text');
                t.is(true, plain.text !== ugly.text, 'texts are not equal');
                t.is(true, plain.sourceMap !== ugly.sourceMap, 'source maps are not equal');

                ugly.sourceMap = JSON.parse(ugly.sourceMap);
                plain.sourceMap = JSON.parse(plain.sourceMap);

                t.is(true, !!ugly.sourceMap.sourcesContent, 'has uglified sourcesContent');
                t.is(true, !!plain.sourceMap.sourcesContent, 'has plain sourcesContent');
                t.is(true, plain.sourceMap.mappings !== ugly.sourceMap.mappings, 'mappings are not equal');

                require._buildReset();

            }

        ]
    );
    doh.run();

    //https://github.com/requirejs/r.js/issues/479
    doh.register("allowSourceOverwrites",
        [
            function allowSourceOverwrites(t) {
                file.deleteFile("lib/allowSourceOverwrites/output/main.js");

                build(["lib/allowSourceOverwrites/build.js"]);

                t.is(nol(c("lib/allowSourceOverwrites/expected.js")),
                     nol(c("lib/allowSourceOverwrites/output/main.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Confirm dot trimming still works as usual.
    //https://github.com/requirejs/requirejs/issues/1129
    doh.register("dotTrim",
        [
            function dotTrim(t) {
                file.deleteFile("lib/dotTrim/built.js");

                build(["lib/dotTrim/build.js"]);

                t.is(nol(c("lib/dotTrim/expected.js")),
                     nol(c("lib/dotTrim/built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Confirm that the UMD skipping still finds jQuery-type inner
    //defines inside a partial, non-AMD UMD wrapper.
    //https://github.com/requirejs/r.js/issues/704
    doh.register("nojQDupeDefine",
        [
            function nojQDupeDefine(t) {
                file.deleteFile("lib/nojQDupeDefine/built.js");

                build(["lib/nojQDupeDefine/build.js"]);

                t.is(nol(c("lib/nojQDupeDefine/expected.js")),
                     nol(c("lib/nojQDupeDefine/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Deal with some build config files that could be compile outputs from
    //other languages, like typescript.
    //https://github.com/requirejs/r.js/issues/767
    doh.register("typescriptConfig",
        [
            function typescriptConfig(t) {
                file.deleteFile("lib/typescriptConfig/main-built.js");

                build(["lib/typescriptConfig/build.js"]);

                t.is(nol(c("lib/typescriptConfig/expected.js")),
                     nol(c("lib/typescriptConfig/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Allow arrow functions in require/define APIs
    //https://github.com/requirejs/r.js/issues/800
    doh.register("arrowFunctions",
        [
            function arrowFunctions(t) {
                file.deleteFile("lib/arrow/main-built.js");

                build(["lib/arrow/build.js"]);

                t.is(nol(c("lib/arrow/expected.js")),
                     nol(c("lib/arrow/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //See https://github.com/requirejs/r.js/pull/796
    doh.register("periodInNameConfig",
        [
            function periodInNameConfig(t) {
                file.deleteFile("lib/periodInNameConfig/out");

                build(["lib/periodInNameConfig/build.js"]);

                t.is(nol(c("lib/periodInNameConfig/scripts/main.js")),
                     nol(c("lib/periodInNameConfig/out/main.js")));

                t.is(nol(c("lib/periodInNameConfig/components/foo.bar.js")),
                     nol(c("lib/periodInNameConfig/out/foo.bar.js")));
                require._buildReset();
            }

        ]
    );
    doh.run();

    //Do not warn about unloaded loader plugin resources if they enter the build
    //via named define calls.
    //https://github.com/requirejs/r.js/issues/815
    doh.register("inlineDefineNoRequire",
        [
            function inlineDefineNoRequire(t) {
                file.deleteFile("lib/inlineDefineNoRequire/testmodule-built.js");

                build(["lib/inlineDefineNoRequire/build.js"]);

                t.is(nol(c("lib/inlineDefineNoRequire/expected.js")),
                     nol(c("lib/inlineDefineNoRequire/testmodule-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //Allow define('id', depsAsIdentifier, function(){}) in files
    //https://github.com/requirejs/r.js/issues/825
    doh.register("dynamicDefine",
        [
            function dynamicDefine(t) {
                file.deleteFile("lib/dynamicDefine/main-built.js");

                build(["lib/dynamicDefine/build.js"]);

                t.is(nol(c("lib/dynamicDefine/expected.js")),
                     nol(c("lib/dynamicDefine/main-built.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

    //When running in Rhino and using Closure for optimization,
    //it should be possible to declare externs for Closure's
    //ADVANCED_OPTIMIZATION mode.
    //https://github.com/requirejs/r.js/issues/860
    if (env.get() === 'rhino') {
        doh.register("closureExterns",
            [
                function closureExterns(t) {
                    file.deleteFile("lib/closureExterns/built");

                    build(["lib/closureExterns/build.js"]);
                    var contents = c("lib/closureExterns/built/built.js");
                    //Without a working externs definition, these property
                    //names are typically replaced with one-character aliases.
                    t.is(true, /define\.amd/.test(contents));
                    t.is(true, /module\.exports/.test(contents));

                    require._buildReset();
                }
            ]
        );
        doh.run();
    }

    doh.register("sourcemapWrap",
    [
        function sourcemapWrap(t) {
            file.deleteFile("lib/sourcemapWrap/built");

            build(["lib/sourcemapWrap/build-with-wrap.js"]);
            build(["lib/sourcemapWrap/build-without-wrap.js"]);

            var withWrapMap = c("lib/sourcemapWrap/built/built-with-wrap.js.map");
            var withoutWrapMap = c("lib/sourcemapWrap/built/built-without-wrap.js.map");
            var withWrapObject = JSON.parse(withWrapMap);
            var withoutWrapObject = JSON.parse(withoutWrapMap);

            t.isNot(withoutWrapObject.mappings, withWrapObject.mappings, "Mappings with and without the wrapping code should differ");

            require._buildReset();
        }
    ]);
    doh.run();

    //Test writing bundles config.
    //See https://github.com/requirejs/r.js/issues/613
    doh.register("writeBundlesConfig",
        [
            function writeBundlesConfig(t) {
                file.deleteFile("lib/bundlesConfig/built");

                build(["lib/bundlesConfig/build.js"]);

                t.is(nol(c("lib/bundlesConfig/expected.js")),
                     nol(c("lib/bundlesConfig/built/main.js")));
                require._buildReset();
            }

        ]
    );
    doh.run();

});
