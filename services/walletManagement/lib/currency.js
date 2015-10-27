/**
 * Created by KMACIAZE on 27.10.2015.
 */
var GetCurrencyResult = function () {
    return {
        success: false,
        message: null,
        currencies: []
    }
};

var GetCurrency = function (dbConnection) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var getAllCurrenciesFromDatabase = function (getCurrencyResult) {
        dbConnection.query('SELECT * FROM currency',
            function (err, rows) {
                assert.ok(err === null, err);
                for (var i = 0, x = rows.length; i < x; i++) {
                    getCurrencyResult.currencies.push(rows.currency);
                }
                self.emit("get-currency-successful", getCurrencyResult);
            });
    };
    var getCurrenciesOk = function(getCurrencyResult) {
        getCurrencyResult.message = "Success!";
        getCurrencyResult.success = true;
        self.emit("get-currencies-finished", getCurrencyResult);
        if(continueWith) {
            continueWith(null, getCurrencyResult);
        }
    };
    self.addWallet = function (args, user, next) {
        continueWith = next;
        var addWalletResult = new AddWalletResult(args, user);
        self.emit("add-wallet-request-received", addWalletResult);
    };
};