
(function (factory) {
    if (typeof exports !== 'undefined') {
        // Node/CommonJS
        factory(exports);
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define('converter',['exports'], factory);
    }


}(function (exports) {
    exports.version = '2';
    exports.convert = function (text) {
        return text.toUpperCase();
    };
}));

define('plug',['converter'], function (converter) {
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

define('plug!shouldbeuppercasetext', function () { return 'SHOULDBEUPPERCASETEXT';});

require(['plug', 'plug!shouldbeuppercasetext'],
function (plug, text) {
    console.log('plugin version: ' + plug.version);
    console.log('converted text: ' + text);
});

define("main", function(){});
