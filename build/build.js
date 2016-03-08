/*
 * Create a build.js file that has the build options you want and pass that
 * build file to this file to do the build. See example.build.js for more information.
 */

/*jslint strict: false, nomen: false */
/*global require: false */

require({
    baseUrl: require.s.contexts._.config.baseUrl,
    //Use a separate context than the default context so that the
    //build can use the default context.
    context: 'build',
    catchError: {
        define: true
    }
},       ['env!env/args', 'env!env/quit', 'logger', 'build'],
function (args, quit, logger, build) {
    build(args).then(function () {}, function (err) {
        logger.error(err);
        quit(1);
    });
});
