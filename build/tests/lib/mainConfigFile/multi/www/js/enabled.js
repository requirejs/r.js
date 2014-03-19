define({
    load: function (name, require, load, config) {
        if (config.enabled[name]) {
            require([name], load);
        } else {
            load();
        }
    }
});
