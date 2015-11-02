/**
 * Created by Kysiek on 01/11/15.
 */

var Transaction = require("../../../model/Transaction");
var Emitter = require("events").EventEmitter;
var util = require("util");
var assert = require('assert');
var config = require('../../../config/config');

var WithdrawResult = function(args, user) {
    return {
        args: args,
        user: user,
        success: false,
        message: null,
        wallet: null,
        withdraw: null
    }
};

var Withdraw = function(dbConnection) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var validateArguments = function(withdrawResult) {
        if(!withdrawResult.args.fromWallet) {
            withdrawResult.message = "Wallet name parameter cannot be empty";
            self.emit("withdraw-invalid", withdrawResult);
        } else if(!withdrawResult.args.amount) {
            withdrawResult.message = "Amount field cannot be empty";
            self.emit("withdraw-invalid", withdrawResult);
        }  else {
            if(isNaN(withdrawResult.args.amount)) {
                withdrawResult.message = "Amount is not a number";
                self.emit("withdraw-invalid", withdrawResult);
            } else {
                withdrawResult.args.amount = parseFloat(withdrawResult.args.amount);
                self.emit("arguments-ok", withdrawResult);
            }
        }
    };

    var checkWalletExist = function (withdrawResult) {
        dbConnection.query('SELECT * FROM wallet WHERE name = ? AND userId = ?',
            [withdrawResult.args.fromWallet, withdrawResult.user.id],
            function (err, rows) {
                assert.ok(err === null, err);
                if(rows[0]) {
                    withdrawResult.wallet = rows[0];
                    self.emit("wallet-exist", withdrawResult);
                } else {
                    withdrawResult.message = "Wallet with given name does not exist";
                    self.emit("withdraw-invalid", withdrawResult);
                }
            });
    };

    var checkEnoughResources = function(withdrawResult) {
        if(withdrawResult.wallet.amount < withdrawResult.args.amount) {
            withdrawResult.message = "Not enough money";
            self.emit("withdraw-invalid", withdrawResult);
        } else {
            self.emit("available-resources-ok", withdrawResult);
        }
    };
    var decreaseWalletAmount = function(withdrawResult) {
        withdrawResult.wallet.amount = withdrawResult.wallet.amount - withdrawResult.args.amount;
        dbConnection.query('UPDATE wallet SET amount = ? WHERE id = ?', [withdrawResult.wallet.amount, withdrawResult.wallet.id], function(err, result) {
            assert.ok(err === null, err);
            self.emit("wallet-amount-decreased", withdrawResult);
        });
    };
    var createWithdrawObject = function(withdrawResult) {
        withdrawResult.withdraw = new Transaction({
            walletId: withdrawResult.wallet.id,
            toWalletId: null,
            amountAfterTransaction: withdrawResult.wallet.amount,
            amountAfterTransactionOnSecondWallet: null,
            amount: withdrawResult.args.amount,
            transactionType: config.TRANSACTION_TYPE[config.WITHDRAWAL_KEY],
            transDate: new Date()
        });
        self.emit("withdraw-obj-created", withdrawResult);
    };

    var insertWithdrawIntoDB = function (withdrawResult) {
        dbConnection.query('INSERT INTO transactions SET ?', withdrawResult.withdraw, function(err, result) {
            assert.ok(err === null, err);
            dbConnection.query('SELECT * FROM transactions WHERE id = ?', [result.insertId], function (err, rows) {
                assert.ok(err === null, err);
                withdrawResult.withdraw = rows[0];
                self.emit("withdraw-inserted", withdrawResult);
            });

        });
    };

    var withdrawOk = function(withdrawResult) {
        withdrawResult.message = "Success!";
        withdrawResult.success = true;
        self.emit("withdraw-made", withdrawResult);
        if(continueWith) {
            continueWith(null, withdrawResult);
        }
    };
    var withdrawNotOk = function(withdrawResult) {
        withdrawResult.success = false;
        self.emit("withdraw-not-made", withdrawResult);
        if(continueWith) {
            continueWith(null, withdrawResult);
        }
    };

    self.on("make-a-withdraw-request-received", validateArguments);
    self.on("arguments-ok", checkWalletExist);
    self.on("wallet-exist", checkEnoughResources);
    self.on("available-resources-ok", decreaseWalletAmount);
    self.on("wallet-amount-decreased", createWithdrawObject);
    self.on("withdraw-obj-created", insertWithdrawIntoDB);
    self.on("withdraw-inserted", withdrawOk);

    self.on("withdraw-invalid", withdrawNotOk);


    self.make = function (user, args, next) {
        continueWith = next;
        var withdrawResult = new WithdrawResult(args, user);
        self.emit("make-a-withdraw-request-received", withdrawResult);
    };

    return self;
};
util.inherits(Withdraw, Emitter);
module.exports = Withdraw;