
if (typeof define !== 'function') { var define = (require('../amdefine/node_modules/amdefine/amdefine'))(module); }

define('d',{
    name: 'd'
});
if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define('b',['./d'], function (d) {
    console.log('got d name: ' + d.name);
    return {
        name: 'b'
    };
});

if ( typeof define !== 'function' ) {
    var define = ( require( './node_modules/amdefine/amdefine' ) )( module );
}

define('c',{
    name: 'c'
});

if(typeof define !== 'function'){
    var define = (require('amdefine'))(module);
}

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
