rm -rf ./builds/
echo "Running tests embedded in Node"
echo "=============================="
node allNode.js
rm -rf ./builds/
echo "Running tests via bootstrap"
echo "=============================="
node ../../r.js all.js
