define('b',{
    name: 'b'
});


define('a',["b"], function (b) {});
define('main',{
    name: 'main'
});


