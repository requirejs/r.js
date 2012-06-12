/*jslint */
/*global doh: false, define: false */

define(['transform'], function (transform) {
    'use strict';
    doh.register(
        "transformTests",
        [
            function transformTests(t) {
                var source1 = 'define(["a", "b"], function(a, b) {\nreturn a + "hello" + b;\n});',
                    expected1 = 'define(\'source1\',["a", "b"], Function(["a","b"], "\\nreturn a + \\"hello\\" + b;\\n\\r\\n//@ sourceURL=source1.js"));';


//test no args function
//test object literal define.

                t.is(expected1, transform.toTransport(null, 'source1', 'source1.js', source1, null, {
                   useSourceUrl: true
                }));
            }
        ]
    );
    doh.run();
});
