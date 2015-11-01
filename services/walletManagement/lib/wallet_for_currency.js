/**
 * Created by Kysiek on 01/11/15.
 */
var Wallet = require("../../../model/Wallet");
var Currency = require("../../../model/Currency");
var Emitter = require("events").EventEmitter;
var util = require("util");
var assert = require('assert');


var WalletResult = function (user, currency, walletName) {
    return {
        user: user,
        currency: currency,
        walletName: walletName,
        success: false,
        message: null,
        wallet: null
    }
};

var GetWalletForCurrency = function (dbConnection) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;


    var validateCurrency = function (getWalletsForCurrencyResult) {
        dbConnection.query('SELECT id, currency FROM currency WHERE currency = ?',
            [getWalletsForCurrencyResult.currency],
            function (err, rows) {
                assert.ok(err === null, err);
                if(rows != undefined && rows.length !== 0) {
                    getWalletsForCurrencyResult.currency = new Currency({
                        id: rows[0].id,
                        currency: rows[0].currency
                    });
                    if(getWalletsForCurrencyResult.walletName) {
                        self.emit("gwfc-currency-ok", getWalletsForCurrencyResult);
                    } else {
                        self.emit("gawfc-currency-ok", getWalletsForCurrencyResult);
                    }
                }  else {
                    getWalletsForCurrencyResult.message = "Invalid currency";
                    self.emit("gawfc-invalid", getWalletsForCurrencyResult);
                }

            });
    };


    var getAllWalletsForCurrencyFromDb = function(getWalletsForCurrencyResult) {
        dbConnection.query('SELECT w.id, w.name, w.amount * (SELECT rate FROM exchangerate WHERE fromCurrencyId = (SELECT id FROM currency WHERE currency = c.currency) AND toCurrencyId = ?) AS amount, c.currency FROM wallet AS w INNER JOIN currency AS c ON w.currencyId = c.id WHERE w.userId = ?',
            [getWalletsForCurrencyResult.currency.id, getWalletsForCurrencyResult.user.id],
            function (err, rows) {
                assert.ok(err === null, err);
                getWalletsForCurrencyResult.wallet = [];
                for (var i = 0, x = rows.length; i < x; i++) {
                    getWalletsForCurrencyResult.wallet.push({name: rows[i].name, initCurrency: rows[i].currency, amountInCurrency: getWalletsForCurrencyResult.currency.currency, amount: rows[i].amount, id: rows[i].id});
                }
                self.emit("gawfc-get-from-db-ok", getWalletsForCurrencyResult);
            });
    };

    var getWalletForCurrencyAndForNameFromDb = function(getWalletForCurrencyResult) {
        dbConnection.query('SELECT w.id, w.name, w.amount * (SELECT rate FROM exchangerate WHERE fromCurrencyId = (SELECT id FROM currency WHERE currency = c.currency) AND toCurrencyId = ?) AS amount, c.currency FROM wallet AS w INNER JOIN currency AS c ON w.currencyId = c.id WHERE w.userId = ? AND w.name = ?',
            [getWalletForCurrencyResult.currency.id, getWalletForCurrencyResult.user.id, getWalletForCurrencyResult.walletName],
            function (err, rows) {
                assert.ok(err === null, err);
                if(rows[0]) {
                    getWalletForCurrencyResult.wallet = {name: rows[0].name, initCurrency: rows[0].currency, amountInCurrency: getWalletForCurrencyResult.currency.currency, amount: rows[0].amount, id: rows[0].id};
                    self.emit("gwfc-get-from-db-ok", getWalletForCurrencyResult);
                } else {
                    getWalletForCurrencyResult.message = "Wallet with given name does not exist";
                    self.emit("gwfc-invalid", getWalletForCurrencyResult);
                }

            });
    };
    var getWalletsForCurrencyOk = function(getWalletsForCurrencyResult) {
        getWalletsForCurrencyResult.message = "Success!";
        getWalletsForCurrencyResult.success = true;
        self.emit("gawfc-ok", getWalletsForCurrencyResult);
        if(continueWith) {
            continueWith(null, getWalletsForCurrencyResult);
        }
    };

    var getWalletsForCurrencyNotOk = function(getWalletsForCurrencyResult) {
        getWalletsForCurrencyResult.success = false;
        self.emit("gawfc-not-ok", getWalletsForCurrencyResult);
        if(continueWith) {
            continueWith(null, getWalletsForCurrencyResult);
        }
    };


    var getWalletForCurrencyOk = function(getWalletForCurrencyResult) {
        getWalletForCurrencyResult.message = "Success!";
        getWalletForCurrencyResult.success = true;
        self.emit("gwfc-ok", getWalletForCurrencyResult);
        if(continueWith) {
            continueWith(null, getWalletForCurrencyResult);
        }
    };
    var getWalletForCurrencyNotOk = function(getWalletForCurrencyResult) {
        getWalletForCurrencyResult.success = false;
        self.emit("gwfc-not-ok", getWalletForCurrencyResult);
        if(continueWith) {
            continueWith(null, getWalletForCurrencyResult);
        }
    };

    //Get wallet for currency path
    self.on("get-wallet-for-currency-request-received", validateCurrency);
    self.on("gwfc-currency-ok", getWalletForCurrencyAndForNameFromDb);
    self.on("gwfc-get-from-db-ok", getWalletForCurrencyOk);

    self.on("gwfc-invalid", getWalletForCurrencyNotOk);

    //Get wallets for currency path
    self.on("get-all-wallets-for-currency-request-received", validateCurrency);
    self.on("gawfc-currency-ok", getAllWalletsForCurrencyFromDb);
    self.on("gawfc-get-from-db-ok", getWalletsForCurrencyOk);

    self.on("gawfc-invalid", getWalletsForCurrencyNotOk);


    self.getAllForCurrency = function (user, currency, next) {
        continueWith = next;
        var getWalletResult = new WalletResult(user, currency);
        self.emit("get-all-wallets-for-currency-request-received", getWalletResult);
    };

    self.getWalletForNameAndForCurrency = function (user, currency, walletName, next) {
        continueWith = next;
        var getWalletResult = new WalletResult(user, currency, walletName);
        self.emit("get-wallet-for-currency-request-received", getWalletResult);
    };



    return self;
};
util.inherits(GetWalletForCurrency, Emitter);
module.exports = GetWalletForCurrency;