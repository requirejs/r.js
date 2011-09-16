require(['plug', 'converter', 'plug!shouldbeuppercasetext'],
function (plug,   converter,   text) {
    console.log('plugin version: ' + plug.version);
    console.log('converter version: ' + converter.version);
    console.log('converted text: ' + text);
});
