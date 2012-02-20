
define('util',{
    id: 'util'
});


define('lib',['util'], function (util) {
    return {
        id: 'lib',
        util: util
    };
});
