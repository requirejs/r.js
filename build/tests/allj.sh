set -e

java -classpath ../../lib/rhino/js.jar:../../lib/closure/compiler.jar org.mozilla.javascript.tools.shell.Main -opt -1 ../../r.js all.js
