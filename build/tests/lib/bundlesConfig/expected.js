/*jshint esnext: true */
define('c',[],() => {
  return {
    name: 'c'
  };
});

/*jshint esnext: true */
define('b',['require','exports','module','c'],(require, exports, module) => {
  module.exports = {
    name: 'b',
    uri: module.uri,
    c: require('c')
  };
});

/*jshint esnext: true */
define('a',['require','b'],(require) => {
  return {
    name: 'a',
    b: require('b')
  };
});

require(['a'], (a) => {
  console.log(a);
});

define("main", function(){});

