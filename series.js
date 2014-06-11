var AsyncErrors = require('./AsyncErrors');

module.exports = function series(work, callback, thisObj) {
    
    var results = new Array(work.length);
    var errors;

    thisObj = thisObj || this;

    if (work.length === 0) {
        return callback.call(thisObj, null, results);
    }

    var createCallback = function(index) {
        var invoked = false;
        return function(err, data) {
            if (invoked === true) {
                throw new Error('callback for async operation at index ' + index + ' invoked more than once');
            }

            invoked = true;

            results[index] = data;

            if (err) {
                errors = new AsyncErrors();
                errors.add(index, err);

                // stop on first error
                return callback.call(thisObj, AsyncErrors.init(errors), results);
            }

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