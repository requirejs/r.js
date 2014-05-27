define('util/helper',{
  name: 'helper'
});

define('sub/ext',['../util/helper', 'require'], function(helper, require) {
  var helperPath = require.toUrl('../util/helper');
  return {
    name: 'ext',
    helperPath: helperPath,
    helper: helper
  };
});

define('spell',['./sub/ext'], function(ext) {
  return {
    name: 'spell',
    ext: ext
  };
});

require(["spell"], function(spell) {
    doh.register(
        "dotTrim",
        [
            function dotTrim(t){
                t.is('spell', spell.name);
                t.is('ext', spell.ext.name);
                t.is('./util/helper', spell.ext.helperPath);
                t.is('helper', spell.ext.helper.name);
            }
        ]
    );

    doh.run();
});

define("dotTrim-tests", function(){});

