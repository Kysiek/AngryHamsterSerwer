/**
 * Created by Krzysztof on 2015-05-23.
 */
var Registration = require("../lib/registration");
var mysqlDB = require('mysql');
var should = require('should');

describe("Registration", function () {
    var reg = {}, connection;
    before(function(done){
        connection = mysqlDB.createConnection({host: "localhost", user: "root", password: "", database: "AngryHamster"});
        connection.connect(function (err) {
            if(err) {
                console.log("Error while connecting to the MySQL DB: " + err.stack);
                return;
            }
            reg = new Registration(connection);
            done();
        });
    });
    after(function (done) {
        connection.end();
        done();
    });

    describe("a valid registration", function () {
        var regResult;
        before(function(done) {

            reg.applyForMembership({username: "kysiek", password: "passsss" }, function (err, result) {
                regResult = result;
                console.log(regResult);
                done();
            })

        });
        it("is successful", function () {
            regResult.success.should.equal(true);
        });
        it("creates a user", function () {
            regResult.user.should.be.defined;
        });
        it("sets the user status to the approved", function () {
            regResult.user.status.should.be.equal("approved");
        });
        it("sets the welcome message", function () {
            regResult.message.should.be.equal("Welcome!");
        });
    });

    describe("an empty or null username", function () {
        var regResult;
        before(function(done) {
            reg.applyForMembership({
                "password": "xxx"
            }, function(err, result) {
                regResult = result;
                done();
            });
        });
        it("is not successful", function () {
            regResult.success.should.equal(false);
        });
        it("tells user that username is required", function () {
            regResult.message.should.equal("Username is required");
        });
    });


    describe("an empty or null password", function () {
        var regResult;
        before(function(done) {
            reg.applyForMembership({
                "password": "",
                username: "kysiekk"
            }, function(err, result) {
                regResult = result;
                done();
            });
        });
        it("is not successful", function () {
            regResult.success.should.equal(false);
        });
        it("tells user that password is required", function () {
            regResult.message.should.equal("Password is required");
        });
    });


    describe("username already exist", function () {
        var regResult;
        before(function(done) {
            reg.applyForMembership({
                password: "asd",
                username: "kysiek"
            }, function(err, result) {
                regResult = result;
                done();
            });

        });
        it("is not successful", function () {
            regResult.success.should.equal(false);
        });
        it("tells user that username already exists", function () {
            regResult.message.should.equal("This username already exists");
        });
    });
});