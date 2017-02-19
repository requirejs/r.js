define(['text', 'module'], function(text, module) {

    var cache = {};

    return {

        load: function (moduleName, parentRequire, onload, config) {
            if (cache[moduleName]) {
                onload(cache[moduleName]);

            } else {
                text.load(moduleName, parentRequire, function (source) {
                    cache[moduleName] = source;
                    onload(cache[moduleName]);
                }, config);
            }
        },

        write: function (pluginName, moduleName, write, config) {
            var name = pluginName + '!' + moduleName;
            write.asModule(name,
                'define("' + name + '", function() {\n' +
                '    return "' + text.jsEscape(cache[moduleName]) + '";\n' +
                '})');
        }
    };

});
