define(['pax'], function (pax) {
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
        load: function (id, require, load, config) {
            var converted = pax.toUp(id);
            buildMap[id] = converted;
            load(converted);
        },

        write: function (pluginName, id, write, config) {
            if (buildMap.hasOwnProperty(id)) {
                var content = jsEscape(buildMap[id]);
                write("define('" + pluginName + "!" + id  +
                      "', function () { return '" + content + "';});\n");
            }
        }
    };
});
