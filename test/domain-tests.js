'use strict';

require('chai').should();
require('chai').Assertion.includeStack = true;
var expect = require('chai').expect;
var Domain = require('domain');

var DataHolder = require('../DataHolder');

function createGroupDone(limit, next) {

    return function done(err) {
        if (err) {
            return next(err);
        }
        if (--limit <= 0) {
            next();
        }
    };
}

describe.only('raptor-async/DataHolder domain' , function() {

    afterEach(function () {
        var current;
        while((current = process.domain)) {
            current.exit();
        }
    });

    it('should preserve empty domain', function(done) {

        var holder = new DataHolder();
        holder.done(function shouldBeEmpty() {
            expect(!!process.domain).equal(false);
            done();
        });

        holder.resolve('ok');
    });

    it('should preserve corresponding state of domain', function(done) {

        done = createGroupDone(2, done);

        var holder = new DataHolder();
        holder.done(function shouldBeEmpty() {
            expect(!!process.domain).equal(false);
            done();
        });

        var domain = Domain.create();
        domain.run(function () {
            holder.done(function shouldNoBeEmpty() {
                expect(!!process.domain).equal(true);
                done();
            });
        });

        holder.resolve('ok');
    });

    it('should preserve corresponding state of domain, complex', function(done) {

        done = createGroupDone(3, done);

        var holder = new DataHolder();
        holder.done(function shouldBeEmpty() {
            expect(!!process.domain).equal(false);
            done();
        });

        var domain1 = Domain.create();
        domain1.run(function () {
            holder.done(function shouldNoBeEmpty() {
                expect(process.domain).to.equal(domain1);
                done();
            });
        });

        var domain2 = Domain.create();
        domain2.run(function () {
            holder.done(function shouldNoBeEmpty() {
                expect(process.domain).to.equal(domain2);
                done();
            });
        });

        holder.resolve('ok');
    });


});
