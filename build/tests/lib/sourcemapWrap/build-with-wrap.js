({
    preserveLicenseComments: false,
    generateSourceMaps: true,
    name: "main",
    optimize: "none",
    wrap: {
        startFile: ["wrap-start.js"],
        endFile: ["wrap-end.js"]
    },
    out: "./built/built-with-wrap.js"
})