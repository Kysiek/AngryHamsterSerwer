/**
 * Created by KMACIAZE on 02.11.2015.
 */
var Transaction = require("../../../model/transaction");
var Emitter = require("events").EventEmitter;
var util = require("util");
var assert = require('assert');
var config = require('../../../config/config');


var HistoryResult = function (user, walletName) {
    return {
        success: false,
        message: null,
        user: user,
        wallet: walletName,
        history: []
    }
};

var TransactionHistory = function (dbConnection) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var transactionToHistoryObject = function(transaction) {
        if(transaction.transactionType == config.TRANSACTION_TYPE[config.PAYMENT_KEY]) {
            return {
                type: 0,
                wallet: transaction.walletFrom,
                amount: transaction.amount,
                amountAfterOperation: transaction.amountAfterTransaction,
                date: transaction.date
            }
        } else if(transaction.transactionType == config.TRANSACTION_TYPE[config.WITHDRAWAL_KEY]) {
            return {
                type: 1,
                wallet: transaction.walletFrom,
                amount: transaction.amount,
                amountAfterOperation: transaction.amountAfterTransaction,
                date: transaction.date
            }
        } else if(transaction.transactionType == config.TRANSACTION_TYPE[config.TRANSFER_KEY]) {
            return {
                type: 2,
                fromWallet: transaction.walletFrom,
                toWallet: transaction.walletTo,
                amount: transaction.amount,
                amountAfterOperationOnFirstWallet: transaction.amountAfterTransaction,
                amountAfterOperationOnSecondWallet: transaction.amountAfterTransactionOnSecondWallet,
                date: transaction.date
            }
        }
    };
    var checkWalletExist = function (historyResult) {
        if(historyResult.wallet) {
            dbConnection.query('SELECT * FROM wallet WHERE name = ? AND userId = ?',
                [historyResult.wallet, historyResult.user.id],
                function (err, rows) {
                    assert.ok(err === null, err);
                    if(rows[0]) {
                        historyResult.wallet = rows[0];
                        self.emit("wallet-ok", historyResult);
                    } else {
                        historyResult.message = "Wallet does not exist";
                        self.emit("history-not-ok", historyResult);
                    }
                });
        } else {
            self.emit("wallet-ok", historyResult);
        }

    };
    var getTransactionHistoryFromDatabase = function (historyResult) {
        dbConnection.query("SELECT (SELECT name FROM wallet where id = walletId) AS walletFrom, (SELECT name FROM wallet where id = toWalletId) AS walletTo, amount, amountAfterTransaction, amountAfterTransactionOnSecondWallet, transactionType, DATE_FORMAT(transDate, '%H:%i %d.%m.%Y') AS date FROM transactions WHERE walletId IN (SELECT id FROM wallet WHERE userId = ?)",
            [historyResult.user.id],
            function (err, rows) {
                assert.ok(err === null, err);
                for (var i = 0, x = rows.length; i < x; i++) {
                    if(historyResult.wallet) {
                        if(historyResult.wallet.name == rows[i].walletFrom || historyResult.wallet.name == rows[i].walletTo) {
                            historyResult.history.push(transactionToHistoryObject(rows[i]));
                        }
                    } else {
                        historyResult.history.push(transactionToHistoryObject(rows[i]));
                    }
                }
                self.emit("got-transaction-history-from-db", historyResult);
            });
    };
    var getHistoryOk = function(historyResult) {
        historyResult.message = "Success!";
        historyResult.success = true;
        self.emit("get-history-ok", historyResult);
        if(continueWith) {
            continueWith(null, historyResult);
        }
    };
    var getHistoryNotOk = function(historyResult) {
        historyResult.success = false;
        self.emit("get-not-history-ok", historyResult);
        if(continueWith) {
            continueWith(null, historyResult);
        }
    };
    self.get = function (user, walletName, next) {
        continueWith = next;
        var historyResult = new HistoryResult(user, walletName);
        self.emit("get-transaction-history-request-received", historyResult);
    };

    self.on("get-transaction-history-request-received", checkWalletExist);
    self.on("wallet-ok", getTransactionHistoryFromDatabase);
    self.on("got-transaction-history-from-db", getHistoryOk);


    self.on("history-not-ok", getHistoryNotOk);



    return self;
};
util.inherits(TransactionHistory, Emitter);
module.exports = TransactionHistory;