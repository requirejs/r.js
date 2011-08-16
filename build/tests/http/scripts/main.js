
//Set the baseUrl for scripts, for use
//if individually debuggin files via
//excludeShallow in httpBuild.js
require.config({
    baseUrl: 'scripts'
});

require(['one', 'two'], function (one, two) {
    var html = "<b>Success!</b> One's name is: " + one.name +
        ", two's name is: " + two.name +
        ", three's name is: " + two.threeName,
        node = document.createElement('div');

    node.innerHTML = html;

    document.getElementsByTagName('body')[0].appendChild(node);
});
