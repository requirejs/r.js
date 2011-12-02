
define('a',{
    name: 'a'
});
define('c',{
    name: 'c'
});
define('b',{
    name: 'b'
});
define('d',{
    name: 'd'
});


define('main',['require', 'a'], function(require, a) {

   if (has('needC')) {
        require(['c'], function (c) {

        });
   } else if (has('needB')) {
        require(['b'], function (b) {

        });
   } else {
        require(['d'], function (d) {

        });
   }
});