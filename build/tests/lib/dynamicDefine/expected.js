/*jshint esnext: true */

var dependencies = [];
define('loader', dependencies, function() {});

define('a',['require','loader'],function (require) {
  return {
    name: 'a',
    loader: require('loader')
  };
});

require(['a'], function(a) {
  console.log(a);
});

define("main", function(){});

