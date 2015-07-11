/*jshint esnext: true */

var dependencies = [];
define('loader', dependencies, function() {});

define(function (require) {
  return {
    name: 'a',
    loader: require('loader')
  };
});
