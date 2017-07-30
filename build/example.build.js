/*
 * This is an example build file that demonstrates how to use the build system for
 * require.js.
 *
 * THIS BUILD FILE WILL NOT WORK. It is referencing paths that probably
 * do not exist on your machine. Just use it as a guide.
 *
 *
 */

({
    //The top level directory that contains your app. If this option is used
    //then it assumed your scripts are in a subdirectory under this path.
    //This option is not required. If it is not specified, then baseUrl
    //below is the anchor point for finding things. If this option is specified,
    //then all the files from the app directory will be copied to the dir:
    //output area, and baseUrl will assume to be a relative path under
    //this directory.
    appDir: "some/path/",

    //By default, all modules are located relative to this path. If baseUrl
    //is not explicitly set, then all modules are loaded relative to
    //the directory that holds the build file. If appDir is set, then
    //baseUrl should be specified as relative to the appDir.
    baseUrl: "./",

    //By default all the configuration for optimization happens from the command
    //line or by properties in the config file, and configuration that was
    //passed to requirejs as part of the app's runtime "main" JS file is *not*
    //considered. However, if you prefer the "main" JS file configuration
    //to be read for the build so that you do not have to duplicate the values
    //in a separate configuration, set this property to the location of that
    //main JS file. The first requirejs({}), require({}), requirejs.config({}),
    //or require.config({}) call found in that file will be used.
    //As of 2.1.10, mainConfigFile can be an array of values, with the last
    //value's config take precedence over previous values in the array.
    mainConfigFile: '../some/path/to/main.js',

    //Set paths for modules. If relative paths, set relative to baseUrl above.
    //If a special value of "empty:" is used for the path value, then that
    //acts like mapping the path to an empty file. It allows the optimizer to
    //resolve the dependency to path, but then does not include it in the output.
    //Useful to map module names that are to resources on a CDN or other
    //http: URL when running in the browser and during an optimization that
    //file should be skipped because it has no dependencies.
    //e.g. if you wish to include `jquery` and `angularjs` from public CDNs,
    //paths: { "jquery": "empty:", "angular": "empty:" }
    paths: {
        "foo.bar": "../scripts/foo/bar",
        "baz": "../another/path/baz"
    },

    //Sets up a map of module IDs to other module IDs. For more details, see
    //the http://requirejs.org/docs/api.html#config-map docs.
    map: {},

    //Configure CommonJS packages. See http://requirejs.org/docs/api.html#packages
    //for more information.
    packages: [],

    //The directory path to save the output. If not specified, then
    //the path will default to be a directory called "build" as a sibling
    //to the build file. All relative paths are relative to the build file.
    dir: "../some/path",

    //As of RequireJS 2.0.2, the dir above will be deleted before the
    //build starts again. If you have a big build and are not doing
    //source transforms with onBuildRead/onBuildWrite, then you can
    //set keepBuildDir to true to keep the previous dir. This allows for
    //faster rebuilds, but it could lead to unexpected errors if the
    //built code is transformed in some way.
    keepBuildDir: false,

    //If shim config is used in the app during runtime, duplicate the config
    //here. Necessary if shim config is used, so that the shim's dependencies
    //are included in the build. Using "mainConfigFile" is a better way to
    //pass this information though, so that it is only listed in one place.
    //However, if mainConfigFile is not an option, the shim config can be
    //inlined in the build config.
    shim: {},

    //As of 2.1.11, shimmed dependencies can be wrapped in a define() wrapper
    //to help when intermediate dependencies are AMD have dependencies of their
    //own. The canonical example is a project using Backbone, which depends on
    //jQuery and Underscore. Shimmed dependencies that want Backbone available
    //immediately will not see it in a build, since AMD compatible versions of
    //Backbone will not execute the define() function until dependencies are
    //ready. By wrapping those shimmed dependencies, this can be avoided, but
    //it could introduce other errors if those shimmed dependencies use the
    //global scope in weird ways, so it is not the default behavior to wrap.
    //To use shim wrapping skipModuleInsertion needs to be false.
    //More notes in http://requirejs.org/docs/api.html#config-shim
    wrapShim: false,

    //Used to inline i18n resources into the built file. If no locale
    //is specified, i18n resources will not be inlined. Only one locale
    //can be inlined for a build. Root bundles referenced by a build layer
    //will be included in a build layer regardless of locale being set.
    locale: "en-us",

    //How to optimize (minify) all the JS files in the build output directory.
    //Right now only the following values
    //are supported:
    //- "uglify": (default) uses UglifyJS to minify the code. Before version
    //2.2, the uglify version was a 1.3.x release. With r.js 2.2, it is now
    //a 2.x uglify release. Only supports ES5 syntax. For ES 2015 or later, use
    //the "none" option instead.
    //- "uglify2": in version 2.1.2+. Uses UglifyJS2. As of r.js 2.2, this
    //is just an alias for "uglify" now that 2.2 just uses uglify 2.x.
    //- "closure": uses Google's Closure Compiler in simple optimization
    //mode to minify the code. Only available if running the optimizer using
    //Java.
    //- "closure.keepLines": Same as closure option, but keeps line returns
    //in the minified files.
    //- "none": no minification will be done. Use this setting if you are using
    //ES 2015 or later syntax in your files, since the bundled UglifyJS only
    //understands ES5 and earlier syntax. For ES2015 code, run a compliant
    // minifier as a separate step after running r.js.
    optimize: "uglify",

    //Introduced in 2.1.2: If using "dir" for an output directory, normally the
    //optimize setting is used to optimize the build bundles (the "modules"
    //section of the config) and any other JS file in the directory. However, if
    //the non-build bundle JS files will not be loaded after a build, you can
    //skip the optimization of those files, to speed up builds. Set this value
    //to true if you want to skip optimizing those other non-build bundle JS
    //files.
    skipDirOptimize: false,

    //Introduced in 2.1.2 and considered experimental.
    //If the minifier specified in the "optimize" option supports generating
    //source maps for the minified code, then generate them. The source maps
    //generated only translate minified JS to non-minified JS, it does not do
    //anything magical for translating minified JS to transpiled source code.
    //Currently only optimize: "uglify2" is supported when running in node or
    //rhino, and if running in rhino, "closure" with a closure compiler jar
    //build after r1592 (20111114 release).
    //The source files will show up in a browser developer tool that supports
    //source maps as ".js.src" files.
    generateSourceMaps: false,

    //Introduced in 2.1.1: If a full directory optimization ("dir" is used), and
    //optimize is not "none", and skipDirOptimize is false, then normally all JS
    //files in the directory will be minified, and this value is automatically
    //set to "all". For JS files to properly work after a minification, the
    //optimizer will parse for define() calls and insert any dependency arrays
    //that are missing. However, this can be a bit slow if there are many/larger
    //JS files. So this transport normalization is not done (automatically set
    //to "skip") if optimize is set to "none". Cases where you may want to
    //manually set this value:
    //1) Optimizing later: if you plan on minifying the non-build bundle JS files
    //after the optimizer runs (so not as part of running the optimizer), then
    //you should explicitly this value to "all".
    //2) Optimizing, but not dynamically loading later: you want to do a full
    //project optimization, but do not plan on dynamically loading non-build
    //bundle JS files later. In this case, the normalization just slows down
    //builds, so you can explicitly set this value to "skip".
    //Finally, all build bundles (specified in the "modules" or "out" setting)
    //automatically get normalization, so this setting does not apply to those
    //files.
    normalizeDirDefines: "skip",

    //If using UglifyJS for script optimization, these config options can be
    //used to pass configuration values to UglifyJS.
    //In r.js 2.2, this is now just uglify2, so see the 'uglify2' section below
    //for example options. For r.js pre-2.2, this was for setting uglify 1.3.x
    //options.
    uglify: {
    },

    //If using UglifyJS2 for script optimization, these config options can be
    //used to pass configuration values to UglifyJS2. As of r.js 2.2, UglifyJS2
    //is the only uglify option, so the config key can just be 'uglify' for
    //r.js 2.2+.
    //For possible `output` values see:
    //https://github.com/mishoo/UglifyJS2#beautifier-options
    //For possible `compress` values see:
    //https://github.com/mishoo/UglifyJS2#compressor-options
    uglify2: {
        //Example of a specialized config. If you are fine
        //with the default options, no need to specify
        //any of these properties.
        output: {
            beautify: true
        },
        compress: {
            sequences: false,
            global_defs: {
                DEBUG: false
            }
        },
        warnings: true,
        mangle: false
    },

    //If using Closure Compiler for script optimization, these config options
    //can be used to configure Closure Compiler. See the documentation for
    //Closure compiler for more information.
    closure: {
        CompilerOptions: {},
        CompilationLevel: 'SIMPLE_OPTIMIZATIONS',
        loggingLevel: 'WARNING',
        externExportsPath: './extern.js'
    },

    //Allow CSS optimizations. Allowed values:
    //- "standard": @import inlining and removal of comments, unnecessary
    //whitespace and line returns.
    //Removing line returns may have problems in IE, depending on the type
    //of CSS.
    //- "standard.keepLines": like "standard" but keeps line returns.
    //- "none": skip CSS optimizations.
    //- "standard.keepComments": keeps the file comments, but removes line
    //returns.  (r.js 1.0.8+)
    //- "standard.keepComments.keepLines": keeps the file comments and line
    //returns. (r.js 1.0.8+)
    //- "standard.keepWhitespace": like "standard" but keeps unnecessary whitespace.
    optimizeCss: "standard.keepLines.keepWhitespace",

    //If optimizeCss is in use, a list of files to ignore for the @import
    //inlining. The value of this option should be a string of comma separated
    //CSS file names to ignore (like 'a.css,b.css'. The file names should match
    //whatever strings are used in the @import calls.
    cssImportIgnore: null,

    //cssIn is typically used as a command line option. It can be used
    //along with out to optimize a single CSS file.
    cssIn: "path/to/main.css",
    out: "path/to/css-optimized.css",

    //If "out" is not in the same directory as "cssIn", and there is a relative
    //url() in the cssIn file, use this to set a prefix URL to use. Only set it
    //if you find a problem with incorrect relative URLs after optimization.
    cssPrefix: "",

    //Inlines the text for any text! dependencies, to avoid the separate
    //async XMLHttpRequest calls to load those dependencies.
    inlineText: true,

    //Allow "use strict"; be included in the RequireJS files.
    //Default is false because there are not many browsers that can properly
    //process and give errors on code for ES5 strict mode,
    //and there is a lot of legacy code that will not work in strict mode.
    useStrict: false,

    //Specify build pragmas. If the source files contain comments like so:
    //>>excludeStart("fooExclude", pragmas.fooExclude);
    //>>excludeEnd("fooExclude");
    //Then the comments that start with //>> are the build pragmas.
    //excludeStart/excludeEnd and includeStart/includeEnd work, and the
    //the pragmas value to the includeStart or excludeStart lines
    //is evaluated to see if the code between the Start and End pragma
    //lines should be included or excluded. If you have a choice to use
    //"has" code or pragmas, use "has" code instead. Pragmas are harder
    //to read, but they can be a bit more flexible on code removal vs.
    //has-based code, which must follow JavaScript language rules.
    //Pragmas also remove code in non-minified source, where has branch
    //trimming is only done if the code is minified via UglifyJS or
    //Closure Compiler.
    pragmas: {
        fooExclude: true
    },

    //Same as "pragmas", but only applied once during the file save phase
    //of an optimization. "pragmas" are applied both during the dependency
    //mapping and file saving phases on an optimization. Some pragmas
    //should not be processed during the dependency mapping phase of an
    //operation, such as the pragma in the CoffeeScript loader plugin,
    //which wants the CoffeeScript compiler during the dependency mapping
    //phase, but once files are saved as plain JavaScript, the CoffeeScript
    //compiler is no longer needed. In that case, pragmasOnSave would be used
    //to exclude the compiler code during the save phase.
    pragmasOnSave: {
        //Just an example
        excludeCoffeeScript: true
    },

    //Allows trimming of code branches that use has.js-based feature detection:
    //https://github.com/phiggins42/has.js
    //The code branch trimming only happens if minification with UglifyJS or
    //Closure Compiler is done. For more information, see:
    //http://requirejs.org/docs/optimization.html#hasjs
    has: {
        'function-bind': true,
        'string-trim': false
    },

    //Similar to pragmasOnSave, but for has tests -- only applied during the
    //file save phase of optimization, where "has" is applied to both
    //dependency mapping and file save phases.
    hasOnSave: {
        'function-bind': true,
        'string-trim': false
    },

    //Allows namespacing requirejs, require and define calls to a new name.
    //This allows stronger assurances of getting a module space that will
    //not interfere with others using a define/require AMD-based module
    //system. The example below will rename define() calls to foo.define().
    //See http://requirejs.org/docs/faq-advanced.html#rename for a more
    //complete example.
    namespace: 'foo',

    //Skip processing for pragmas.
    skipPragmas: false,

    //If skipModuleInsertion is false, then files that do not use define()
    //to define modules will get a define() placeholder inserted for them.
    //Also, require.pause/resume calls will be inserted.
    //Set it to true to avoid this. This is useful if you are building code that
    //does not use require() in the built project or in the JS files, but you
    //still want to use the optimization tool from RequireJS to concatenate modules
    //together.
    skipModuleInsertion: false,

    //Specify modules to stub out in the optimized file. The optimizer will
    //use the source version of these modules for dependency tracing and for
    //plugin use, but when writing the text into an optimized bundle, these
    //modules will get the following text instead:
    //If the module is used as a plugin:
    //    define({load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
    //If just a plain module:
    //    define({});
    //This is useful particularly for plugins that inline all their resources
    //and use the default module resolution behavior (do *not* implement the
    //normalize() method). In those cases, an AMD loader just needs to know
    //that the module has a definition. These small stubs can be used instead of
    //including the full source for a plugin.
    stubModules: ['text', 'bar'],

    //If it is not a one file optimization, scan through all .js files in the
    //output directory for any plugin resource dependencies, and if the plugin
    //supports optimizing them as separate files, optimize them. Can be a
    //slower optimization. Only use if there are some plugins that use things
    //like XMLHttpRequest that do not work across domains, but the built code
    //will be placed on another domain.
    optimizeAllPluginResources: false,

    //Finds require() dependencies inside a require() or define call. By default
    //this value is false, because those resources should be considered dynamic/runtime
    //calls. However, for some optimization scenarios, it is desirable to
    //include them in the build.
    //Introduced in 1.0.3. Previous versions incorrectly found the nested calls
    //by default.
    findNestedDependencies: false,

    //If set to true, any files that were combined into a build bundle will be
    //removed from the output folder.
    removeCombined: false,

    //List the modules that will be optimized. All their immediate and deep
    //dependencies will be included in the module's file when the build is
    //done. If that module or any of its dependencies includes i18n bundles,
    //only the root bundles will be included unless the locale: section is set above.
    modules: [
        //Just specifying a module name means that module will be converted into
        //a built file that contains all of its dependencies. If that module or any
        //of its dependencies includes i18n bundles, they may not be included in the
        //built file unless the locale: section is set above.
        {
            name: "foo/bar/bop",

            //create: true can be used to create the module layer at the given
            //name, if it does not already exist in the source location. If
            //there is a module at the source location with this name, then
            //create: true is superfluous.
            create: true,

            //For build profiles that contain more than one modules entry,
            //allow overrides for the properties that set for the whole build,
            //for example a different set of pragmas for this module.
            //The override's value is an object that can
            //contain any of the other build options in this file.
            override: {
                pragmas: {
                    fooExclude: true
                }
            }
        },

        //This module entry combines all the dependencies of foo/bar/bop and foo/bar/bee
        //and any of their dependencies into one file.
        {
            name: "foo/bar/bop",
            include: ["foo/bar/bee"]
        },

        //This module entry combines all the dependencies of foo/bar/bip into one file,
        //but excludes foo/bar/bop and its dependencies from the built file. If you want
        //to exclude a module that is also another module being optimized, it is more
        //efficient if you define that module optimization entry before using it
        //in an exclude array.
        {
            name: "foo/bar/bip",
            exclude: [
                "foo/bar/bop"
            ]
        },

        //This module entry shows how to specify a specific module be excluded
        //from the built module file. excludeShallow means just exclude that
        //specific module, but if that module has nested dependencies that are
        //part of the built file, keep them in there. This is useful during
        //development when you want to have a fast bundled set of modules, but
        //just develop/debug one or two modules at a time.
        {
            name: "foo/bar/bin",
            excludeShallow: [
                "foo/bar/bot"
            ]
        },

        //This module entry shows the use insertRequire (first available in 2.0):
        {
            name: "foo/baz",
            insertRequire: ["foo/baz"]
        }
    ],

    //If the target module only calls define and does not call require() at the
    //top level, and this build output is used with an AMD shim loader like
    //almond, where the data-main script in the HTML page is replaced with just
    //a script to the built file, if there is no top-level require, no modules
    //will execute. specify insertRequire to have a require([]) call placed at
    //the end of the file to trigger the execution of modules. More detail at
    //https://github.com/requirejs/almond
    //Note that insertRequire does not affect or add to the modules that are
    //built into the build bundle. It just adds a require([]) call to the end
    //of the built file for use during the runtime execution of the built code.
    insertRequire: ['foo/bar/bop'],

    //If you only intend to optimize a module (and its dependencies), with
    //a single file as the output, you can specify the module options inline,
    //instead of using the 'modules' section above. 'exclude',
    //'excludeShallow', 'include' and 'insertRequire' are all allowed as siblings
    //to name. The name of the optimized file is specified by 'out'.
    name: "foo/bar/bop",
    include: ["foo/bar/bee"],
    insertRequire: ['foo/bar/bop'],
    out: "path/to/optimized-file.js",

    //An alternative to "include". Normally only used in a requirejs.config()
    //call for a module used for mainConfigFile, since requirejs will read
    //"deps" during runtime to do the equivalent of require(deps) to kick
    //off some module loading.
    deps: ["foo/bar/bee"],

    //In RequireJS 2.0, "out" can be a function. For single JS file
    //optimizations that are generated by calling requirejs.optimize(),
    //using an out function means the optimized contents are not written to
    //a file on disk, but instead pass to the out function:
    out: function (text, sourceMapText) {
        //Do what you want with the optimized text here.
        //Starting in 2.1.10, if generateSourceMaps was set to true
        //and optimize: 'uglify2' was used ('uglify' in r.js 2.2+), then the
        //second argument to this function, sourceMapText, will be the text of
        //the source map.
    },

    //In 2.0.12+: by setting "out" to "stdout", the optimized output is written
    //to STDOUT. This can be useful for integrating r.js with other commandline
    //tools. In order to avoid additional output "logLevel: 4" should also be used.
    out: "stdout",

    //Wrap any build bundle in a start and end text specified by wrap.
    //Use this to encapsulate the module code so that define/require are
    //not globals. The end text can expose some globals from your file,
    //making it easy to create stand-alone libraries that do not mandate
    //the end user use requirejs.
    wrap: {
        start: "(function() {",
        end: "}());"
    },

    //Another way to use wrap, but uses default wrapping of:
    //(function() { + content + }());
    wrap: true,

    //Another way to use wrap, but uses file paths. This makes it easier
    //to have the start text contain license information and the end text
    //to contain the global variable exports, like
    //window.myGlobal = requirejs('myModule');
    //File paths are relative to the build file, or if running a commmand
    //line build, the current directory.
    wrap: {
        startFile: "parts/start.frag",
        endFile: "parts/end.frag"
    },

    //As of r.js 2.1.0, startFile and endFile can be arrays of files, and
    //they will all be loaded and inserted at the start or end, respectively,
    //of the build bundle.
    wrap: {
        startFile: ["parts/startOne.frag", "parts/startTwo.frag"],
        endFile: ["parts/endOne.frag", "parts/endTwo.frag"]
    },

    //When the optimizer copies files from the source location to the
    //destination directory, it will skip directories and files that start
    //with a ".". If you want to copy .directories or certain .files, for
    //instance if you keep some packages in a .packages directory, or copy
    //over .htaccess files, you can set this to null. If you want to change
    //the exclusion rules, change it to a different regexp. If the regexp
    //matches, it means the directory will be excluded. This used to be
    //called dirExclusionRegExp before the 1.0.2 release.
    //As of 1.0.3, this value can also be a string that is converted to a
    //RegExp via new RegExp().
    fileExclusionRegExp: /^\./,

    //By default, comments that have a license in them are preserved in the
    //output when a minifier is used in the "optimize" option.
    //However, for a larger built files there could be a lot of
    //comment files that may be better served by having a smaller comment
    //at the top of the file that points to the list of all the licenses.
    //This option will turn off the auto-preservation, but you will need
    //work out how best to surface the license information.
    //NOTE: As of 2.1.7, if using xpcshell to run the optimizer, it cannot
    //parse out comments since its native Reflect parser is used, and does
    //not have the same comments option support as esprima.
    preserveLicenseComments: true,

    //Sets the logging level. It is a number. If you want "silent" running,
    //set logLevel to 4. From the logger.js file:
    //TRACE: 0,
    //INFO: 1,
    //WARN: 2,
    //ERROR: 3,
    //SILENT: 4
    //Default is 0.
    logLevel: 0,

    //Introduced in 2.1.3: Some situations do not throw and stop the optimizer
    //when an error occurs. However, you may want to have the optimizer stop
    //on certain kinds of errors and you can configure those situations via
    //this option
    throwWhen: {
        //If there is an error calling the minifier for some JavaScript,
        //instead of just skipping that file throw an error.
        optimize: true
    },

    //A function that if defined will be called for every file read in the
    //build that is done to trace JS dependencies. This allows transforms of
    //the content.
    onBuildRead: function (moduleName, path, contents) {
        //Always return a value.
        //This is just a contrived example.
        return contents.replace(/foo/g, 'bar');
    },

    //A function that will be called for every write to an optimized bundle
    //of modules. This allows transforms of the content before serialization.
    onBuildWrite: function (moduleName, path, contents) {
        //Always return a value.
        //This is just a contrived example.
        return contents.replace(/bar/g, 'foo');
    },

    //A function that is called for each JS module bundle that has been
    //completed. This function is called after all module bundles have
    //completed, but it is called for each bundle. A module bundle is a
    //"modules" entry or if just a single file JS optimization, the
    //optimized JS file.
    //Introduced in r.js version 2.1.6
    onModuleBundleComplete: function (data) {
        /*
        data.name: the bundle name.
        data.path: the bundle path relative to the output directory.
        data.included: an array of items included in the build bundle.
        If a file path, it is relative to the output directory. Loader
        plugin IDs are also included in this array, but depending
        on the plugin, may or may not have something inlined in the
        module bundle.
        */
    },

    //Introduced in 2.1.3: Seed raw text contents for the listed module IDs.
    //These text contents will be used instead of doing a file IO call for
    //those modules. Useful if some module ID contents are dynamically
    //based on user input, which is common in web build tools.
    rawText: {
        'some/id': 'define(["another/id"], function () {});'
    },

    //Introduced in 2.0.2: if set to true, then the optimizer will add a
    //define(require, exports, module) {}); wrapper around any file that seems
    //to use commonjs/node module syntax (require, exports) without already
    //calling define(). This is useful to reuse modules that came from
    //or are loadable in an AMD loader that can load commonjs style modules
    //in development as well as AMD modules, but need to have a built form
    //that is only AMD. Note that this does *not* enable different module
    //ID-to-file path logic, all the modules still have to be found using the
    //requirejs-style configuration, it does not use node's node_modules nested
    //path lookups.
    cjsTranslate: true,

    //Introduced in 2.0.2: a bit experimental.
    //Each script in the build bundle will be turned into
    //a JavaScript string with a //# sourceURL comment, and then wrapped in an
    //eval call. This allows some browsers to see each evaled script as a
    //separate script in the script debugger even though they are all combined
    //in the same file. Some important limitations:
    //1) Do not use in IE if conditional comments are turned on, it will cause
    //errors:
    //http://en.wikipedia.org/wiki/Conditional_comment#Conditional_comments_in_JScript
    //2) It is only useful in optimize: 'none' scenarios. The goal is to allow
    //easier built bundle debugging, which goes against minification desires.
    useSourceUrl: true,

    //Defines the loading time for modules. Depending on the complexity of the
    //dependencies and the size of the involved libraries, increasing the wait
    //interval may be required. Default is 7 seconds. Setting the value to 0
    //disables the waiting interval.
    waitSeconds: 7,

    //Introduced in 2.1.9: normally r.js inserts a semicolon at the end of a
    //file if there is not already one present, to avoid issues with
    //concatenated files and automatic semicolon insertion  (ASI) rules for
    //JavaScript. It is a very blunt fix that is safe to do, but if you want to
    //lint the build output, depending on the linter rules, it may not like it.
    //Setting this option to true skips this insertion. However, by doing this,
    //you take responsibility for making sure your concatenated code works with
    //JavaScript's ASI rules, and that you use a minifier that understands when
    //to insert semicolons to avoid ASI pitfalls.
    skipSemiColonInsertion: false,

    //Introduced in 2.1.10: if set to true, will not strip amdefine use:
    //https://github.com/requirejs/amdefine
    //Normally you should not need to set this. It is only a concern if using
    //a built .js file from some other source, that may have included amdefine
    //in the built input. If you get a build error like
    //"undefined is not a function" and the file that generated the error
    //references amdefine, then set this to true.
    keepAmdefine: false,

    //Introduced in 2.1.11. As part of fixing a bug to prevent possible
    //overwrites of source code, https://github.com/jrburke/r.js/issues/444,
    //it prevented some cases where generated source is used for a build, and
    //it was OK to overwrite content in this source area as it was generated
    //from another source area, and not allowing source overwrites meant taking
    //another file copy hit. By setting this to true, it allows this sort of
    //source code overwriting. However, use at your own risk, and be sure you
    //have your configuration set correctly. For example, you may want to
    //set "keepBuildDir" to true.
    allowSourceOverwrites: false,

    //Introduced in 2.2.0. Path to file to write out bundles config
    //(http://requirejs.org/docs/api.html#config-bundles) found in the module
    //layers built by the optimizer. The path is relative to the "dir" config's
    //path. Only applies to full project optimization:
    //http://requirejs.org/docs/optimization.html#wholeproject
    //Only use if the optimized layers are grouped more intricately then just
    //a simple optimization of main app entry points. The file path specified
    //should be to one that has the top level requirejs.config() call that sets
    //up the loader. If using "mainConfigFile", then this path likely should be
    //the path to that file where it is placed in the "dir" output directory.
    bundlesConfigOutFile: 'some/path/to/main.js',

    //Introduced in 2.2.0. Default is true for compatibility with older
    //releases. If set to false, r.js will not write a build.txt file in the
    //"dir" directory when doing a full project optimization.
    writeBuildTxt: true
})
