var AsyncErrors;

module.exports = AsyncErrors = function AsyncErrors() {
    this.mapped = {};
};

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

AsyncErrors.init = function(errors) {
    if (errors !== undefined) {
        var err = new Error(errors.toString());
        ['toMap', 'toArray', 'mapped'].forEach(function(key) {
            err[key] = errors[key];
        });
        return err;
    }
    return errors;
};