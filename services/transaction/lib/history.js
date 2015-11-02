/**
 * Created by KMACIAZE on 02.11.2015.
 */
var Transaction = require("../../../model/transaction");
var Emitter = require("events").EventEmitter;
var util = require("util");
var assert = require('assert');
var config = require('../../../config/config');


var HistoryResult = function (user) {
    return {
        success: false,
        message: null,
        user: user,
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
                wallet: transaction.walletId,
                amount: transaction.amount,
                amountAfterOperation: transaction.amountAfterTransaction,
                date: transaction.date
            }
        } else if(transaction.transactionType == config.TRANSACTION_TYPE[config.WITHDRAWAL_KEY]) {
            return {
                type: 1,
                wallet: transaction.walletId,
                amount: transaction.amount,
                amountAfterOperation: transaction.amountAfterTransaction,
                date: transaction.date
            }
        } else if(transaction.transactionType == config.TRANSACTION_TYPE[config.TRANSFER_KEY]) {
            return {
                type: 2,
                fromWallet: transaction.walletId,
                toWallet: transaction.toWalletId,
                amount: transaction.amount,
                amountAfterOperationOnFirstWallet: transaction.amountAfterTransaction,
                amountAfterOperationOnSecondWallet: transaction.amountAfterTransactionOnSecondWallet,
                date: transaction.date
            }
        }
    };

    var getTransactionHistoryFromDatabase = function (historyResult) {
        dbConnection.query("SELECT walletId, toWalletId, amount, amountAfterTransaction, amountAfterTransactionOnSecondWallet, transactionType, STR_TO_DATE(transDate, '%H:%i %d.%m.%Y') FROM transactions WHERE walletId IN (SELECT id FROM wallet WHERE userId = ?)",
            [historyResult.user.id],
            function (err, rows) {
                assert.ok(err === null, err);
                for (var i = 0, x = rows.length; i < x; i++) {
                    historyResult.history.push(transactionToHistoryObject(rows[i]));
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
    self.get = function (user, next) {
        continueWith = next;
        var historyResult = new HistoryResult(user);
        self.emit("get-transaction-history-request-received", historyResult);
    };

    self.on("get-transaction-history-request-received", getTransactionHistoryFromDatabase);
    self.on("got-transaction-history-from-db", getHistoryOk);

    return self;
};
util.inherits(TransactionHistory, Emitter);
module.exports = TransactionHistory;