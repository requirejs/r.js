define(['require', 'a'], function (require) {
    return {
        name: 'b',
        getA: function () {
            return require('a');
        }
    };
});