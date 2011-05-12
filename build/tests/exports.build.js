//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../../requirejs/tests/exports",
    inlineText: false,
    dir: "builds/exports",
    optimize: "none",
    modules: [
        {
            name: "simpleReturn"
        }
    ]
}
