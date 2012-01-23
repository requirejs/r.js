requirejs.config({
    paths: {
        'dep2': 'sub/dep2'
    }
});

requirejs(['dep1', 'dep2'], function () {

});
