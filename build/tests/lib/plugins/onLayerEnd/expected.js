
define('plug',[],function () {
    var buildMap = {},
        injectPreamble = true,
        preamble = "'USE PREAMBLE';";

    return {
        version: '1',
        load: function (name, require, onLoad, config) {
            var converted = name.toUpperCase();
            buildMap[name] = converted;
            onLoad(converted);
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                if (injectPreamble) {
                    write(preamble);
                    injectPreamble = false;
                }
                var content = buildMap[moduleName];
                write("define('" + pluginName + "!" + moduleName  +
                      "', function () { return '" + content + "';});\n");
            }
        },

        onLayerEnd: function (write, data) {
            injectPreamble = true;
            write("'USE POSTAMBLE';");
        }
    };
});

'USE PREAMBLE';
define('plug!foo', function () { return 'FOO';});

define('plug!bar', function () { return 'BAR';});

require(['plug!foo', 'plug!bar'],
function (foo,   bar) {
    console.log(foo);
    console.log(bar);
});

define("main", function(){});

'USE POSTAMBLE';