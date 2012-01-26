/*jslint plusplus: false, nomen: false, strict: false */
/*global define: false, require: false, doh: false */

define(['build', 'env!env/file'], function (build, file) {
    //Remove any old builds
    file.deleteFile("builds");

    function c(fileName) {
        return file.readFile(fileName);
    }

    //Remove line returns to make comparisons easier.
    function nol(contents) {
        return contents.replace(/[\r\n]/g, "");
    }

    //Do a build of the text plugin to get any pragmas processed.
    build(["name=text", "baseUrl=../../../requirejs", "out=builds/text.js", "optimize=none"]);

    //Reset build state for next run.
    require._buildReset();

    var requireTextContents = c("builds/text.js"),
        oneResult = [
            c("../../../requirejs/tests/dimple.js"),
            c("../../../requirejs/tests/two.js"),
            c("../../../requirejs/tests/one.js"),
            ";"
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
                       "baseUrl=../../../requirejs/tests", "paths.text=../text", "optimize=none"]);

                t.is(nol(requireTextContents +
                         nol(c("../../../requirejs/tests/two.js") +
                         c("../../../requirejs/tests/one.js") + ";")), nol(c("builds/oneText.js")));
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
                       "paths.text=../../../text", "optimize=none"]);

                t.is(nol(nol((c("../../../requirejs/tests/plugins/fromText/a.refine"))
                             .replace(/refine/g, 'define')))
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

    doh.register("useDotPackage",
        [
            function useDotPackage(t) {
                file.deleteFile("lib/dotpackage/built");

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
                file.deleteFile("lib/empty/built");

                build(["lib/empty/build.js"]);

                t.is(nol(c("lib/empty/expected.js")),
                     nol(c("lib/empty/built/main.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();

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

});
