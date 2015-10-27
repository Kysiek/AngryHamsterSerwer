/**
 * Created by KMACIAZE on 23.10.2015.
 */

var should = require("should");
var Wallet = require("../model/Wallet");

describe("Wallet", function () {
   describe("defaults", function () {
      var wallet = {};
       before(function () {
           wallet = new Wallet({amount: "231", currency: "USD", userId: "23"});
       });
       it("has currencyAmount", function () {
           wallet.amount.should.be.defined;
       });
       it("has currency", function () {
          wallet.currency.should.be.defined;
       });
       it("has an userId", function () {
          wallet.userId.should.be.defined;
       });
   });
});