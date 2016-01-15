define('something-js/a',{
    name: 'something-js/a'
});


define('something-js/b',{
    name: 'something-js/b'
});

define('something-js/core',["something-js/a", "something-js/b",], function() { return window.SomethingJS; });
require(['something-js/core']);


define("main", function(){});

