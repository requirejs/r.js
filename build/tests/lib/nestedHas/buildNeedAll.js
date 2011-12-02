({
    baseUrl: '.',
    findNestedDependencies: true,
    //Pass a has, but should get all modules for main.js
    has: {},
    optimize: 'none',
    name: 'main',
    out: 'main-builtNeedAll.js'
})
