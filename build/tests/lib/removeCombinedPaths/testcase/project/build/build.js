({
    appDir: "../src",
    baseUrl: ".",
    dir: "./build_output",
    paths: {
        'the_lib': '../../lib',
    },
    modules: [
        {
            name: "main"
        }
    ],
    optimize: "none",
    removeCombined: true
})

