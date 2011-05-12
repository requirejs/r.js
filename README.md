# opto

An JavaScript script optimizer that understands the
[Asychronous Module Defintion API (AMD)](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition)
for declaring and using JavaScript modules and regular JavaScript script files.

It is part of the [RequireJS project](http://requirejs.org), and works will with the RequireJS implementation of AMD.

The opto project also generates the r.js adapter
## What makes it special

opto is better than using a plain concatenation script  because it runs require.js as part of the optimization, so it knows how to:

* Use [Loader Plugins](http://requirejs.org/docs/plugins.html) to load non-script dependencies and inline them in built files.
* [Name anonymous modules](http://requirejs.org/docs/api.html#modulename). If your optimization step does not do this, and you use
anonymous modules, you will get errors running that built code.

## What makes it awesome

* It is just one JS file and runs on Node.
* The same file runs on Rhino with the proper JAR files.

## Latest release

(Coming soon) For the latest release for opto.js or r.js, see [the Download page on the RequireJS site](http://requirejs.org/docs/download.html).

## Documentation

(Coming soon) See the [optimization area](http://requirejs.org/docs/download.html) on the RequireJS site.

## Directory layout

* **adapt**: Contains the