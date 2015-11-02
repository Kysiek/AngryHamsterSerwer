/**
 * Created by KMACIAZE on 02.11.2015.
 */

var Transaction = require("../../../model/Transaction");
var Emitter = require("events").EventEmitter;
var util = require("util");
var assert = require('assert');
var config = require('../../../config/config');

var TransferResult = function(args, user) {
    return {
        args: args,
        user: user,
        success: false,
        message: null,
        walletFrom: null,
        walletTo: null,
        transfer: null
    }
};

var Transfer = function(dbConnection) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var validateArguments = function(transferResult) {
        if(!transferResult.args.fromWallet) {
            transferResult.message = "WalletFrom name parameter cannot be empty";
            self.emit("transfer-invalid", transferResult);
        } else if(!transferResult.args.toWallet) {
            transferResult.message = "WalletTo name parameter cannot be empty";
            self.emit("transfer-invalid", transferResult);
        }  else if(!transferResult.args.amount) {
            transferResult.message = "Amount field cannot be empty";
            self.emit("transfer-invalid", transferResult);
        }  else if(transferResult.args.fromWallet == transferResult.args.toWallet) {
            transferResult.message = "Cannot make a transfer to the same wallet";
            self.emit("transfer-invalid", transferResult);
        }  else {
            if(isNaN(transferResult.args.amount)) {
                transferResult.message = "Amount is not a number";
                self.emit("transfer-invalid", transferResult);
                return;
            } else {
                transferResult.args.amount = parseFloat(transferResult.args.amount);
                self.emit("arguments-ok", transferResult);
            }
        }
    };

    var walletsExist = function (transferResult) {

        dbConnection.query('SELECT * FROM wallet WHERE name = ? AND userId = ?',
            [transferResult.args.fromWallet, transferResult.user.id],
            function (err, rows) {
                assert.ok(err === null, err);
                if(rows[0]) {
                    transferResult.walletFrom = rows[0];
                    dbConnection.query('SELECT * FROM wallet WHERE name = ? AND userId = ?',
                        [transferResult.args.toWallet, transferResult.user.id],
                        function (errWalletTo, rowsWalletTo) {
                            assert.ok(errWalletTo === null, errWalletTo);
                            if(rowsWalletTo[0]) {
                                transferResult.walletTo = rowsWalletTo[0];
                                self.emit("wallets-exist", transferResult);
                            } else {
                                transferResult.message = "WalletTo does not exist";
                                self.emit("transfer-invalid", transferResult);
                            }
                        }
                    );
                } else {
                    transferResult.message = "WalletFrom does not exist";
                    self.emit("transfer-invalid", transferResult);
                }
            }
        );
    };

    var checkEnoughResources = function(transferResult) {
        if(transferResult.walletFrom.amount < transferResult.args.amount) {
            transferResult.message = "Not enough money on first wallet";
            self.emit("transfer-invalid", transferResult);
        } else {
            self.emit("available-resources-ok", transferResult);
        }
    };

    var calculateAmountInNewCurrency = function(transferResult) {

        dbConnection.query('SELECT rate FROM exchangerate WHERE fromCurrencyId = ? AND toCurrencyId = ?',
            [transferResult.walletFrom.currencyId, transferResult.walletTo.currencyId],
            function (err, rows) {
                assert.ok(err === null, err);
                if(rows[0]) {
                    transferResult.amountInNewCurrency = transferResult.args.amount * rows[0].rate;
                    self.emit("new-amount-calculated", transferResult);
                } else {
                    transferResult.message = "Currency does not exist. Server error.";
                    self.emit("transfer-invalid", transferResult);
                }
            }
        );
    };

    var decreaseAmountInWalletFrom = function(transferResult) {
        transferResult.walletFrom.amount = transferResult.walletFrom.amount - transferResult.args.amount;
        dbConnection.query('UPDATE wallet SET amount = ? WHERE id = ?', [transferResult.walletFrom.amount, transferResult.walletFrom.id], function(err, result) {
            assert.ok(err === null, err);
            self.emit("wallet-from-amount-decreased", transferResult);
        });
    };
    var increaseAmountInWalletTo = function(transferResult) {
        transferResult.walletTo.amount = transferResult.walletTo.amount + transferResult.amountInNewCurrency;
        dbConnection.query('UPDATE wallet SET amount = ? WHERE id = ?', [transferResult.walletTo.amount, transferResult.walletTo.id], function(err, result) {
            assert.ok(err === null, err);
            self.emit("wallet-to-amount-increased", transferResult);
        });
    };

    var createTransferObject = function(transferResult) {
        transferResult.transfer = new Transaction({
            walletId: transferResult.walletFrom.id,
            toWalletId: transferResult.walletTo.id,
            amountAfterTransaction: transferResult.walletFrom.amount,
            amountAfterTransactionOnSecondWallet: transferResult.walletTo.amount,
            amount: transferResult.args.amount,
            transactionType: config.TRANSACTION_TYPE[config.TRANSFER_KEY],
            transDate: new Date()
        });
        self.emit("transfer-obj-created", transferResult);
    };

    var insertTransferIntoDB = function (transferResult) {
        dbConnection.query('INSERT INTO transactions SET ?', transferResult.transfer, function(err, result) {
            assert.ok(err === null, err);
            dbConnection.query('SELECT * FROM transactions WHERE id = ?', [result.insertId], function (err, rows) {
                assert.ok(err === null, err);
                transferResult.transfer = rows[0];
                self.emit("transfer-inserted", transferResult);
            });

        });
    };

    var transferOk = function(transferResult) {
        transferResult.message = "Success!";
        transferResult.success = true;
        self.emit("transfer-made", transferResult);
        if(continueWith) {
            continueWith(null, transferResult);
        }
    };
    var transferNotOk = function(transferResult) {
        transferResult.success = false;
        self.emit("transfer-not-made", transferResult);
        if(continueWith) {
            continueWith(null, transferResult);
        }
    };

    self.on('make-a-transfer-request-received', validateArguments);
    self.on('arguments-ok', walletsExist);
    self.on('wallets-exist', checkEnoughResources);
    self.on('available-resources-ok', calculateAmountInNewCurrency);
    self.on('new-amount-calculated', decreaseAmountInWalletFrom);
    self.on('wallet-from-amount-decreased', increaseAmountInWalletTo);
    self.on('wallet-to-amount-increased', createTransferObject);
    self.on('transfer-obj-created', insertTransferIntoDB);
    self.on('transfer-inserted', transferOk);


    self.on("transfer-invalid", transferNotOk);



    self.make = function(user, args, next) {
        continueWith = next;
        var transferResult = new TransferResult(args, user);
        self.emit('make-a-transfer-request-received', transferResult);
    };

    return self;
};

util.inherits(Transfer, Emitter);
module.exports = Transfer;