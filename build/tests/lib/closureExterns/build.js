({
    baseUrl: '.',
    optimize: 'closure',
    name: 'main',
    out: './built/built.js',
    closure: {
        CompilerOptions: {
            languageIn: com.google.javascript.jscomp.CompilerOptions.LanguageMode.ECMASCRIPT5
        },
        CompilationLevel: 'ADVANCED_OPTIMIZATIONS',
        externExportsPath: './externs.js'
    }
})