define(['text'], function(text) {
	'use strict';

	var buildMap = {};

	return {

		load: function(moduleName, parentRequire, onload, config) {
			if (buildMap[moduleName]) {
				onload(buildMap[moduleName]);
			}
			else {
				text.load(moduleName, parentRequire, function(source) {
					buildMap[moduleName] = '!' + source + '!';
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