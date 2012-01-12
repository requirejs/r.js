define(function(){
	return function(){
		console.log.apply(console,Array.prototype.slice.apply(arguments));
	};
});

