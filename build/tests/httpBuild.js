/*jslint strict: false*/
/*global require: false, console: false */

var requirejs = require('../../r.js'),
    http = require('http'),
    fs = require('fs'),
    host = '127.0.0.1',
    port = 4304,
    config;

//Set up the config passed to the optimizer
config = {
    baseUrl: '../../../requirejs/tests',
    name: 'one',
    include: 'dimple',
    out: 'builds/outSingleOpt.js',
    optimize: 'none'
};

function respond(res, code, contents) {
    res.writeHead(code, {
        'Content-Type': (code === 200 ? 'application/javascript' : 'text/plain'),
        'Content-Length': contents.length
    });
    res.end(contents);
}

http.createServer(function (req, res) {
    //Does not matter what the request is,
    //the answer is always OPTIMIZED JS!
    try {
        requirejs.optimize(config, function (buildResponse) {
            //buildResponse is just a text output of the modules
            //included. Load the built file for the contents.
            var contents = fs.readFileSync(config.out, 'utf8');
            respond(res, 200, contents);
        });
    } catch (e) {
        respond(res, 500, e.toString());
    }

}).listen(port, host);

console.log('Server running at http://' + host + ':' + port + '/');
