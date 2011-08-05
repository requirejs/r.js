({
    baseUrl: "../../../requirejs/tests",
    optimize: "none",
    //optimize: "uglify",
    dir: "builds/simpleNamespace",
    namespace: "NAMESPACE",
    paths: {
        requireLib: '../require'
    },
    modules: [
        {
            name: "NAMESPACE",
            include: ["requireLib", "one", "dimple"],
            create: true
        }
    ]
})
