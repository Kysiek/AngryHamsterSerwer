/**
 * Created by Kysiek on 01/11/15.
 */

var Payment = require('../services/transaction/lib/payment');
var AddWallet = require('../services/walletManagement/lib/wallet');
var Membership = require('../services/membership/index');
var mysqlDB = require('mysql');
var should = require('should');
var config = require('../config/config');
var assert = require('assert');

describe('Payment', function () {
    var connection,
        payment,
        username = 'aajklafdgopaidfgn',
        password = 'pass',
        addWallet,
        validWallet,
        walletName = "Wallettttt Kysika",
        walletAmount = 456.8,
        walletCurrency = 'Bitcoin',
        validUser;
    before(function(done){
        connection = mysqlDB.createConnection({host: config.DB_HOST, user: config.DB_USER, password: config.DB_PASSWORD, database: config.DB_NAME});
        connection.connect(function(err) {
            if(err) {
                console.log('Error while connecting to the MySQL DB: ' + err.stack);
                done();
                return;
            }
            var membership = new Membership(connection);
            addWallet = new AddWallet(connection);
            payment = new Payment(connection);
            membership.register(username, password, function (err, result) {
                validUser = result.user;
                addWallet.add({name: walletName, amount:walletAmount, currency:walletCurrency},
                    validUser,
                    function(err, result) {
                        validWallet = result.wallet;
                        done();
                    }
                );
            });
        });
    });
    after('deleting wallet ' + walletName, function(done) {
        connection.query('DELETE FROM wallet WHERE id = ?', [validWallet.id], function (err, rows) {
            assert.ok(err === null, console.log(err));
            connection.query('DELETE FROM users WHERE username = ?', [username], function (err, rows) {
                assert.ok(err === null, console.log(err));
                connection.end();
                done();
            });
        });
    });
    describe('correctly adds payment', function () {
        var makeAPaymentResult,
            amount = '46';
        before(function (done) {
            payment.make(validUser,{amount: amount, toWallet:validWallet.name},function(err, result) {
                makeAPaymentResult = result;
                console.log(makeAPaymentResult);
                done();
            });
        });
        after(function (done) {
            connection.query('DELETE FROM transactions WHERE id = ?', [makeAPaymentResult.payment.id], function (err, rows) {
                assert.ok(err === null, err);
                done();
            });
        });
        it('is successful', function () {
            makeAPaymentResult.success.should.equal(true);
        });
        it('creats a payment in db', function() {
            makeAPaymentResult.payment.should.be.defined;
        });
        it('created payment should contain id', function () {
            makeAPaymentResult.payment.id.should.be.defined;
        });
        it('created payment should contain appropriate type', function () {
            makeAPaymentResult.payment.transactionType.should.equal(config.TRANSACTION_TYPE[config.PAYMENT_KEY]);
        });
        it('date should be defined', function () {
            makeAPaymentResult.payment.transDate.should.be.defined;
        });
        it('amount on wallet is bigger', function (done) {
            connection.query('SELECT amount FROM wallet WHERE id = ?', [validWallet.id], function (err, rows) {
                assert.ok(err === null, err);
                rows[0].amount.should.be.defined;
                rows[0].amount.should.be.equal(validWallet.amount + parseFloat(amount));
                done();
            });
        });
    });
    describe('invalid amount', function () {
        var makeAPaymentResult,
            amount = 'alamakota';
        before(function (done) {
            payment.make(validUser,{amount: amount, toWallet:validWallet.name},function(err, result) {
                makeAPaymentResult = result;
                done();
            });
        });
        it('is not successful', function () {
            makeAPaymentResult.success.should.equal(false);
        });
        it('contains an appropriate message', function() {
            makeAPaymentResult.message.should.be.equal('Amount is not a number');
        });
    });
    describe('does not contain amount', function () {
        var makeAPaymentResult;
        before(function (done) {
            payment.make(validUser,{toWallet:validWallet.name},function(err, result) {
                makeAPaymentResult = result;
                done();
            });
        });
        it('is not successful', function () {
            makeAPaymentResult.success.should.equal(false);
        });
        it('contains an appropriate message', function() {
            makeAPaymentResult.message.should.be.equal('Amount field cannot be empty');
        });
    });
    describe('does not contain to wallet', function () {
        var makeAPaymentResult,
            amount = '23';
        before(function (done) {
            payment.make(validUser,{amount: amount},function(err, result) {
                makeAPaymentResult = result;
                done();
            });
        });
        it('is not successful', function () {
            makeAPaymentResult.success.should.equal(false);
        });
        it('contains an appropriate message', function() {
            makeAPaymentResult.message.should.be.equal('Wallet name parameter cannot be empty');
        });
    });
    describe('to wallet does not exist', function () {
        var makeAPaymentResult,
            amount = '23';
        before(function (done) {
            payment.make(validUser,{amount: amount, toWallet:validWallet.name + "a"},function(err, result) {
                makeAPaymentResult = result;
                done();
            });
        });
        it('is not successful', function () {
            makeAPaymentResult.success.should.equal(false);
        });
        it('contains an appropriate message', function() {
            makeAPaymentResult.message.should.be.equal('Wallet with given name does not exist');
        });
    });
});