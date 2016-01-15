
define('c',{
  name: 'c'
});


define('b',['c'], function (c) {

});

define('a',['b'], function (b) {});