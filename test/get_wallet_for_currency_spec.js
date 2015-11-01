/**
 * Created by Kysiek on 01/11/15.
 */

var WalletForCurrency = require('../services/walletManagement/lib/wallet_for_currency');
var Wallet = require('../services/walletManagement/lib/wallet');
var Membership = require('../services/membership/index');
var mysqlDB = require('mysql');
var should = require('should');
var config = require('../config/config');
var assert = require('assert');


describe('Get wallet for currency', function () {
    var validUser,
        wallet,
        walletForCurrency,
        username = 'aajklafdgopaidfgn',
        password = 'pass',
        connection,
        firstWalletCurrency = 'Bitcoin',
        firstWalletAmount = 2.56,
        firstWalletName = "Bitcoin wallet",
        firstWalletId, secondWalletId,
        secondWalletCurrency = 'Litecoin',
        secondWalletAmount = 23.09,
        secondWalletName = "Litecoin wallet",
        currencyRequested = "Bitcoin";
    before(function (done) {
        connection = mysqlDB.createConnection({host: config.DB_HOST, user: config.DB_USER, password: config.DB_PASSWORD, database: config.DB_NAME});
        connection.connect(function(err) {
            if(err) {
                console.log('Error while connecting to the MySQL DB: ' + err.stack);
                done();
                return;
            }
            var membership = new Membership(connection);
            wallet = new Wallet(connection);
            walletForCurrency = new WalletForCurrency(connection);
            membership.register(username, password, function (err1, result1) {
                validUser = result1.user;
                wallet.add({name: firstWalletName, amount:firstWalletAmount, currency:firstWalletCurrency},
                    validUser,
                    function(err2, result2) {
                        firstWalletId = result2.wallet.id;
                        wallet.add({name: secondWalletName, amount:secondWalletAmount, currency:secondWalletCurrency},
                            validUser,
                            function(err3, result3) {
                                secondWalletId = result3.wallet.id;
                                done();
                            }
                        );
                    }
                );
            });
        });
    });
    after(function (done) {

        connection.query('DELETE FROM wallet WHERE id IN (?,?)', [firstWalletId, secondWalletId], function (err, rows) {
            assert.ok(err === null, err);
            connection.query('DELETE FROM users WHERE username = ?', [username], function (err, rows) {
                assert.ok(err === null, err);
                connection.end();
                done();
            });
        });
    });
    describe('getWalletsForCurrency request', function () {
        var getWalletResults;
        before(function (done) {
            walletForCurrency.getAllForCurrency(validUser, currencyRequested, function (err, result) {
                assert.ok(err === null, err);
                getWalletResults = result;
                done();
            });
        });
        it('should be successful', function () {
            getWalletResults.success.should.equal(true);
        });
        it('should contain appropriate message', function () {
            getWalletResults.message.should.equal('Success!');
        });
        it('should contain two wallets', function () {
            getWalletResults.wallet.length.should.equal(2);
        });
        it('should contain appropriate wallets', function () {
            var wallets = getWalletResults.wallet,
                firstWalletFromDatabase,
                secondWalletFromDatabase;
            if(wallets[0].id == firstWalletId) {
                firstWalletFromDatabase = wallets[0];
                secondWalletFromDatabase = wallets[1];

            } else {
                secondWalletFromDatabase = wallets[0];
                firstWalletFromDatabase = wallets[1];
            }
            console.log(wallets[0]);
            console.log(wallets[1]);
            firstWalletFromDatabase.amount.should.be.defined;
            firstWalletFromDatabase.initCurrency.should.equal(firstWalletCurrency);
            firstWalletFromDatabase.amountInCurrency.should.equal(currencyRequested);
            firstWalletFromDatabase.name.should.equal(firstWalletName);
            secondWalletFromDatabase.amount.should.be.defined;
            secondWalletFromDatabase.initCurrency.should.equal(secondWalletCurrency);
            secondWalletFromDatabase.amountInCurrency.should.equal(currencyRequested);
            secondWalletFromDatabase.name.should.equal(secondWalletName);
        });
    });
    describe('invalid currency', function () {
        var getWalletResults;
        before(function (done) {
            walletForCurrency.getAllForCurrency(validUser, 'Bitcoinn', function (err, result) {
                assert.ok(err === null, err);
                getWalletResults = result;
                done();
            });
        });
        it('should not be successful', function () {
            getWalletResults.success.should.equal(false);
        });
        it('should contain appropriate message', function () {
            getWalletResults.message.should.equal('Invalid currency');
        });
    });
    describe('getWalletForCurrencyAndForName request', function () {
        var getWalletResults;
        before(function (done) {
            walletForCurrency.getWalletForNameAndForCurrency(validUser, currencyRequested, firstWalletName, function (err, result) {
                assert.ok(err === null, err);
                getWalletResults = result;
                done();
            });
        });
        it('should be successful', function () {
            getWalletResults.success.should.equal(true);
        });
        it('should contain appropriate message', function () {
            getWalletResults.message.should.equal('Success!');
        });
        it('should contain appropriate wallet', function () {
            console.log(getWalletResults.wallet);
            getWalletResults.wallet.amount.should.be.defined;
            getWalletResults.wallet.initCurrency.should.equal(firstWalletCurrency);
            getWalletResults.wallet.name.should.equal(firstWalletName);
            getWalletResults.wallet.amountInCurrency.should.equal(currencyRequested);
            getWalletResults.wallet.name.should.equal(firstWalletName);
        });
    });
});