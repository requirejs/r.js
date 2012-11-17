
define('../here.js',[],function() { 'here'; });

define('../other/other.js',[],function() { 'other'; });

define('../base/base.js',[],function() { 'base'; });

define('base',[],function() { 'base'; });

// due to undefined behavior some modules will be defined with an extension and some without after optimization
// due to a bug related to baseUrl './base/base[.js]' and 'base[.js]' will be treated as two separate modules, even though they are the same files

define('../paths',[
    'empty:',               // empty
    'http://nonexistant',   // http URL
    'https://nonexistant',  // https URL
    'foo?dynamic=1',        // dynamic URL
    '//nonexistant',        // URL without protocol
    './here',               // relative path
    './here.js',            // relative path with extension
    './other/other',        // relative path with subdirectories
    './other/other.js',     // relative path with subdirectories with extension
    './base/base',          // relative path
    './base/base.js',       // relative path with extension
    'base.js',              // baseUrl relative path with extension
    'base'                  // baseUrl relative path
], function () {});

require(['../paths']);

define("main", function(){});
