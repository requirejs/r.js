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
require(['app/main']);

