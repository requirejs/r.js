define(['text', 'dep'], function(text, dep) {
	'use strict';

	var buildMap = {};

	return {

		load: function(moduleName, parentRequire, onload, config) {
			if (buildMap[moduleName]) {
				onload(buildMap[moduleName]);
			}
			else {
				text.load(moduleName, parentRequire, function(source) {
					var result = dep.wrap(source);
					buildMap[moduleName] = result;
					onload(buildMap[moduleName]);
				}, config);
			}
		},

		write: function(pluginName, moduleName, write, config) {
			var build = buildMap[moduleName];
			if (build) {
				write("define('" + pluginName + "!" + moduleName  + "', function () { return '" + build + "';});\n");
			}
		}
	};
});

