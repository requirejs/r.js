define(
    [
        'b',
        'c',
        'exports'
    ],
    function (b, c, exports) {
        exports.name = 'a';
        exports.bName = b.name;
        exports.cName = c.name;
    }
);
