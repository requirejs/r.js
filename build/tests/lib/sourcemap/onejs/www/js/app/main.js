define(function (require) {
    var text = require('text!./sample.txt'),
        a = require('./a');

    return {
        name: 'main',
        a: a,
        text: text 
    };
});

