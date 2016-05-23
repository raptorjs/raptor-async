module.exports = function series(work, callback, thisObj) {

    var results = new Array(work.length);

    thisObj = thisObj || this;

    if (work.length === 0) {
        return callback.call(thisObj, null, results);
    }

    var createCallback = function(index) {
        var invoked = false;
        return function(err, data) {

            if (invoked === true) {
                if (err) {
                    throw new Error('callback for async operation at index "' + index + '" failed after completion: ' + err.toString());
                }
                throw new Error('callback for async operation at index ' + index + ' invoked more than once');
            }

            invoked = true;

            if (err) {
                // stop on first error
                return callback.call(thisObj, err);
            }

            results[index] = data;

            var next = index + 1;
            if (next === work.length) {
                // finished
                return callback.call(thisObj, null, results);
            } else {
                // move on to next work item
                work[next].call(thisObj, createCallback(next));
            }
        };
    };

    // kick off the tasks by invoking first job
    work[0].call(thisObj, createCallback(0));
};
