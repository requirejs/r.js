(function(root) {
define("a", [], function() {
  return (function() {
(function (root) {
    root.A = {
        name: 'a'
    };
}(this));

return (function () {
                    window.globalA = this.A.name;
                }.apply(this, arguments)) || A.name;
  }).apply(root, arguments);
});
}(this));

function D() {
    this.name = 'd';
};

define("d", function(){});

(function(root) {
define("b", ["a","d"], function() {
  return (function() {
var B = {
    name: 'b',
    aValue: A.name,
    dValue: new D()
};
//ending comment;
return root.B = B;
  }).apply(root, arguments);
});
}(this));

(function(root) {
define("c", ["a","b"], function() {
  return (function() {
var C = {
    name: 'c',
    a: A,
    b: B
};

return root.C = C;
  }).apply(root, arguments);
});
}(this));

(function(root) {
define("e", [], function() {
  return (function() {
var e = {
    nested: {
        e: {
            name: 'e'
        }
    }
};

return (function () {
                    return {
                        name: e.nested.e.name + 'Modified'
                    };
                }.apply(this, arguments)) || e.nested.e;
  }).apply(root, arguments);
});
}(this));

(function(root) {
define("f", ["a"], function() {
  return (function() {
var FCAP = {
    name: 'FCAP',
    globalA: A
};

return (function (a) {
                    return {
                        name: FCAP.name,
                        globalA: FCAP.globalA,
                        a: a
                    };
                }.apply(this, arguments));
  }).apply(root, arguments);
});
}(this));

require({
        baseUrl: './',
        shim: {
            a: {
                exports: 'A.name',
                init: function () {
                    window.globalA = this.A.name;
                }
            },
            'b': ['a', 'd'],
            'c': {
                deps: ['a', 'b'],
                exports: 'C'
            },
            'e': {
                exports: 'e.nested.e',
                init: function () {
                    return {
                        name: e.nested.e.name + 'Modified'
                    };
                }
            },
            'f': {
                deps: ['a'],
                init: function (a) {
                    return {
                        name: FCAP.name,
                        globalA: FCAP.globalA,
                        a: a
                    };
                }
            }
        }
    },
    ['a', 'c', 'e', 'f'],
    function(a, c, e, f) {
        doh.register(
            'shimBasic',
            [
                function shimBasic(t){
                    t.is('a', a);
                    t.is('a', window.globalA);
                    t.is('a', c.b.aValue);
                    t.is('b', c.b.name);
                    t.is('c', c.name);
                    t.is('d', c.b.dValue.name);
                    t.is('eModified', e.name);
                    t.is('FCAP', f.name);
                    t.is('a', f.globalA.name);
                    t.is('a', f.a);
                }
            ]
        );
        doh.run();
    }
);

define("basic-tests", function(){});

