#!/bin/bash

rm -rf ./temp
mkdir temp
cd temp
mkdir node_modules
npm install uglify-js
node_modules/.bin/uglifyjs --self -b -o raw.js

node ../combine.js
cp -r node_modules/uglify-js/node_modules/source-map/dist/source-map.js ../../source-map.js

node ../fix-sourcemap.js ../../source-map.js