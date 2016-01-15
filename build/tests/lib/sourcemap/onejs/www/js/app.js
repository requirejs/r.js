require.config({
    baseUrl: 'js/lib',
    paths: {
        app: '../app',
        text: 'text/text'
    }
});

/**
 * A test of source maps on a concatenated, but not minified file.
 */
require(['app/main'], function (main) {
    console.log('in top level callback');
    console.log(main.a.doSomething('world'));
    console.log('finished top level callback');
});
