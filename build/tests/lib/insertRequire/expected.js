
define('a',{
    name: 'a'
});

define('main',['a'], function (a) {
    window.a = a;
});

require(["main"]);
