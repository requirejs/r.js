({
    dir: 'built',
    baseUrl: '.',
    optimize: 'none',
    modules: [
        {
            name: "rollup1",
            include: [
                'refine!d',
                'c'
            ],
            create: true,
        },
        {
            name: "rollup2",
            include: ['a'],
            exclude: ['rollup1'],
            create: true,


        }
    ],
    //Path is relative to output "dir" setting. Only useful in "dir" full
    //project optimization passes.
    bundlesConfigOutFile: 'main.js',

    //Remove the combined files to make sure they cannot be loaded by test-built.html
    removeCombined: true
})
