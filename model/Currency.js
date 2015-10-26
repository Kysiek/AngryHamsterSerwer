/**
 * Created by KMACIAZE on 23.10.2015.
 */

var Currency = function(args) {
    var currency = {};
    if(args.id) {
        currency.id = args.id;
    }
    currency.currency = args.currency;
    currency.amount = args.amount;
    currency.userId = args.userId;

    return currency;
};
module.exports = Currency;