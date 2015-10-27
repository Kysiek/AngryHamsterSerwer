/**
 * Created by KMACIAZE on 23.10.2015.
 */

var events = require("events");
var util = require("util");
var Wallet = require("./lib/wallet");
var Currency = require("./lib/currency");
var assert = require("assert");

var WalletManagement = function (connection) {
    var self = this;
    events.EventEmitter.call(self);

    self.addWallet = function (name, amount, currency, user, next) {
        var wallet = new Wallet(connection);


        wallet.on("wallet-added", function (addWalletResult) {
            self.emit("wallet-added", addWalletResult)
        });
        wallet.on("wallet-not-added", function (addWalletResult) {
            self.emit("wallet-not-added", addWalletResult)
        });
        wallet.add({name: name, amount: amount, currency: currency}, user, next);
    };

    self.getWallets = function (user, next) {
        var wallet = new Wallet(connection);

        wallet.on("got-wallet", function (getWalletResult) {
            self.emit("got-wallet", getWalletResult)
        });
        wallet.on("got-not-wallet", function (getWalletResult) {
            self.emit("got-not-wallet", getWalletResult)
        });

        wallet.get(user, next);
    };

    self.getCurrencies = function (next) {
        var currency = new Currency(connection);

        currency.on("get-currencies-ok", function (getCurrencyResult) {
            self.emit("get-currencies-ok", getCurrencyResult)
        });
        currency.get(next);
    };
};


util.inherits(WalletManagement, events.EventEmitter);
module.exports = WalletManagement;