require(['plug', 'plug!shouldbeuppercasetext'],
function (plug, text) {
    console.log('plugin version: ' + plug.version);
    console.log('converted text: ' + text);
});
