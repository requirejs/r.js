
define('plug',{
    pluginBuilder: './plugBuilder',
    load: function () {
         throw 'Should be using pluginBuilder';
    }
});


define('plug!one',[],function () { return 'one';});

define('main',['plug!one'], function (one) {
    console.log('one === ' + one);
});
