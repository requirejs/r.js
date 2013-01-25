requirejs.config({
    packages: [
        {
            name: 'foo',
            main: 'foo'
        }
    ]
});

define(['foo'], function (foo) {
    return foo;
});
