
define(['require', 'a'], function(require, a) {

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