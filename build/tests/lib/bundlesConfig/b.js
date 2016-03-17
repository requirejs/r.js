define(function(require, exports, module) {
  module.exports = {
    name: 'b',
    uri: module.uri,
    c: require('c'),
    d: require('refine!d')
  };
});
