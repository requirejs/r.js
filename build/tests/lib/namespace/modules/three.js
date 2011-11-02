(function (define) {
    define('modules/three', function (require) {
        //If have dependencies, get them here
        var four = require('./four');

        //Return the module definition.
        return {
            name: 'three',
            fourName: four.name
        };
    });
}(typeof define === 'function' && define.amd ? define : function (id, factory) {

}));
