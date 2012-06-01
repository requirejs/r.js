requirejs.config({
    packages: [
        {
            name: 'foo',
            main: 'main'
        }
    ]
});

define(['foo'], function (foo) {
    return foo;
});
