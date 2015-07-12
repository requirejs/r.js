if (typeof module === "object" && module && typeof module.exports === "object") {
    module.exports = jQuery;
} else {
    if (typeof(define) === "function" && define.amd) {
        define("jquery", [], function () { return jQuery; });
    }
}
