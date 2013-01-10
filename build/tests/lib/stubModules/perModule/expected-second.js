
define('b',{});
define('c',{});
define('second',['b', 'c'], function (b, c) {
    console.log(b.name);
    console.log(c.name);

});

