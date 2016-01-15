
define('a',{});
define('c',{});
define('first',['a', 'c'], function (a, c) {
    console.log(a.name);
    console.log(c.name);
});
