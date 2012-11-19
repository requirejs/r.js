Sets up uglifyjs2 for use in the optimizer.

Current embedded version: 2.1.11

Steps:

    ./generate.sh

Then update this file with the uglifyjs2 version fetched.

This will update:

* ../source-map.js
* ../uglifyjs2.js

THINGS TO CHECK:

* Did the `return this` at the bottom of the raw.js get turned into
`return exports`?
* Compare node_modules/uglify-js2/tools/node.js `exports` with what is inlined
in `post.txt`.
