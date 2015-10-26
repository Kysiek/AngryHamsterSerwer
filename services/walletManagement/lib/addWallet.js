/**
 * Created by KMACIAZE on 23.10.2015.
 */
var Wallet = require("../../../model/Wallet");
var Currency = require("../../../model/Currency");


var AddWalletResult = function (args) {
    return {
        args: args,
        success: false,
        message: null,
        wallet: null
    }
};

var AddWallet = function (dbConnection, user) {
    var self = this;
    var continueWith = null;
    events.EventEmitter.call(self);


    var validateArguments = function (addWalletResult) {
        if(!addWalletResult.args.userId) {
            addWalletResult.message = "userId field cannnot be empty";
            self.emit("invalid", addWalletResult);
        } else if(!addWalletResult.args.amount) {
            addWalletResult.message = "amount field cannnot be empty";
            self.emit("invalid", addWalletResult);
        } else if(!addWalletResult.args.currency) {
            addWalletResult.message = "currency field cannnot be empty";
            self.emit("invalid", addWalletResult);
        } else if(!user) {
            addWalletResult.message = "User does not exist";
            self.emit("invalid", addWalletResult);
        } else {

            self.emit("arguments-ok", addWalletResult);
        }
    };

    var validateCorrectnessOfArgumentsAndCreateWalletObject = function (addWalletResult) {
        var amount = addWalletResult.args.amount;
        if(isNaN(addWalletResult.args.amount)) {
            addWalletResult.message = "Currency is not a number";
            self.emit("invalid", addWalletResult);
        } else {
            addWalletResult.wallet = new Wallet({userId: user.id, amount: parseFloat(amount)});
            self.emit("wallet-obj-created", addWalletResult);
        }
    };

    var validateCurrency = function (addWalletResult) {
        dbConnection.query('SELECT * FROM currency WHERE currency = ?',
            [addWalletResult.args.currency],
            function (err, rows) {

                assert.ok(err === null, err);
                if(rows != undefined && rows.length !== 0) {
                    addWalletResult.wallet.currency = rows[0].id;
                    self.emit("currency-correct", addWalletResult);
                }  else {
                    addWalletResult.message = "Currency does not exist";
                    self.emit("invalid", addWalletResult);
                }

        });
    };

    var insertWalletToDb = function (addWalletResult) {

        dbConnection.query('INSERT INTO wallet SET ?', user, function(err, result) {
            assert.ok(err === null, err);
            dbConnection.query('SELECT * FROM wallet WHERE id = ?', [result.insertId], function (err, rows) {
                assert.ok(err === null, err);
                addWalletResult.wallet = rows[0];
                self.emit("wallet-inserted", app);
            });

        });
    };

    self.addWallet = function (args, next) {
        continueWith = next;
        var addWalletResult = new AddWalletResult(args);
        self.emit("add-wallet-request-received", addWalletResult);
    };

    var addWalletOk = function(addWalletResult) {
        addWalletResult.message = "Success!";
        self.emit("wallet-added", addWalletResult);
        if(continueWith) {
            continueWith(null, addWalletResult);
        }
    };
    var addWalletNotOk = function(addWalletResult) {
        addWalletResult.success = false;
        addWalletResult.message = addWalletResult.message;
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

    self.on("invalid", registrationNotOk);

    return self;
};