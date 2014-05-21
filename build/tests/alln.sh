#Stop after any error
set -e

rm -rf ./builds/
echo "Running tests embedded in Node"
echo "=============================="
node nodeOptimize.js
rm -rf ./builds/

node nodeOptimizeNoCallback.js
rm -rf ./builds/

node nodeAll.js
rm -rf ./builds/

echo "Running tests via bootstrap"
echo "=============================="
node ../../r.js all.js

echo "Testing stdout, result should be: define("main",{name:"main"});"
echo "=============================="
node ../../r.js -o lib/stdout/build.js

echo ""
