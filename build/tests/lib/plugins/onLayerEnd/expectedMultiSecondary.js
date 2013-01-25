
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
define('plug!meep', function () { return 'MEEP';});

define('plug!moop', function () { return 'MOOP';});

require(['plug!meep', 'plug!moop'],
function (meep,   moop) {
    console.log(meep);
    console.log(moop);
});

define("secondary", function(){});

'USE POSTAMBLE';