
define('sub',{
    name: 'sub'
});

require.config({
    baseUrl: 'js'
});

require(['sub'], function (sub) {
    console.log(sub.name);
});

define("main", function(){});
