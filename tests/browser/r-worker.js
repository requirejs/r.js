importScripts('../../r.js');

self.onmessage = function (evt) {
    var out, buildText;

    if (evt.data === 'run') {
        requirejs.optimize({
            baseUrl: '.',
            paths: {
                'd': 'sub/d'
            },
            include: ['a'],
            out: function (text) {
                out = text;
            }
        }, function (buildText) {
            self.postMessage(JSON.stringify({
                out: out,
                buildText: buildText
            }, null, '  '));
        });
    }
};
