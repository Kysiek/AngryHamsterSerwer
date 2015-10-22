/**
 * Created by Krzysztof on 2015-05-24.
 */
var Registration = require("../lib/registration");
var mysqlDB = require("mysql");
var assert = require("assert");
var Authentication = require("../lib/authentication");
var should = require("should");

describe("Authentication", function () {
    var reg = {},
        auth = {},
        connection;
    before(function(done){
        connection = mysqlDB.createConnection({host: "localhost", user: "root", password: "", database: "AngryHamster"});
        connection.connect(function (err) {
            if(err) {
                console.log("Error while connecting to the MySQL DB: " + err.stack);
                return;
                done();
            }
            auth = new Authentication(connection);
            done();
        });
    });
    after(function (done) {
        connection.end();
        done();
    });
    describe("a valid login", function () {
        var authResult = {};
        before(function(done) {
            auth.authenticate({username: "kysiek", password: "passsss"}, function (err, result) {
                assert.ok(err === null, err);
                authResult = result;
                console.log(authResult);
                done();
            });

        });
        it("is successful", function () {
            authResult.success.should.be.equal(true);
        });
        it("return a user", function () {
            authResult.user.should.be.defined;
        });
    }); 


    describe("empty password", function () {
        var authResult = {};
        before(function(done) {
            auth.authenticate({username: "698256044", password: ""}, function (err, result) {
                assert.ok(err === null, err);
                authResult = result;
                done();
            });

        });
        it("is not successful", function () {
            authResult.success.should.be.equal(false);
        });
        it("returns a message saying 'Password cannot be empty'", function () {
            authResult.message.should.be.equal("Password cannot be empty");
        });
    });
    describe("password does not match", function () {
        var authResult = {};
        before(function(done) {
            auth.authenticate({username: "698256044", password: "acde"}, function (err, result) {
                assert.ok(err === null, err);
                authResult = result;
                done();
            });

        });
        it("is not successful", function () {
            authResult.success.should.be.equal(false);
        });
        it("returns a message saying 'Password is incorrect'", function () {
            authResult.message.should.be.equal("Incorrect username or password");
        });
    });
});