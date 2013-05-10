
//ONBUILDREAD: a
define('a',['require'],function(require) {
    return {
        name: 'a'
    };
});

//ONBUILDWRITE: a;
//ONBUILDREAD: main
require(['a'], function () {

});

//ONBUILDWRITE: main;
define("main", function(){});
