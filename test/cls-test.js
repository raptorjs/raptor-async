'use strict';

var Assert = require('assert');
var AsyncValue = require('../AsyncValue');
var Async = require('async');
var ns = require('continuation-local-storage').createNamespace('test-ns');
var cache;

function getCommonData(cb) {
    if (cache) {
        return cache.done(cb);
    }
    cache = new AsyncValue();
    cache.done(cb);
    setTimeout(function () {
        cache.resolve('common data');
    }, 100);
}

function setupCtx(next) {
    ns.run(function () {
        var ctx = {};
        ns.set('ctx', ctx);
        process.nextTick(next.bind(null, null));
    });
}

function mockRequest(name, cb) {
    Async.series([
        function setup(next) {
            setupCtx(function () {
                ns.get('ctx').name = name;
                next();
            });
        },
        // simulate common data access with lazy load
        getCommonData
    ], function sayHello() {
        cb(null, 'Hello ' + ns.get('ctx').name);
    });
}

describe('raptor-async/DataHolder continuation-local-storage', function() {
    it('should not create conflicts between different requests', function (done) {
        Async.parallel({
            greetJohn: mockRequest.bind(null, 'John'),
            greetBob: mockRequest.bind(null, 'Bob'),
        }, function validate(err, greetings) {
            Assert.equal('Hello Bob', greetings.greetBob);
            Assert.equal('Hello John', greetings.greetJohn);
            done();
        });
    });

    it('should not create conflicts between different requests after the cache is already loaded', function (done) {
        Async.parallel({
            greetJohn: mockRequest.bind(null, 'John'),
            greetBob: mockRequest.bind(null, 'Bob'),
        }, function validate(err, greetings) {
            Assert.equal('Hello Bob', greetings.greetBob);
            Assert.equal('Hello John', greetings.greetJohn);
            done();
        });
    });
});
