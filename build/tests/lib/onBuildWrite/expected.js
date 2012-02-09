
def(function () {
    return {
        name: 'b'
    };
});
def( function (b) {
    return {
        name: 'a',
        b: b
    };
});

def( function (a, b) {
    window.a = a;
    window.b = b;
});
