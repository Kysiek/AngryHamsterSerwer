/**
 * Created by KMACIAZE on 27.10.2015.
 */

var Currency = require('../services/walletManagement/lib/currency');
var mysqlDB = require('mysql');
var should = require('should');
var config = require('../config/config');
var assert = require('assert');


describe('Currencies', function () {
    var connection,
        currency;
    before(function(done) {
        connection = mysqlDB.createConnection({host: config.DB_HOST, user: config.DB_USER, password: config.DB_PASSWORD, database: config.DB_NAME});
        connection.connect(function(err) {
            if(err) {
                console.log('Error while connecting to the MySQL DB: ' + err.stack);
                done();
                return;
            }
            currency = new Currency(connection);
            done();
        });
    });
    after(function () {
        connection.end();
    });
    describe('Get currencies', function () {
        var getCurrenciesResult;
        before(function (done) {
            currency.get(function (err, result) {
                getCurrenciesResult = result;
                done();
            });
        });
        it('is successful', function () {
            getCurrenciesResult.success.should.equal(true);
        });
        it('currencies array should be defined', function () {
            getCurrenciesResult.currencies.should.be.defined;
        });
        it('it currencies array should have more than one element', function () {
            (getCurrenciesResult.currencies.length > 0).should.equal(true);
        });
    });
});