//A simple build file using the circular tests for requirejs
({
    baseUrl: "../../../requirejs/tests",
    optimize: "none",
    dir: "builds/circular",

    modules: [
        {
            name: "two"
        },
        {
            name: "funcTwo"
        },
        {
            name: "funcThree"
        }
    ]
})
