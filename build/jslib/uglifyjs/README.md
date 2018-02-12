Sets up uglifyjs for use in the optimizer.

Current embedded version: 2.8.29, source-map 0.5.6

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
    * exports.simple_glob

REMOVE this section:

```javascript
// workaround for tty output truncation upon process.exit()
[process.stdout, process.stderr].forEach(function(stream){
    if (stream._handle && stream._handle.setBlocking)
        stream._handle.setBlocking(true);
});
```

ALSO REMOVE this section:

```javascript
    var path = require("path");
    var fs = require("fs");

    var UglifyJS = exports;
    var FILES = exports.FILES = [
        "../lib/utils.js",
        "../lib/ast.js",
        "../lib/parse.js",
        "../lib/transform.js",
        "../lib/scope.js",
        "../lib/output.js",
        "../lib/compress.js",
        "../lib/sourcemap.js",
        "../lib/mozilla-ast.js",
        "../lib/propmangle.js",
        "./exports.js",
    ].map(function(file){
        return require.resolve(file);
    });

    new Function("MOZ_SourceMap", "exports", FILES.map(function(file){
        return rjsFile.readFile(file, "utf8");
    }).join("\n\n"))(
        require("source-map"),
        UglifyJS
    );
```
