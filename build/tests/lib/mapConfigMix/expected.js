define('b1',{
  name: 'b1'
});

define('c2',{
  name: 'c2'
});

define('a',['b', 'c'], function(b, c) {

});

requirejs.config({
  map: {
    '*': {
      'b': 'b1'
    }
  }
});

define("config1", function(){});

requirejs.config({
  map: {
    '*': {
      'c': 'c2'
    }
  }
});

define("config2", function(){});

