define('c',{
  name: 'c'
});


define('b',['c'], function (c) {

});

require(['b'], function(){});


define("main", function(){});

