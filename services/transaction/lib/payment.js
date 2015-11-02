/**
 * Created by Kysiek on 01/11/15.
 */

var Transaction = require("../../../model/Transaction");
var Emitter = require("events").EventEmitter;
var util = require("util");
var assert = require('assert');
var config = require('../../../config/config');

var PaymentResult = function (args, user) {
    return {
        args: args,
        user: user,
        success: false,
        message: null,
        payment: null
    }
};

var Payment = function (dbConnection) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var validateArguments = function(paymentResult) {
        if(!paymentResult.args.toWallet) {
            paymentResult.message = "Wallet name parameter cannot be empty";
            self.emit("payment-invalid", paymentResult);
        } else if(!paymentResult.args.amount) {
            paymentResult.message = "Amount field cannot be empty";
            self.emit("payment-invalid", paymentResult);
        }  else {
            if(isNaN(paymentResult.args.amount)) {
                paymentResult.message = "Amount is not a number";
                self.emit("payment-invalid", paymentResult);
            } else {
                paymentResult.args.amount = parseFloat(paymentResult.args.amount);
                self.emit("arguments-ok", paymentResult);
            }

        }
    };

    var checkWalletExist = function (paymentResult) {
        dbConnection.query('SELECT * FROM wallet WHERE name = ? AND userId = ?',
            [paymentResult.args.toWallet, paymentResult.user.id],
            function (err, rows) {
                assert.ok(err === null, err);
                if(rows[0]) {
                    paymentResult.wallet = rows[0];
                    self.emit("wallet-exist", paymentResult);
                } else {
                    paymentResult.message = "Wallet with given name does not exist";
                    self.emit("payment-invalid", paymentResult);
                }
            });
    };

    var increaseWalletAmount = function(paymentResult) {
        paymentResult.wallet.amount = paymentResult.wallet.amount + paymentResult.args.amount;
        dbConnection.query('UPDATE wallet SET amount = ? WHERE id = ?', [paymentResult.wallet.amount, paymentResult.wallet.id], function(err, result) {
            assert.ok(err === null, err);
            self.emit("wallet-amount-increased", paymentResult);
        });
    };

    var createPaymentObject = function(paymentResult) {
        paymentResult.payment = new Transaction({
            walletId: paymentResult.wallet.id,
            toWalletId: null,
            amountAfterTransaction: paymentResult.wallet.amount,
            amountAfterTransactionOnSecondWallet: null,
            amount: paymentResult.args.amount,
            transactionType: config.TRANSACTION_TYPE[config.PAYMENT_KEY],
            transDate: new Date()
        });
        self.emit("payment-obj-created", paymentResult);
    };


    var insertPaymentIntoDB = function (paymentResult) {
        dbConnection.query('INSERT INTO transactions SET ?', paymentResult.payment, function(err, result) {
            assert.ok(err === null, err);
            dbConnection.query('SELECT * FROM transactions WHERE id = ?', [result.insertId], function (err, rows) {
                assert.ok(err === null, err);
                paymentResult.payment = rows[0];
                self.emit("payment-inserted", paymentResult);
            });

        });
    };

    var paymentOk = function(paymentResult) {
        paymentResult.message = "Success!";
        paymentResult.success = true;
        self.emit("payment-made", paymentResult);
        if(continueWith) {
            continueWith(null, paymentResult);
        }
    };
    var paymentNotOk = function(paymentResult) {
        paymentResult.success = false;
        self.emit("payment-not-made", paymentResult);
        if(continueWith) {
            continueWith(null, paymentResult);
        }
    };

    self.on("make-a-payment-request-received", validateArguments);
    self.on("arguments-ok", checkWalletExist);
    self.on("wallet-exist", increaseWalletAmount);
    self.on("wallet-amount-increased", createPaymentObject);
    self.on("payment-obj-created", insertPaymentIntoDB);
    self.on("payment-inserted", paymentOk);

    self.on("payment-invalid", paymentNotOk);


    self.make = function (user, args, next) {
        continueWith = next;
        var paymentResult = new PaymentResult(args, user);
        self.emit("make-a-payment-request-received", paymentResult);
    };

    return self;
};
util.inherits(Payment, Emitter);
module.exports = Payment;