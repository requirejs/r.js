define({
    load: function (id, require, load, config) {
        require([id], function (mod) {
            if (typeof mod.name === 'string') {
                mod.name = mod.name.toUpperCase();
            }
            load(mod);
        });
    }
});
