
define('a',{
    name: 'a'
});
define('d',{
    name: 'd'
});


define('main',['require', 'a'], function(require, a) {

   if (false) {
        require(['c'], function (c) {

        });
   } else if (false) {
        require(['b'], function (b) {

        });
   } else {
        require(['d'], function (d) {

        });
   }
});