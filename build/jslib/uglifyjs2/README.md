Sets up uglifyjs2 for use in the optimizer.

Current embedded version: 2.4.0, source-map 0.1.30

Steps:

    ./generate.sh

Then update this file with the uglifyjs2 version fetched.

* UPDATE VERSION NUMBERS IN X.JS
* Copy WHITESPACE_CHARS from node_modules/uglify-js2/lib/parse.js and replace the one in ../uglifyjs2.js

THINGS TO CHECK:

* Did the `return this` at the bottom of the raw.js get turned into
`return exports`?
* Compare node_modules/uglify-js2/tools/node.js `exports` with what is inlined
in `post.txt`.
