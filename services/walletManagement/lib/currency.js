/**
 * Created by KMACIAZE on 27.10.2015.
 */
var Emitter = require("events").EventEmitter;
var util = require("util");
var assert = require('assert');


var CurrencyResult = function () {
    return {
        success: false,
        message: null,
        currencies: []
    }
};

var Currency = function (dbConnection) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var getAllCurrenciesFromDatabase = function (getCurrencyResult) {
        dbConnection.query('SELECT * FROM currency',
            function (err, rows) {
                assert.ok(err === null, err);
                for (var i = 0, x = rows.length; i < x; i++) {
                    getCurrencyResult.currencies.push(rows[i].currency);
                }
                self.emit("got-currencies-from-db", getCurrencyResult);
            });
    };
    var getCurrenciesOk = function(getCurrencyResult) {
        getCurrencyResult.message = "Success!";
        getCurrencyResult.success = true;
        self.emit("get-currencies-ok", getCurrencyResult);
        if(continueWith) {
            continueWith(null, getCurrencyResult);
        }
    };
    self.get = function (next) {
        continueWith = next;
        var getCurrencyResult = new CurrencyResult();
        self.emit("get-currencies-request-received", getCurrencyResult);
    };

    self.on("get-currencies-request-received", getAllCurrenciesFromDatabase);
    self.on("got-currencies-from-db", getCurrenciesOk);

    return self;
};
util.inherits(Currency, Emitter);
module.exports = Currency;