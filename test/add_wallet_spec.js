/**
 * Created by KMACIAZE on 27.10.2015.
 */

var AddWallet = require('../services/walletManagement/lib/wallet');
var Membership = require('../services/membership/index');
var mysqlDB = require('mysql');
var should = require('should');
var config = require('../config/config');
var assert = require('assert');

describe('Add wallet', function () {
   var addWallet,
       connection,
       username = 'aajklafdgopaidfgn',
       password = 'pass',
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
            membership.register(username, password, function (err, result) {
                validUser = result.user;
                done();
            });
        });
    });
    after(function (done) {
        connection.query('DELETE FROM users WHERE username = ?', [username], function (err, rows) {
            assert.ok(err === null, err);
            connection.end();
            done();
        });
    });
    describe('correctly adds a wallet', function() {
        var addedWalletResult;
        var walletAmount = '567',
            walletCurrency = 'EUR',
            walletName = "Krysia1";

        before(function(done) {
            addWallet.add({name: walletName, amount:walletAmount, currency:walletCurrency},
                validUser,
                function(err, result) {
                    addedWalletResult = result;
                    done();
                }
            );

        });
        after('deleting wallet ' + walletName, function(done) {
            connection.query('DELETE FROM wallet WHERE id = ?', [addedWalletResult.wallet.id], function (err, rows) {
                assert.ok(err === null, err);
                done();
            });
        });
        it('is successful', function () {
            addedWalletResult.success.should.equal(true);
        });
        it('creates a wallet in db', function () {
            addedWalletResult.wallet.should.be.defined;
        });
        it('created wallet should contains amount', function () {
            addedWalletResult.wallet.amount.should.be.defined;
        });
        it('created wallet should contains currency', function () {
            addedWalletResult.wallet.currencyId.should.be.defined;
        });
        it('created wallet should contains correct userId', function () {
            addedWalletResult.wallet.userId.should.equal(validUser.id);
        });
        it('sets appropriate message', function () {
            addedWalletResult.message.should.equal('Success!');
        });
        it('created wallet has an appropriate name', function () {
            addedWalletResult.wallet.name.should.equal(walletName);
        });
    });
    describe('an empty currency', function () {
        var addedWalletResult,
            walletAmount = '567',
            walletName = "Krysia2";
        before(function(done) {
            addWallet.add({name: walletName, amount: walletAmount},
                validUser,
                function(err, result) {
                    addedWalletResult = result;
                    done();
                }
            );
        });
        it('is not successful', function () {
            addedWalletResult.success.should.equal(false);
        });
        it('gives appropriate message', function () {
            addedWalletResult.message.should.equal('currency field cannnot be empty');
        });
    });
    describe('an incorrect currency', function () {
        var addedWalletResult,
            walletAmount = '567',
            walletCurrency = 'xsd',
            walletName = "Krysia3";
        before(function(done) {
            addWallet.add({name: walletName, amount:walletAmount, currency: walletCurrency},
                validUser,
                function(err, result) {
                    addedWalletResult = result;
                    done();
                }
            );
        });
        it('is not successful', function () {
            addedWalletResult.success.should.equal(false);
        });
        it('gives appropriate message', function () {
            addedWalletResult.message.should.equal('Currency does not exist');
        });
    });
    describe('an empty amount field', function () {
        var addedWalletResult,
            walletCurrency = 'USD',
            walletName = "Krysia4";
        before(function(done) {
            addWallet.add({name: walletName, amount: undefined, currency: walletCurrency},
                validUser,
                function(err, result) {
                    addedWalletResult = result;
                    done();
                }
            );
        });
        after('deleting wallet ' +walletName,  function(done) {
            connection.query('DELETE FROM wallet WHERE id = ?', [addedWalletResult.wallet.id], function (err, rows) {
                assert.ok(err === null, err);
                done();
            });
        });
        it('is successful', function () {
            addedWalletResult.success.should.equal(true);
        });
        it('gives appropriate message', function () {
            addedWalletResult.wallet.amount.should.equal(0);
        });
    });
    describe('an empty name field', function () {
        var addedWalletResult,
            walletAmount = '123',
            walletCurrency = 'USD';
        before(function(done) {
            addWallet.add({amount: walletAmount, currency: walletCurrency},
                validUser,
                function(err, result) {
                    addedWalletResult = result;
                    done();
                }
            );
        });
        it('is not successful', function () {
            addedWalletResult.success.should.equal(false);
        });
        it('gives appropriate message', function () {
            addedWalletResult.message.should.equal('name field cannnot be empty');
        });
    });
    describe('an incorrect amount field', function () {
        var addedWalletResult,
            walletAmount = 'AlaMaKota',
            walletCurrency = 'USD',
            walletName = "Krysia6";
        before(function(done) {
            addWallet.add({name: walletName, amount: walletAmount, currency: walletCurrency},
                validUser,
                function(err, result) {
                    addedWalletResult = result;
                    done();
                }
            );
        });
        it('is name successful', function () {
            addedWalletResult.success.should.equal(false);
        });
        it('gives appropriate message', function () {
            addedWalletResult.message.should.equal('Amount is not a number');
        });
    });
    describe('adding wallet with the same name', function () {
        var addedWalletFirstResult,
            addedWalletSecondResult,
            walletAmount = '23',
            walletCurrency = 'USD',
            walletName = "Krysia";
        before(function(done) {
            addWallet.add({name: walletName, amount: walletAmount, currency: walletCurrency},
                validUser,
                function(err, result) {
                    addedWalletFirstResult = result;
                    addWallet.add({name: walletName, amount: walletAmount, currency: walletCurrency},
                        validUser,
                        function(err2, result2) {
                            addedWalletSecondResult = result2;
                            done();
                        }
                    );
                }
            );
        });
        after(function(done) {
            connection.query('DELETE FROM wallet WHERE id = ?', [addedWalletFirstResult.wallet.id], function (err, rows) {
                done();
            });
        });
        it('is not successful', function () {
            addedWalletSecondResult.success.should.equal(false);
        });
        it('contains appropriate message', function () {
            addedWalletSecondResult.message.should.equal('Wallet with name ' + walletName + ' already exists');
        });
    });
});