define(['require', 'text!one.txt'], function (require, oneText) {
    require(['text!two.txt'], function (twoText) {});
});

