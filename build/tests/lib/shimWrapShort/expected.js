define('jquery',[],function() {
    function jQuery() {

    }
    window.jQuery = window.$ = jQuery;
    return jQuery;
});


(function(root) {
define("plugin", ["jquery"], function() {
  return (function() {
(function ($) {
    $.test = function () {
        console.log('from plugin 1');
    }
})(jQuery);




  }).apply(root, arguments);
});
}(this));

(function(root) {
define("plugin2", ["jquery","plugin"], function() {
  return (function() {
(function ($) {
    $.test();
})(jQuery);



  }).apply(root, arguments);
});
}(this));

require(['plugin2']);


define("main", function(){});

