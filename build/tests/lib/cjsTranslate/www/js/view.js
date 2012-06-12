var model = require('./model'),
    helper = require('./util/helper'),
    $ = require('jquery');

module.exports = {
    render: function () {
        return 'view.render() works';
    },
    model: model,
    helper: helper,
    $: $
};
