doh.debug = print;

//Define a console.log for easier logging. Don't
//get fancy though.
if (typeof console === 'undefined') {
    console = {
        log: function () {
            print.apply(undefined, arguments);
        }
    };
}

// Override the doh._report method to make it quit with an
// appropriate exit code in case of test failures.
(function(){
    var oldReport = doh._report;
    doh._report = function(){
        oldReport.apply(doh, arguments);
        if(this._failureCount > 0 || this._errorCount > 0){
            quit(1);
        }
    }
})();
