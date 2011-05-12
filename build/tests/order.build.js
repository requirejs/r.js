//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../../requirejs/tests/order",
    dir: "builds/order",
    optimize: "none",

    paths: {
        "order": "../../order"
    },

    modules: [
        {
            name: "foo",
        }
    ]
}
