define('main',{
    name: 'main'
});


define('b',{
    name: 'b'
});


define('a',["b"], function (b) {});
