requirejs.config({
    paths: {
        jquery: 'http://code.jquery.com/jquery-1.7.2.min'
    }
});

define(['a', 'jquery'], function (a, $) {
    console.log(a.name);
    console.log($('body'));
});
