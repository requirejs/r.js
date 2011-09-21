require(['modules/one', 'modules/two'], function (one, two) {
    console.log("One's name is: " + one.name);
    console.log("Two's name is: " + two.name);
});

