if(typeof define !== 'function'){
    var define = (require('amdefine'))(module);
}

define(function (require) {
    var b = require('./b'),
        c = require('./c');


    console.log('got b name: ' + b.name);
    console.log('got c name: ' + c.name);
    console.log('and I am a');

    return {
        name: 'a'
    };
});
