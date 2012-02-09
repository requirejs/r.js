({
    baseUrl: '.',
    optimize: 'none',
    name: 'main',
    out: 'main-built.js',
    onBuildWrite: function (id, path, contents) {
        return contents.replace(/define\s*\(\s*["'][^'"]+["']\s*,\s*\[[^]*\]\s*,/, 'def(');
    }
})
