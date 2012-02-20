//Tests to make sure appDir with a paths gets
//the paths set correctly and does not overwrite
//the source file when it is a build target.
({
    appDir: 'src',
    baseUrl: '.',
    paths: {
        'lib': 'vendor/lib'
    },
    dir: 'built',
    optimize: 'none',
    modules: [
        {
            name: 'lib'
        },
        {
            name: 'main',
            exclude: ['lib']
        }
    ]
})
