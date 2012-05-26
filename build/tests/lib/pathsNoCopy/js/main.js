require.config({
    paths: {
        sub: 'vendor/sub',
        outside: '../outside'
    }
});

require(['sub'], function (sub) {
    console.log(sub.name);
});
