var requirejsAsLib = true;
load('../../r.js');

requirejs(['main'], function (main) {
    print('main\'s name is: ' + main.name);
    print('a\'s name is: ' + main.a.name);
});

