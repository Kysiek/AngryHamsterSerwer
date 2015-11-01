/**
 * Created by Kysiek on 01/11/15.
 */

var Withdraw = require('../services/transaction/lib/withdraw');
var AddWallet = require('../services/walletManagement/lib/wallet');
var Membership = require('../services/membership/index');
var mysqlDB = require('mysql');
var should = require('should');
var config = require('../config/config');
var assert = require('assert');

describe('Payment', function () {
    var connection,
        withdraw,
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
            withdraw = new Withdraw(connection);
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
            assert.ok(err === null, err);
            connection.query('DELETE FROM users WHERE username = ?', [username], function (err, rows) {
                assert.ok(err === null, err);
                connection.end();
                done();
            });
        });
    });
    describe('correctly adds a withdraw', function () {
        var makeAWithdrawResult,
            amount = '46';
        before(function (done) {
            withdraw.make(validUser,{amount: amount, fromWallet:validWallet.name},function(err, result) {
                makeAWithdrawResult = result;
                done();
            });
        });
        after(function (done) {
            connection.query('DELETE FROM transactions WHERE id = ?', [makeAWithdrawResult.withdraw.id], function (err, rows) {
                assert.ok(err === null, err);
                done();
            });
        });
        it('is successful', function () {
            makeAWithdrawResult.success.should.equal(true);
        });
        it('creats a payment in db', function() {
            makeAWithdrawResult.withdraw.should.be.defined;
        });
        it('created payment should contain id', function () {
            makeAWithdrawResult.withdraw.id.should.be.defined;
        });
        it('created payment should contain appropriate type', function () {
            makeAWithdrawResult.withdraw.transactionType.should.equal(config.TRANSACTION_TYPE[config.WITHDRAWAL_KEY]);
        });
        it('date should be defined', function () {
            makeAWithdrawResult.withdraw.transDate.should.be.defined;
        });
        it('amount on wallet is lower', function (done) {
            connection.query('SELECT amount FROM wallet WHERE id = ?', [validWallet.id], function (err, rows) {
                assert.ok(err === null, err);
                rows[0].amount.should.be.defined;
                rows[0].amount.should.be.equal(validWallet.amount - parseFloat(amount));
                done();
            });
        });
    });
    describe('invalid amount', function () {
        var makeAWithdrawResult,
            amount = 'alamakota';
        before(function (done) {
            withdraw.make(validUser,{amount: amount, fromWallet:validWallet.name},function(err, result) {
                makeAWithdrawResult = result;
                done();
            });
        });
        it('is not successful', function () {
            makeAWithdrawResult.success.should.equal(false);
        });
        it('contains an appropriate message', function() {
            makeAWithdrawResult.message.should.be.equal('Amount is not a number');
        });
    });
    describe('does not contain amount', function () {
        var makeAWithdrawResult;
        before(function (done) {
            withdraw.make(validUser,{fromWallet:validWallet.name},function(err, result) {
                makeAWithdrawResult = result;
                done();
            });
        });
        it('is not successful', function () {
            makeAWithdrawResult.success.should.equal(false);
        });
        it('contains an appropriate message', function() {
            makeAWithdrawResult.message.should.be.equal('Amount field cannot be empty');
        });
    });
    describe('does not contain from wallet', function () {
        var makeAWithdrawResult,
            amount = '23';
        before(function (done) {
            withdraw.make(validUser,{amount: amount},function(err, result) {
                makeAWithdrawResult = result;
                done();
            });
        });
        it('is not successful', function () {
            makeAWithdrawResult.success.should.equal(false);
        });
        it('contains an appropriate message', function() {
            makeAWithdrawResult.message.should.be.equal('Wallet name parameter cannot be empty');
        });
    });
    describe('from wallet does not exist', function () {
        var makeAWithdrawResult,
            amount = '23';
        before(function (done) {
            withdraw.make(validUser,{amount: amount, fromWallet:validWallet.name + "a"},function(err, result) {
                makeAWithdrawResult = result;
                done();
            });
        });
        it('is not successful', function () {
            makeAWithdrawResult.success.should.equal(false);
        });
        it('contains an appropriate message', function() {
            makeAWithdrawResult.message.should.be.equal('Wallet with given name does not exist');
        });
    });
});