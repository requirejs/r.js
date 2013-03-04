set -e

java -classpath ../../lib/rhino/js.jar:../../lib/closure.compiler.jar org.mozilla.javascript.tools.shell.Main run.js
