/**
 * Created by KMACIAZE on 23.10.2015.
 */
var Wallet = require("../../../model/Wallet");
var Currency = require("../../../model/Currency");
var Emitter = require("events").EventEmitter;
var util = require("util");
var assert = require('assert');


var WalletResult = function (args, user) {
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
            self.emit("add-invalid", addWalletResult);
        } else if(!addWalletResult.args.name) {
            addWalletResult.message = "name field cannnot be empty";
            self.emit("add-invalid", addWalletResult);
        } else if(!addWalletResult.user.id) {
            addWalletResult.message = "userId field cannnot be empty";
            self.emit("add-invalid", addWalletResult);
        } else if(!addWalletResult.args.currency) {
            addWalletResult.message = "currency field cannnot be empty";
            self.emit("add-invalid", addWalletResult);
        } else if(!addWalletResult.user) {
            addWalletResult.message = "User does not exist";
            self.emit("add-invalid", addWalletResult);
        } else {
            if(!addWalletResult.args.amount) {
                addWalletResult.args.amount = 0;
            }
            self.emit("arguments-ok", addWalletResult);
        }
    };
    var checkNameUniqueness = function (addWalletResult) {
        dbConnection.query('SELECT * FROM wallet WHERE userId = ?',
            [addWalletResult.user.id],
            function (err, rows) {
                assert.ok(err === null, err);
                if(rows != undefined && rows.length !== 0) {
                    for(var i = 0, x = rows.length; i < x; i++) {
                        if (addWalletResult.args.name === rows[i].name) {
                            addWalletResult.message = "Wallet with name " + rows[i].name + " already exists";
                            self.emit("add-invalid", addWalletResult);
                            return;
                        }
                    }
                    self.emit("name-unique", addWalletResult);
                }  else {
                    self.emit("name-unique", addWalletResult);
                }

            });
    };
    var validateCorrectnessOfArgumentsAndCreateWalletObject = function (addWalletResult) {
        var amount = addWalletResult.args.amount;
        if(isNaN(addWalletResult.args.amount)) {
            addWalletResult.message = "Amount is not a number";
            self.emit("add-invalid", addWalletResult);
        } else {
            addWalletResult.wallet = new Wallet({name: addWalletResult.args.name, userId: addWalletResult.user.id, amount: parseFloat(amount)});
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
                    self.emit("add-invalid", addWalletResult);
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

    var getWallet = function(getWalletResult) {
        dbConnection.query('SELECT w.id, w.name, w.amount, c.currency FROM wallet AS w INNER JOIN currency AS c ON w.currencyId = c.id WHERE w.userId = ?',
            [getWalletResult.user.id],
            function (err, rows) {
                assert.ok(err === null, err);
                getWalletResult.wallet = [];
                for (var i = 0, x = rows.length; i < x; i++) {
                    getWalletResult.wallet.push({name: rows[i].name, currency: rows[i].currency, amount: rows[i].amount, id: rows[i].id});
                }
                self.emit("got-wallet-from-db", getWalletResult);
            });
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

    var getWalletOk = function(getWalletResult) {
        getWalletResult.message = "Success!";
        getWalletResult.success = true;
        self.emit("got-wallet", getWalletResult);
        if(continueWith) {
            continueWith(null, getWalletResult);
        }
    };
    var getWalletNotOk = function(getWalletResult) {
        getWalletResult.success = false;
        self.emit("got-not-wallet", getWalletResult);
        if(continueWith) {
            continueWith(null, getWalletResult);
        }
    };

    //Add wallet path
    self.on("add-wallet-request-received", validateArguments);
    self.on("arguments-ok", checkNameUniqueness);
    self.on("name-unique", validateCorrectnessOfArgumentsAndCreateWalletObject);
    self.on("wallet-obj-created", validateCurrency);
    self.on("currency-correct", insertWalletToDb);
    self.on("wallet-inserted", addWalletOk);

    self.on("add-invalid", addWalletNotOk);

    //Get wallet path
    self.on("get-wallet-request-received", getWallet);
    self.on("got-wallet-from-db", getWalletOk);

    self.on("get-invalid", getWalletNotOk);

    self.add = function (args, user, next) {
        continueWith = next;
        var addWalletResult = new WalletResult(args, user);
        self.emit("add-wallet-request-received", addWalletResult);
    };

    self.get = function (user, next) {
        continueWith = next;
        var getWalletResult = new WalletResult(undefined, user);
        self.emit("get-wallet-request-received", getWalletResult);
    };




    return self;
};
util.inherits(AddWallet, Emitter);
module.exports = AddWallet;