/*jslint strict: false*/
/*global require: false, console: false */

//If you install requirejs via npm, replace this line with require('requirejs')
var requirejs = require('../../../r.js'),
    http = require('http'),
    fs = require('fs'),
    host = '127.0.0.1',
    port = 4304,
    config;

//Set up the config passed to the optimizer
config = {
    baseUrl: 'scripts',
    paths: {
        //Put path to require.js in here, leaving off .js
        //since it is a module ID path mapping. For final deployment,
        //if a smaller AMD loader is desired, no dynamic
        //loading needs to be done, and loader plugins are not
        //in use, change this path to that file. One possibility
        //could be the one at:
        //https://github.com/ajaxorg/ace/blob/master/build_support/mini_require.js
        requireLib: '../../../../require'
    },
    //Uncomment this line if uglify minification is not wanted.
    //optimize: 'none',
    //Specify the optimization target. Choose the requireLib,
    //so that it is first in the output, then include the main.js
    //for this project.
    name: 'requireLib',
    include: ['main'],
    //Uncomment this if you want to debug three.js by itself
    //excludeShallow: ['three'],
    out: 'scripts/main-built.js'
};

function respond(res, code, contents) {
    res.writeHead(code, {
        'Content-Type': (code === 200 ? 'application/javascript;charset=UTF-8' : 'text/plain'),
        'Content-Length': contents.length
    });

    res.write(contents, 'utf8');
    res.end();
}

http.createServer(function (req, res) {

    req.on('close', function (err) {
        res.end();
    });

    req.on('end', function () {
        //Does not matter what the request is,
        //the answer is always OPTIMIZED JS!
        requirejs.optimize(config, function (buildResponse) {
            //buildResponse is just a text output of the modules
            //included. Load the built file for the contents.
            var contents = fs.readFileSync(config.out, 'utf8');
            respond(res, 200, contents);
        }, function (e) {
            //As of r.js 2.1.2, errors are returned via an errback
            respond(res, 500, e.toString());
        });
    });

}).listen(port, host);

console.log('Server running at http://' + host + ':' + port + '/');
