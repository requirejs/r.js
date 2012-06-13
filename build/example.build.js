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
    //line or by properties in the a config file, and configuration that was
    //passed to requirejs as part of the app's runtime "main" JS file is *not*
    //considered. However, if you prefer for the that "main" JS file configuration
    //to be read for the build so that you do not have to duplicate the values
    //in a separate configuration, set this property to the location of that
    //main JS file. The first requirejs({}), require({}), requirejs.config({}),
    //or require.config({}) call found in that file will be used.
    mainConfigFile: '../some/path/to/main.js',

    //Set paths for modules. If relative paths, set relative to baseUrl above.
    //If a special value of "empty:" is used for the path value, then that
    //acts like mapping the path to an empty file. It allows the optimizer to
    //resolve the dependency to path, but then does not include it in the output.
    //Useful to map module names that are to resources on a CDN or other
    //http: URL when running in the browser and during an optimization that
    //file should be skipped because it has no dependencies.
    paths: {
        "foo.bar": "../scripts/foo/bar",
        "baz": "../another/path/baz"
    },

    //Configure CommonJS packages. See http://requirejs.org/docs/api.html#packages
    //for more information.
    packagePaths: [],
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
    keepBuildDir: true,

    //Used to inline i18n resources into the built file. If no locale
    //is specified, i18n resources will not be inlined. Only one locale
    //can be inlined for a build. Root bundles referenced by a build layer
    //will be included in a build layer regardless of locale being set.
    locale: "en-us",

    //How to optimize all the JS files in the build output directory.
    //Right now only the following values
    //are supported:
    //- "uglify": (default) uses UglifyJS to minify the code.
    //- "closure": uses Google's Closure Compiler in simple optimization
    //mode to minify the code. Only available if running the optimizer using
    //Java.
    //- "closure.keepLines": Same as closure option, but keeps line returns
    //in the minified files.
    //- "none": no minification will be done.
    optimize: "uglify",

    //If using UglifyJS for script optimization, these config options can be
    //used to pass configuration values to UglifyJS.
    //See https://github.com/mishoo/UglifyJS for the possible values.
    uglify: {
        toplevel: true,
        ascii_only: true,
        beautify: true,
        max_line_length: 1000
    },

    //If using Closure Compiler for script optimization, these config options
    //can be used to configure Closure Compiler. See the documentation for
    //Closure compiler for more information.
    closure: {
        CompilerOptions: {},
        CompilationLevel: 'SIMPLE_OPTIMIZATIONS',
        loggingLevel: 'WARNING'
    },

    //Allow CSS optimizations. Allowed values:
    //- "standard": @import inlining, comment removal and line returns.
    //Removing line returns may have problems in IE, depending on the type
    //of CSS.
    //- "standard.keepLines": like "standard" but keeps line returns.
    //- "none": skip CSS optimizations.
    //- "standard.keepComments": keeps the file comments, but removes line
    //returns.  (r.js 1.0.8+)
    //- "standard.keepComments.keepLines": keeps the file comments and line
    //returns. (r.js 1.0.8+)
    optimizeCss: "standard.keepLines",

    //If optimizeCss is in use, a list of of files to ignore for the @import
    //inlining. The value of this option should be a comma separated list
    //of CSS file names to ignore. The file names should match whatever
    //strings are used in the @import calls.
    cssImportIgnore: null,

    //cssIn is typically used as a command line option. It can be used
    //along with out to optimize a single CSS file.
    cssIn: "path/to/main.css",
    out: "path/to/css-optimized.css",

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
    //plugin use, but when writing the text into an optimized layer, these
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
    //calls. However, for some optimization scenarios,
    //Introduced in 1.0.3. Previous versions incorrectly found the nested calls
    //by default.
    findNestedDependencies: false,

    //If set to true, any files that were combined into a build layer will be
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
        //if the target module only calls define and does not call require()
        //at the top level, and this build output is used with an AMD shim
        //loader like almond, where the data-main script in the HTML page is
        //replaced with just a script to the built file, if there is no
        //top-level require, no modules will execute. specify insertRequire to
        //have a require([]) call placed at the end of the file to trigger the
        //execution of modules. More detail at
        //https://github.com/jrburke/almond
        //Note that insertRequire does not affect or add to the modules
        //that are built into the build layer. It just adds a require([])
        //call to the end of the built file for use during the runtime
        //execution of the built code.
        {
            name: "foo/baz",
            insertRequire: ["foo/baz"]
        }
    ],

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
    out: function (text) {
        //Do what you want with the optimized text here.
    },

    //Wrap any build layer in a start and end text specified by wrap.
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
        startFile: "part/start.frag",
        endFile: "parts/end.frag"
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
    //output. However, for a larger built files there could be a lot of
    //comment files that may be better served by having a smaller comment
    //at the top of the file that points to the list of all the licenses.
    //This option will turn off the auto-preservation, but you will need
    //work out how best to surface the license information.
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
    //Each script in the build layer will be turned into
    //a JavaScript string with a //@ sourceURL comment, and then wrapped in an
    //eval call. This allows some browsers to see each evaled script as a
    //separate script in the script debugger even though they are all combined
    //in the same file. Some important limitations:
    //1) Do not use in IE if conditional comments are turned on, it will cause
    //errors:
    //http://en.wikipedia.org/wiki/Conditional_comment#Conditional_comments_in_JScript
    //2) It is only useful in optimize: 'none' scenarios. The goal is to allow
    //easier built layer debugging, which goes against minification desires.
    useSourceUrl: true
})
