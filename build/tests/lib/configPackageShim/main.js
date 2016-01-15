require.config({
    packages: [
        {
            'name': 'foo',
            'location': 'foo',
            'main': 'foo.js'
        },
        {
            'name': 'bar',
            'location': 'bar',
            'main': 'bar.js'
        }
    ],
    shim: {
        'foo': {
            'exports': 'Foo'
        },
        'bar': {
            'deps': ['foo']
        }
        
    }    
});
require(
['bar'],
function (bar) {
    console.log('main');
    bar.bar();
});
