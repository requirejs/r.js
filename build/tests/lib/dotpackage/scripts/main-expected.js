
define('sample',{
    name: 'sample'
});


define('main',['sample'], function (sample) {
    return {
        name: 'main',
        sampleName: sample.name
    };
});

