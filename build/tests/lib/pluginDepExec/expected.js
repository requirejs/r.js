define('text',{});
define('plugin2',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});

define('plugin2!test2.txt', function () { return '!test2!';});


define('dep',['plugin2!test2.txt'], function(pluginresult) {
	'use strict';
	return {
        wrap: function(v) {
            return pluginresult + v + pluginresult;
        }
	};
});

define('plugin1',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});

define('plugin1!test1.txt', function () { return '!test2!test1!test2!';});


require(['plugin1!test1.txt'], function(pluginresult) {
	'use strict';
	alert(pluginresult);
});

define("main", function(){});

