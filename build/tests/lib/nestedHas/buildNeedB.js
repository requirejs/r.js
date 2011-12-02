({
    baseUrl: '.',
    findNestedDependencies: true,
    has: {
        needC: false,
        needB: true
    },
    optimize: 'none',
    name: 'main',
    out: 'main-builtNeedB.js'
})
