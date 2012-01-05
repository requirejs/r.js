({
    baseUrl: '.',
    paths: {
        'text': '../../../../../requirejs/text'
    },
    optimize: 'none',
    name: 'main',
    include: [
        'text',
        'sub2'
    ],
    out: 'built.js'
})
