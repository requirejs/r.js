define('bar', ['foo'], function (foo) {
    return {
        bar: function () {
            console.log('barrrr');
            foo.foo();
        }
    }
});
