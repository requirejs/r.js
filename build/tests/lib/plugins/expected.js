
define('util',[],function () {
    function upper(text) {
        return text.toUpperCase();
    };

    return upper;
});

if (typeof define === 'function' && define.amd) {
    define('converter',['util'], function (util) {

        return {
            version: '2',
            convert: function (text) {
                return util(text);
            }
        };
    });
};
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

require(['plug', 'converter', 'plug!shouldbeuppercasetext'],
function (plug,   converter,   text) {
    console.log('plugin version: ' + plug.version);
    console.log('converter version: ' + converter.version);
    console.log('converted text: ' + text);
});

define("main", function(){});
