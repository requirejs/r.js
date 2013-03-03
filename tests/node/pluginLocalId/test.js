var requirejs = require("../../../r.js");
var req = requirejs.config({
  baseUrl: __dirname + '/lib',
  map: {
    '*': {
      'coffee': 'cs'
    }
  }
});
req(['coffee!app/test'], function(test) {
  if (test === 'dep') {
    console.log('pluginLocalId test PASSED');
  } else {
    console.log('pluginLocalId test FAILED: ' + test + ' !== dep');
  }
});
