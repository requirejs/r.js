
define('a',{
    name: 'a'
});

define('b',{
    name: 'b'
});

define('main',['a', 'b'], function (a, b) {
    return {
        name: 'main',
        a: a,
        b: b
    };
});
