//Try a config that is indented, and has an array value, with a function.
(function () {
            require.config({
                baseUrl: "some/thing",
                packages: ["a", "b", "another"],
                shim: {
                    "backbone": {
                        deps: ["underscore", "jquery"],
                        exports: "Backbone",
                        init: function (underscore, jquery) {
                            //Do the harsh removal.
                            return Backbone.noConflict(true);
                        }
                    }
                }
            });
}());