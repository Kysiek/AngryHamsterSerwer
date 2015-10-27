/**
 * Created by KMACIAZE on 23.10.2015.
 */

var Wallet = function(args) {
    var wallet = {};
    if(args.id) {
        wallet.id = args.id;
    }
    wallet.currencyId = args.currencyId;
    wallet.amount = args.amount;
    wallet.userId = args.userId;
    wallet.name = args.name;

    return wallet;
};
module.exports = Wallet;