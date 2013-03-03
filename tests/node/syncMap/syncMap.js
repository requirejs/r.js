var requirejs = require("../../../r.js");

requirejs.config({
  map: {
    "*": {
      "jquery": "cheerio"
    }
  }
});

requirejs.define("test", function(require) {
  var $ = require("jquery");
  if ($() === 'cheerio') {
    console.log('syncMap test PASSED');
  } else {
    console.log('syncMap test FAILED: ' + $() + ' !== cheerio');
  }
});

requirejs(["test"]);
