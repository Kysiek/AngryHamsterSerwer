/**
 * Created by Kysiek on 01/11/15.
 */

var Transaction = function(args) {
    var transaction = {};
    transaction.id = args.id;
    transaction.walletId = args.walletId;
    transaction.toWalletId = args.toWalletId;
    transaction.amountAfterTransaction = args.amountAfterTransaction;
    transaction.amountAfterTransactionOnSecondWallet = args.amountAfterTransactionOnSecondWallet;
    transaction.amount = args.amount;
    transaction.transactionType = args.transactionType;
    transaction.transDate = args.transDate;

    return transaction;
};

module.exports = Transaction;