requirejs.config({
    //Not a real config option, just want something here.
    placeholder: true
});

require.config({
    //Not a real config option, just want something here.
    placeholder: true
});

require(['modules/one', 'modules/two', 'modules/three'], function (one, two, three) {
    console.log("One's name is: " + one.name);
    console.log("Two's name is: " + two.name);
    console.log("Two's name is: " + three.name);
    console.log("Three's fourName is: " + three.fourName);
    console.log("Three's fiveName is: " + three.fiveName);
});
