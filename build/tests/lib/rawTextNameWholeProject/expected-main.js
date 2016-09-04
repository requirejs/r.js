define('util/helper',[],function () {
    return function () {
        return 'helper is ready';
    };
});

define('a',['./util/helper'], function(helper) {
	return {
		name: 'a',
		helper: helper
	};
});

require(['a'], function(a) {    console.log(a);    require(['b'], function(b) {        console.log(b);    });});
define("main", function(){});

