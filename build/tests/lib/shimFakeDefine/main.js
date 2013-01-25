requirejs.config({
    shim: {
        faker: {
            exports: 'faker'
        }
    }
});

require(['faker'], function (faker) {
    console.log(faker);
});
