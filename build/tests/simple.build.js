//A simple build file using the tests directory for requirejs
({
    baseUrl: "../../../requirejs/tests",
    optimize: "none",
    //optimize: "uglify",
    dir: "builds/simple",
    modules: [
        {
            name: "one",
            include: ["dimple"]
        }
    ]
})
