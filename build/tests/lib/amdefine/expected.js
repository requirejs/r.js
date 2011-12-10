


define('d',{
    name: 'd'
});


define('b',['./d'], function (d) {
    console.log('got d name: ' + d.name);
    return {
        name: 'b'
    };
});



define('c',{
    name: 'c'
});



define('a',['require','./b','./c'],function (require) {
    var b = require('./b'),
        c = require('./c');


    console.log('got b name: ' + b.name);
    console.log('got c name: ' + c.name);
    console.log('and I am a');

    return {
        name: 'a'
    };
});
