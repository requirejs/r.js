define(['aux'], function (aux) {
    return {
        load: function (id, require, load, config) {
            load(aux.toUp(id));
        }
    }
});
