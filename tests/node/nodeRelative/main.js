var requirejs = require("../../../r.js");

requirejs.config({
    baseUrl: __dirname,
    paths: {
        lamp: 'other/src/lamp'
    }
});

requirejs(['lamp'], function (lamp) {
    console.log('lamp name ' + (lamp.name === 'lamp' ? 'PASSED' : 'FAILED'));
    console.log('light name ' + (lamp.light.name === 'light' ? 'PASSED' : 'FAILED'));
});
