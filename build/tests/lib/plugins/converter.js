if (typeof define === 'function' && define.amd) {
    define(['util'], function (util) {

        return {
            version: '2',
            convert: function (text) {
                return util(text);
            }
        };
    });
}