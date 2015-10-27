/**
 * Created by KMACIAZE on 27.10.2015.
 */
var Wallet = require('../services/walletManagement/lib/wallet');
var Membership = require('../services/membership/index');
var mysqlDB = require('mysql');
var should = require('should');
var config = require('../config/config');
var assert = require('assert');


describe('Get wallet', function () {
    var validUser,
        wallet,
        username = 'aajklafdgopaidfgn',
        password = 'pass',
        connection,
        firstWalletCurrency = 'EUR',
        firstWalletAmount = 245.56,
        firstWalletName = "sxcasdasd",
        firstWalletId, secondWalletId,
        secondWalletCurrency = 'USD',
        secondWalletAmount = -45.09,
        secondWalletName = "sxc";
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
    describe('getWallet request', function () {
        var getWalletResults;
        before(function (done) {
            wallet.get(validUser, function (err, result) {
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
            firstWalletFromDatabase.amount.should.equal(firstWalletAmount);
            firstWalletFromDatabase.currency.should.equal(firstWalletCurrency);
            firstWalletFromDatabase.name.should.equal(firstWalletName);
            secondWalletFromDatabase.amount.should.equal(secondWalletAmount);
            secondWalletFromDatabase.currency.should.equal(secondWalletCurrency);
            secondWalletFromDatabase.name.should.equal(secondWalletName);
        });
    });
});