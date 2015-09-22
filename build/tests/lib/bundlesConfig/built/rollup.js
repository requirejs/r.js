define('c',[],function() {
  return {
    name: 'c'
  };
});

define('b',['require','exports','module','c'],function(require, exports, module) {
  module.exports = {
    name: 'b',
    uri: module.uri,
    c: require('c')
  };
});

define('a',['require','b'],function(require) {
  return {
    name: 'a',
    b: require('b')
  };
});


define("rollup", function(){});
