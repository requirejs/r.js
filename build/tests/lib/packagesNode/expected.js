
define('foo/lib/bar',{
    name: 'bar'
});

define('foo/lib/baz',['./bar'], function (bar) {
    return {
        name: 'baz',
        bar: bar
    };
});

define('foo/lib/index',['./bar.js', './baz'], function (bar, baz) {
    return {
        name: 'foo',
        bar: bar,
        baz: baz
    };
});

define('foo', ['foo/lib/index'], function (main) { return main; });

require({
    nodeIdCompat: true,
    packages: [{
        name: 'foo',
        location: 'node_modules/foo',
        main: 'lib/index'
    }]
}, ['foo'], function (foo) {

    doh.register(
        'packagesNode',
        [
            function packagesNode(t){
                t.is('foo', foo.name);
                t.is('bar', foo.bar.name);
                t.is('baz', foo.baz.name);
                t.is('bar', foo.baz.bar.name);
            }
        ]
    );
    doh.run();
});

define("packagesNode-tests", function(){});
