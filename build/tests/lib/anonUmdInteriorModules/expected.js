
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('bam',factory);
    } else {
        root.Bam = factory();
    }
}(this, function () {

  //Pretend almond and other stuff in here
  //The build parsing should not dive into here

  define('cs',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});

  if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
    define( "jquery", [], function () { return jQuery; } );
  }

  define('cs!src/view',['backbone', 'jquery', 'underscore'], function(Backbone, $, _) {});

  return require('cs!src/main');
}));

define('main',['bam'], function (bam) {

});
