Sets up uglifyjs for use in the optimizer.

Current embedded version: 2.6.1, source-map 0.5.3

Steps:

    ./generate.sh

Then update this file with the uglifyjs version fetched.

* UPDATE VERSION NUMBERS IN X.JS
* Confirm the `raw` array in combine.js is correct.

THINGS TO CHECK:

* Compare node_modules/uglify-js/tools/node.js and what
  is put in last part of the combined file.
* REMOVE these functions from the end:
    * readReservedFile
    * exports.readReservedFile,
    * exports.readDefaultReservedFile,
    * exports.readNameCache,
    * exports.writeNameCache
