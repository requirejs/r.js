//Make sure named modules are scanned for nested dependencies.
define('top', ['require', 'a'], function (require, a) {
    foo.bar.include({
        renderUI: function () {
            require(['c'], function (c) {

            });
        }
    });
});
