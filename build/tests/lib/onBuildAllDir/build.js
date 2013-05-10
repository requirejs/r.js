({
    baseUrl: 'js',
    optimize: 'none',
    dir: 'js-built',
    modules: [{
        name: 'main'
    }],
    onBuildRead: function (id, path, contents) {
        return '//ONBUILDREAD: ' + id + '\n' + contents;
    },
    onBuildWrite: function (id, path, contents) {
        return contents + '\n//ONBUILDWRITE: ' + id;
    }
})
