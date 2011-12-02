
define('a',{
    name: 'a'
});
define('c',{
    name: 'c'
});

define('main',['require', 'a'], function(require, a) {

   if (true) {
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