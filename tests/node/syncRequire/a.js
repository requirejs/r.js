define(['require', 'b'], function (require) {
    return {
        name: 'a',
        getB: function () {
            return require('b');
        }
    };
});
