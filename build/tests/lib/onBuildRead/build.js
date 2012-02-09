({
    baseUrl: '.',
    optimize: 'none',
    name: 'main',
    out: 'main-built.js',
    onBuildRead: function (id, path, contents) {
        if (id === 'a') {
            return 'define(function (require) {\n' + contents + '\n});';
        } else if (id === 'b') {
            return 'define(' + contents + ');';
        } else {
            return contents;
        }
    }
})
