
(function (define) {
    foo.define('modules/one',[], function ( ){
       return { name: 'one' };
    });

}(typeof foo.define === 'function' && foo.define.amd ? foo.define : function () {


}));

if (typeof foo.define === 'function' && foo.define.amd && foo.define.amd.jQuery) {
    foo.define('modules/two',[],function () {
       return { name: 'two' };
    });
}
;
if(false){

}else if(typeof foo.define === 'function' && typeof foo.define.amd === 'object' && foo.define.amd){
    foo.define('modules/four',{
        name: 'four'
    });
};
if ('function' === typeof foo.define && foo.define.amd) {
    foo.define('modules/five',[],function () {
       return { name: 'five' };
    });
}
;
(function (define) {
    foo.define('modules/three',['require'], function (require) {
        //If have dependencies, get them here
        var four = foo.require('./four'),
            five = foo.require('./five');

        //Return the module definition.
        return {
            name: 'three',
            fourName: four.name,
            fiveName: five.name,
        };
    });
}(typeof foo.define === 'function' && foo.define.amd ? foo.define : function (id, factory) {

}));

foo.requirejs.config({
    //Not a real config option, just want something here.
    placeholder: true
});

foo.require.config({
    //Not a real config option, just want something here.
    placeholder: true
});

foo.require(['modules/one', 'modules/two', 'modules/three'], function (one, two, three) {
    console.log("One's name is: " + one.name);
    console.log("Two's name is: " + two.name);
    console.log("Two's name is: " + three.name);
    console.log("Three's fourName is: " + three.fourName);
    console.log("Three's fiveName is: " + three.fiveName);
});

foo.define("main", function(){});
