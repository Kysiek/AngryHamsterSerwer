/**
 * Created by KMACIAZE on 02.11.2015.
 */

var Transfer = require('../services/transaction/lib/transfer');
var AddWallet = require('../services/walletManagement/lib/wallet');
var Membership = require('../services/membership/index');
var mysqlDB = require('mysql');
var should = require('should');
var config = require('../config/config');
var assert = require('assert');

describe('Transfer', function () {
    var connection,
        walletFrom = {
            name: 'FromWalletBitcoinKysika',
            currency: 'Bitcoin',
            amount: 45.67
        },
        walletTo = {
            name: 'FromToPeercoinKysika',
            currency: 'Peercoin',
            amount: 7890.45
        },
        walletFromDb,
        walletToDb,
        username = 'aajklafdgopaidfgn',
        password = 'pass',
        validUser,
        transfer;
    before(function(done){
        connection = mysqlDB.createConnection({host: config.DB_HOST, user: config.DB_USER, password: config.DB_PASSWORD, database: config.DB_NAME});
        connection.connect(function(err) {
            if(err) {
                console.log('Error while connecting to the MySQL DB: ' + err.stack);
                done();
                return;
            }
            var membership = new Membership(connection);
            var addWallet = new AddWallet(connection);
            transfer = new Transfer(connection);
            membership.register(username, password, function (err, result) {
                validUser = result.user;
                addWallet.add({name: walletFrom.name, amount:walletFrom.amount, currency:walletFrom.currency},
                    validUser,
                    function(err, result) {
                        walletFromDb = result.wallet;
                        addWallet.add({name: walletTo.name, amount:walletTo.amount, currency:walletTo.currency},
                            validUser,
                            function(err2, result2) {
                                walletToDb = result2.wallet;
                                done();
                            }
                        );
                    }
                );
            });
        });
    });
    after(function(done) {
        connection.query('DELETE FROM wallet WHERE id IN (?,?)', [walletFromDb.id, walletToDb.id], function (err, rows) {
            assert.ok(err === null, err);
            connection.query('DELETE FROM users WHERE username = ?', [username], function (err, rows) {
                assert.ok(err === null, err);
                connection.end();
                done();
            });
        });
    });
    describe('Correctly makes a transfer', function() {
        var amountToTransfer = 12.56,
            transferResult;

        before(function (done) {
            transfer.make(validUser,{amount: amountToTransfer, fromWallet: walletFrom.name, toWallet:walletTo.name},function(err, result) {
                transferResult = result;
                done();
            });
        });

        after(function (done) {
            connection.query('DELETE FROM transactions WHERE id = ?', [transferResult.transfer.id], function (err, rows) {
                assert.ok(err === null, err);
                done();
            });
        });
        it('is successful', function () {
            transferResult.success.should.equal(true);
        });
        it('creates entry in database', function () {
            transferResult.transfer.id.should.be.defined;
        });
        it('walletFrom in database is correctly added', function () {
            transferResult.transfer.walletId.should.be.equal(walletFromDb.id);
        });
        it('walletTo in database is correctly added', function () {
            transferResult.transfer.toWalletId.should.be.equal(walletToDb.id);
        });
        it('walletFroms amount is correctly calculated', function (done) {
            connection.query('SELECT amount FROM wallet WHERE id = ?', [walletFromDb.id], function (err, rows) {
                assert.ok(err === null, err);
                rows[0].amount.should.be.defined;
                rows[0].amount.should.be.equal(walletFromDb.amount - amountToTransfer);
                rows[0].amount.should.be.equal(transferResult.transfer.amountAfterTransaction);
                done();
            });
        });
        it('walletTos amount is correctly calculated', function (done) {
            connection.query('SELECT rate FROM exchangerate WHERE fromCurrencyId = ? AND toCurrencyId = ?',
                [walletFromDb.currencyId, walletToDb.currencyId],
                function (err, rows) {
                    assert.ok(err === null, err);
                    var rate = rows[0].rate;
                    connection.query('SELECT amount FROM wallet WHERE id = ?', [walletToDb.id], function (err, rows) {
                        assert.ok(err === null, err);
                        rows[0].amount.should.be.defined;
                        rows[0].amount.should.be.equal(walletToDb.amount + amountToTransfer*rate);
                        rows[0].amount.should.be.equal(transferResult.transfer.amountAfterTransactionOnSecondWallet);
                        done();
                    });
                }
            );
        });
        it('Transaction type should be ' + config.TRANSACTION_TYPE[config.TRANSFER_KEY], function () {
            transferResult.transfer.transactionType.should.be.equal(config.TRANSACTION_TYPE[config.TRANSFER_KEY]);
        });
    });
    describe('To wallet does not exist', function() {
        var amountToTransfer = 12.56,
            transferResult;

        before(function (done) {
            transfer.make(validUser,{amount: amountToTransfer, fromWallet: walletFrom.name},function(err, result) {
                transferResult = result;
                done();
            });
        });
        it('is not successful', function () {
            transferResult.success.should.equal(false);
        });
        it('contains an appropriate massage', function () {
            transferResult.message.should.be.equal('WalletTo name parameter cannot be empty');
        });
    });
    describe('From wallet does not exist', function() {
        var amountToTransfer = 12.56,
            transferResult;

        before(function (done) {
            transfer.make(validUser,{amount: amountToTransfer, toWallet:walletTo.name},function(err, result) {
                //amount: amountToTransfer, fromWallet: walletFrom.name, toWallet:walletTo.name
                transferResult = result;
                done();
            });
        });
        it('is not successful', function () {
            transferResult.success.should.equal(false);
        });
        it('contains an appropriate massage', function () {
            transferResult.message.should.be.equal('WalletFrom name parameter cannot be empty');
        });
    });
    describe('Amount does not exist', function() {
        var amountToTransfer = 12.56,
            transferResult;

        before(function (done) {
            transfer.make(validUser,{fromWallet: walletFrom.name, toWallet:walletTo.name},function(err, result) {
                //amount: amountToTransfer, fromWallet: walletFrom.name, toWallet:walletTo.name
                transferResult = result;
                done();
            });
        });
        it('is not successful', function () {
            transferResult.success.should.equal(false);
        });
        it('contains an appropriate massage', function () {
            transferResult.message.should.be.equal('Amount field cannot be empty');
        });
    });
    describe('Amount is not a number', function() {
        var amountToTransfer = "alamakota",
            transferResult;

        before(function (done) {
            transfer.make(validUser,{amount: amountToTransfer, fromWallet: walletFrom.name, toWallet:walletTo.name},function(err, result) {
                //amount: amountToTransfer, fromWallet: walletFrom.name, toWallet:walletTo.name
                transferResult = result;
                done();
            });
        });
        it('is not successful', function () {
            transferResult.success.should.equal(false);
        });
        it('contains an appropriate massage', function () {
            transferResult.message.should.be.equal('Amount is not a number');
        });
    });
    describe('WalletTo name does not exist', function() {
        var amountToTransfer = "23.56",
            transferResult;

        before(function (done) {
            transfer.make(validUser,{amount: amountToTransfer, fromWallet: walletFrom.name, toWallet:walletTo.name + "a"},function(err, result) {
                transferResult = result;
                done();
            });
        });
        it('is not successful', function () {
            transferResult.success.should.equal(false);
        });
        it('contains an appropriate massage', function () {
            transferResult.message.should.be.equal('WalletTo does not exist');
        });
    });
    describe('WalletFrom name does not exist', function() {
        var amountToTransfer = "23.56",
            transferResult;

        before(function (done) {
            transfer.make(validUser,{amount: amountToTransfer, fromWallet: walletFrom.name + "a", toWallet:walletTo.name},function(err, result) {
                transferResult = result;
                done();
            });
        });
        it('is not successful', function () {
            transferResult.success.should.equal(false);
        });
        it('contains an appropriate massage', function () {
            transferResult.message.should.be.equal('WalletFrom does not exist');
        });
    });
    describe('WalletFrom name does not exist', function() {
        var amountToTransfer = "232323.56",
            transferResult;

        before(function (done) {
            transfer.make(validUser,{amount: amountToTransfer, fromWallet: walletFrom.name, toWallet:walletTo.name},function(err, result) {
                transferResult = result;
                done();
            });
        });
        it('is not successful', function () {
            transferResult.success.should.equal(false);
        });
        it('contains an appropriate massage', function () {
            transferResult.message.should.be.equal('Not enough money on first wallet');
        });
    });
});