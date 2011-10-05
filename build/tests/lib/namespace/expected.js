
foo.define('modules/one',[],function ( ){
   return { name: 'one' };
});

;

foo.define('modules/two',[],function () {
   return { name: 'two' };
});

;

foo.require(['modules/one', 'modules/two'], function (one, two) {
    console.log("One's name is: " + one.name);
    console.log("Two's name is: " + two.name);
});

;

foo.define("main", function(){});
