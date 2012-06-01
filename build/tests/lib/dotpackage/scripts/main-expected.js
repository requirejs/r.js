
define('sample/main',{
    name: 'sample'
});


define('sample', ['sample/main'], function (main) { return main; });

define('main',['sample'], function (sample) {
    return {
        name: 'main',
        sampleName: sample.name
    };
});

