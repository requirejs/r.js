
define('a',{
    name: 'a'
});
define('b',{
    name: 'b'
});

define('main',['require', 'a'], function(require, a) {

   if (false) {
        require(['c'], function (c) {

        });
   } else if (true) {
        require(['b'], function (b) {

        });
   } else {
        require(['d'], function (d) {

        });
   }
});