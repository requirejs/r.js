
define('c',{
    name: 'c'
});

define('secondary',['main', 'c'], function (main, c) {
    return {
        name: 'secondary',
        main: main,
        c: c
    };
});
