define(['uglify-js', 'fs', 'module'], function (uglify, fs, module) {

    var source = fs.readFileSync(module.uri, 'utf8'),
        parser = uglify.parser,
        minify = uglify.uglify,
        ast = parser.parse(source);

    ast = minify.ast_mangle(ast);

    return {
        data: minify.gen_code(minify.ast_squeeze(ast))
    };
});
