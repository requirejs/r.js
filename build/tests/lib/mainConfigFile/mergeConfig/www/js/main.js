requirejs.config({
    paths: {
        'dep2': 'sub/dep2'
    },
    enabled: {
        alpha: true
    },

    //Made up values just to test nested merging skip logic.
    someRegExp: /foo/,
    someFunc: function () {},
    someArray: ['three', 'four']
});

requirejs(['enabled!alpha', 'enabled!gamma', 'enabled!beta'], function () {
});
