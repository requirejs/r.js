(function() {
    define("myModuleA", function() {
        return {
            "A" : function( a ) { return a + 1; }
        };
    });
}());

define("myModuleB", [ "myModuleA" ], function( modA ) {
    return {
        "A" : function( a ) { return modA(a) + 1; }
    };
});
