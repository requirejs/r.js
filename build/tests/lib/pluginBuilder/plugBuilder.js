define({
    load: function (name, req, onLoad, config) {
        onLoad(name);
    },
    write: function (pluginName, moduleName, write, config) {
        var content = moduleName;
        write.asModule(pluginName + "!" + moduleName,
                       "define(function () { return '" +
                           content +
                       "';});\n");
    }
});
