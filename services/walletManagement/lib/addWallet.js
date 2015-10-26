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

    var validateCorrectnessOfArgumentsAndCreateWallet = function (addWalletResult) {
        var amount = isNan(addWalletResult.args.amount) ? amount : Number(addWalletResult.args.amount);
        addWalletResult.wallet = new Wallet({userId: user.id, amount: amount});
        self.emit("wallet-created", addWalletResult);
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
                //authResult.message = "Invalid phone number";
                addWalletResult.message = "Currect does not exist";
                self.emit("invalid", addWalletResult);
            }

        });
    };

    var insertWalletToDb = function (addWalletResult) {

        dbConnection.query('INSERT INTO users SET ?', user, function(err, result) {
            assert.ok(err === null, err);
            dbConnection.query('SELECT * FROM users WHERE id = ?', [result.insertId], function (err, rows) {
                assert.ok(err === null, err);
                app.user = rows[0];
                self.emit("user-created", app);
            });

        });
    }
};