//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../../requirejs/tests/text",
    paths: {
        text: "../../../requirejs/text"
    },
    dir: "builds/text",
    optimize: "none",
    optimizeAllPluginResources: true,

    modules: [
        {
            name: "widget"
        }
    ]
}
