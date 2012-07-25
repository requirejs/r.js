({
    baseUrl: '.',
    optimize: 'none',
    name: 'main',
    insertRequire: ['main'],
    out: 'main-built.js',
    onBuildRead: function (id, path, contents) {
        //Remove destructuring so parsing works. Do this until esprima has
        //a fix for: http://code.google.com/p/esprima/issues/detail?id=241
        var destructRegExp = /(var|let|const)\s*\{[^\}]+\}\s*=/g,
            yieldRegExp = /\byield\b/g;

        return contents
            .replace(destructRegExp, '/*DESTRUCT$&DESTRUCT*/')
            .replace(yieldRegExp, '/*YIELD*/');
    },
    onBuildWrite: function (id, path, contents) {
        //Restore destructuring
        var destructRegExp = /\/\*DESTRUCT(.*)DESTRUCT\*\//g,
            yieldRegExp = /\/\*YIELD\*\//g;

        return contents
            .replace(destructRegExp, '$1')
            .replace(yieldRegExp, 'yield');
    }
})
