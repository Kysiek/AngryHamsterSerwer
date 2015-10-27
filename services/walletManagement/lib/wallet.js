/**
 * Created by KMACIAZE on 23.10.2015.
 */
var Wallet = require("../../../model/Wallet");
var Currency = require("../../../model/Currency");
var Emitter = require("events").EventEmitter;
var util = require("util");
var assert = require('assert');


var AddWalletResult = function (args, user) {
    return {
        args: args,
        user: user,
        success: false,
        message: null,
        wallet: null
    }
};

var AddWallet = function (dbConnection) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;



    var validateArguments = function (addWalletResult) {
        if(!addWalletResult.user) {
            addWalletResult.message = "user cannnot be empty";
            self.emit("invalid", addWalletResult);
        } else if(!addWalletResult.user.id) {
            addWalletResult.message = "userId field cannnot be empty";
            self.emit("invalid", addWalletResult);
        } else if(!addWalletResult.args.currency) {
            addWalletResult.message = "currency field cannnot be empty";
            self.emit("invalid", addWalletResult);
        } else if(!addWalletResult.user) {
            addWalletResult.message = "User does not exist";
            self.emit("invalid", addWalletResult);
        } else {
            if(!addWalletResult.args.amount) {
                addWalletResult.args.amount = 0;
            }
            self.emit("arguments-ok", addWalletResult);
        }
    };

    var validateCorrectnessOfArgumentsAndCreateWalletObject = function (addWalletResult) {
        var amount = addWalletResult.args.amount;
        if(isNaN(addWalletResult.args.amount)) {
            addWalletResult.message = "Amount is not a number";
            self.emit("invalid", addWalletResult);
        } else {
            addWalletResult.wallet = new Wallet({userId: addWalletResult.user.id, amount: parseFloat(amount)});
            self.emit("wallet-obj-created", addWalletResult);
        }
    };

    var validateCurrency = function (addWalletResult) {
        dbConnection.query('SELECT * FROM currency WHERE currency = ?',
            [addWalletResult.args.currency],
            function (err, rows) {
                assert.ok(err === null, err);
                if(rows != undefined && rows.length !== 0) {
                    addWalletResult.wallet.currencyId = rows[0].id;
                    self.emit("currency-correct", addWalletResult);
                }  else {
                    addWalletResult.message = "Currency does not exist";
                    self.emit("invalid", addWalletResult);
                }

        });
    };

    var insertWalletToDb = function (addWalletResult) {

        dbConnection.query('INSERT INTO wallet SET ?', addWalletResult.wallet, function(err, result) {
            assert.ok(err === null, err);
            dbConnection.query('SELECT * FROM wallet WHERE id = ?', [result.insertId], function (err, rows) {
                assert.ok(err === null, err);
                addWalletResult.wallet = rows[0];
                self.emit("wallet-inserted", addWalletResult);
            });

        });
    };

    self.addWallet = function (args, user, next) {
        continueWith = next;
        var addWalletResult = new AddWalletResult(args, user);
        self.emit("add-wallet-request-received", addWalletResult);
    };

    var addWalletOk = function(addWalletResult) {
        addWalletResult.message = "Success!";
        addWalletResult.success = true;
        self.emit("wallet-added", addWalletResult);
        if(continueWith) {
            continueWith(null, addWalletResult);
        }
    };
    var addWalletNotOk = function(addWalletResult) {
        addWalletResult.success = false;
        self.emit("wallet-not-added", addWalletResult);
        if(continueWith) {
            continueWith(null, addWalletResult);
        }
    };

    self.on("add-wallet-request-received", validateArguments);
    self.on("arguments-ok", validateCorrectnessOfArgumentsAndCreateWalletObject);
    self.on("wallet-obj-created", validateCurrency);
    self.on("currency-correct", insertWalletToDb);
    self.on("wallet-inserted", addWalletOk);

    self.on("invalid", addWalletNotOk);

    return self;
};
util.inherits(AddWallet, Emitter);
module.exports = AddWallet;