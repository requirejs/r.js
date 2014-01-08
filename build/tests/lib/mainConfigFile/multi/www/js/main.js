requirejs.config({
    paths: {
        'alpha': 'sub/wrong-did-not-multi',
        'dep2': 'sub/wrong-did-not-multi'
    },
    enabled: {
        alpha: true
    },

    packages: ['foo'],

    //Made up values just to test nested merging skip logic.
    someRegExp: /foo/,
    someFunc: function () {},
    someArray: ['three', 'four']
});

requirejs(['enabled!alpha', 'enabled!gamma', 'enabled!beta', 'foo', 'bar'], function () {
});
