A test of embedding requirejs as a module in a node project, but delegates
to Node's require() when it cannot find a file. Make sure the path resolution
for Node's require is from the perspective of the main.js file, and *not* the
requirejs module.

## Setup

* mkdir node_modules
* npm install coffee-script uglify-js

Make sure there is a node_modules/requirejs directory with a package.json
that has a 'main': 'bin/r.js' property, and create a bin directory with
a symlink to the project's basedir/r.js file inside the bin directory.

Tested with Node 0.4.9