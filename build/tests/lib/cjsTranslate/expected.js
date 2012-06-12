
define('template',['require','exports','module'],function (require, exports, module) {

module.exports = {
    compile: function () {
        return 'template.compile() works';
    }
};

});

define('model',['require','exports','module'],function (require, exports, module) {

module.exports = {
    create: function () {
        return 'module.create() works';
    }
};

});

define('controller',['require','exports','module','./model'],function (require, exports, module) {
var model = require('./model');

module.exports = {
    control: function () {
        return 'controller is ready';
    },
    model: model
}

});

define('util/helper',[],function () {
    return function () {
        return 'helper is ready';
    };
});

define('jquery',[],function () {
    return function () {};
});

define('view',['require','exports','module','./model','./util/helper','jquery'],function (require, exports, module) {
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

});

define('lib',['require','exports','module','./template','./model','./controller','./view'],function (require, exports, module) {
//Define the lib by aggregating its parts.

module.exports = {
    template: require('./template'),
    model: require('./model'),
    controller: require('./controller'),
    view: require('./view')
};

});
