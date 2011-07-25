//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../../requirejs/tests/plugins",
    paths: {
        nameOnly: "../../../requirejs/tests/plugins/nameOnly"
    },
    out: "builds/tests-nameOnly.js",
    name: "nameOnly-tests",
    optimize: "none"
}
