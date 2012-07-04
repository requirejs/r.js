
define('c',{
    name: 'c'
});

define('sub/e',{
    name: 'e'
});

define('secondary',['main', 'c', 'sub/e'], function (main, c, e) {
    return {
        name: 'secondary',
        main: main,
        c: c,
        e: e
    };
});
