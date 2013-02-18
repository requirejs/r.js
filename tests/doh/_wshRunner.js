/*global doh, WScript, console: true */
(function(){
    //wsh cannot seem to handle passing Echo multiple args,
    //at via apply, and when printing errors, will just do
    //the dumb [Object Error] instead of the more helpful
    //message
    function wshFormatArgs(args) {
        var i, item,
            ary = [];

        for (i = 0; i < args.length; i += 1) {
            item = args[i];
            ary.push(item.message || item);
        }

        return ary.join(' ');
    }

    doh.debug = function () {
        WScript.Echo(wshFormatArgs(arguments));
    };

    //Define a console.log for easier logging. Don't
    //get fancy though.
    if (typeof console === 'undefined') {
        console = {
            log: function () {
                WScript.Echo(wshFormatArgs(arguments));
            }
        };
    }

    // Override the doh._report method to make it quit with an
    // appropriate exit code in case of test failures.
    var oldReport = doh._report;
    doh._report = function(){
        oldReport.apply(doh, arguments);
        if(this._failureCount > 0 || this._errorCount > 0){
            WScript.Quit(1);
        }
    };
})();
