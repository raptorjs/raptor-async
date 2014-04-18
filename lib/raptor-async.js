'use strict';

function AsyncErrors() {
    this.mapped = {};
}

var asyncErrorsProto = AsyncErrors.prototype;

asyncErrorsProto.add = function(key, err) {
    this.mapped[key] = (err.stack || err);
};

asyncErrorsProto.toMap = function() {
    return this.mapped;
};

asyncErrorsProto.toArray = function() {
    var errors = Object.keys(this.mapped);
    for (var i = 0; i < errors.length; i++) {
        // store value in place of key
        errors[i] = this.mapped[errors[i]];
    }
    return errors;
};

asyncErrorsProto.toString = function() {
    var str = ['Errors encountered during async operation:'];

    // add mapped errors to resultant string
    for (var key in this.mapped) {
        if (this.mapped.hasOwnProperty(key)) {
            str.push(key + ': ' + this.mapped[key]);
        }
    }

    return str.join('\n');
};


function initError(errors) {
    if (errors !== undefined) {
        var err = new Error(errors.toString());
        ['toMap', 'toArray', 'mapped'].forEach(function(key) {
            err[key] = errors[key];
        });
        return err;
    }
    return errors;
}

module.exports = {
    parallel: function(work, callback, thisObj) {
        
        var errors;
        var results;
        var len;
        var pending;
        var i;

        thisObj = thisObj || this;

        var createCallback = function(key) {
            var invoked = false;
            return function(err, data) {

                if (invoked === true) {
                    throw new Error('callback for async operation with key "' + key + '" invoked more than once');
                }

                invoked = true;

                results[key] = data;
                
                if (err) {
                    if (errors === undefined) {
                        errors = new AsyncErrors();
                    }
                    errors.add(key, err);
                }

                pending--;
                if (pending === 0) {
                    return callback.call(thisObj, initError(errors), results);
                }
            };
        };

        if (Array.isArray(work)) {

            len = pending = work.length;

            // results will be an array
            results = new Array(len);

            if (pending === 0) {
                return callback.call(thisObj, null, results);
            }

            for (i = 0; i < len; i++) {
                work[i].call(thisObj, createCallback(i));
            }
        } else {

            var keys = Object.keys(work);
            len = pending = keys.length;

            // results will be an object
            results = {};

            if (pending === 0) {
                return callback.call(thisObj, null, results);
            }

            for (i = 0; i < len; i++) {
                var key = keys[i];
                work[key].call(thisObj, createCallback(key));
            }
        }
    },

    series: function(work, callback, thisObj) {
        
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
                    return callback.call(thisObj, initError(errors), results);
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
    }
};