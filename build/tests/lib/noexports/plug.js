define(['converter'], function (converter) {
    var buildMap = {};

    function jsEscape(content) {
        return content.replace(/(['\\])/g, '\\$1')
            .replace(/[\f]/g, "\\f")
            .replace(/[\b]/g, "\\b")
            .replace(/[\n]/g, "\\n")
            .replace(/[\t]/g, "\\t")
            .replace(/[\r]/g, "\\r");
    }

    return {
        version: '1',
        load: function (name, require, onLoad, config) {
            var converted = converter.convert(name);
            buildMap[name] = converted;
            onLoad(converted);
        },

        write: function (pluginName, moduleName, write, config) {
            if (moduleName in buildMap) {
                var content = jsEscape(buildMap[moduleName]);
                write("define('" + pluginName + "!" + moduleName  +
                      "', function () { return '" + content + "';});\n");
            }
        }
    };
});
