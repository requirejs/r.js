
define('a',{});
define('text',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
define('text!hello.txt',[],function () { return 'hello world\n';});

define('main',['a', 'text!hello.txt'], function (a, msg) {
    console.log(a.name);
    console.log(msg);
});
