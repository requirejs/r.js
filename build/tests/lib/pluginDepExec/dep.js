
define(['plugin2!test2.txt'], function(pluginresult) {
	'use strict';
	return {
        wrap: function(v) {
            return pluginresult + v + pluginresult;
        }
	};
});
