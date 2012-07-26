({
    baseUrl: '.',
    optimize: 'none',
    name: 'main',
    insertRequire: ['main'],
    out: 'main-built.js',
    onBuildRead: function (id, path, contents) {
        // Regexps courtesy of @mozsquib on github.
        // Remove destructuring, minimal functions, and yields so parsing works.
        // Do this until esprima has a fix for this, among other things:
        // http://code.google.com/p/esprima/issues/detail?id=241

        var destructRe  = /((?:var|let|const)\s*)(\{[^\}]+\})(\s*(?:=|in\b))/g;
        var destructRe2 = /((?:var|let|const)\s*)(\[[^\]]+\])(\s*(?:=|in\b))/g;
        var destructRe3 = /\n(\s*)(\[[^\]]+\])(\s*(?:=|in\b))/g;
        var getterRe    = /get\s+\w+\s*\(\).*,/g;
        var minifuncRe  = /(function\s*\(.*?\))(?=\s*\w)/g;
        var yieldRe     = /yield/g;
        var temp = contents.replace(destructRe,  '$1/*DESTRUCT$2DESTRUCT*/_$3')
                       .replace(destructRe2, '$1/*DESTRUCT$2DESTRUCT*/_$3')
                       .replace(destructRe3, '$1/*DESTRUCT$2DESTRUCT*/_$3')
                       .replace(getterRe,    '/*GETTER$&GETTER*/')
                       .replace(minifuncRe,  '/*MINIFUNC$1MINIFUNC*/')
                       .replace(yieldRe,     'return YIELD+');
        //console.log(temp);
        return temp;
    },
    onBuildWrite: function (id, path, contents) {
        // Restore destructuring, minimal functions, and yields.

        var restructRe = /\/\*DESTRUCT(.*?)DESTRUCT\*\/_/g;
        var getterRe   = /\/\*GETTER(.*?)GETTER\*\//g;
        var minifuncRe = /\/\*MINIFUNC(.*?)MINIFUNC\*\//g;
        var yieldRe    = /return YIELD\+/g;
        return contents.replace(restructRe, '$1')
                       .replace(getterRe,   '$1')
                       .replace(minifuncRe, '$1')
                       .replace(yieldRe,    'yield');
    }
})
