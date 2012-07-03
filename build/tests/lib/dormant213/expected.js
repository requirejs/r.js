
define('module1', {data: 'aaaa'});
define('module2', {data: 'bbbb'});
define('module3', {data: 'cccc'});

require(['module1', 'module2'], function(m1, m2) {
    console.log(m1.data + m2.data);
});


define("main", function(){});
