if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(['./d'], function (d) {
    console.log('got d name: ' + d.name);
    return {
        name: 'b'
    };
});
