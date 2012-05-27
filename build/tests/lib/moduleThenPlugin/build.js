({
    baseUrl: '.',
    paths: {
        'text': '../../../../../../requirejs/text/text'
    },
    optimize: 'none',
    name: 'main',
    include: [
        'text',
        'sub2'
    ],
    out: 'built.js'
})
