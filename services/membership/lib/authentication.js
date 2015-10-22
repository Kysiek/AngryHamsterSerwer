/**
 * Created by Krzysztof on 2015-05-24.
 */
var events = require("events");
var util = require("util");
var assert = require("assert");
var bcrypt = require("bcrypt-nodejs");
var User = require("../../../model/user");

var AuthResult = function (creds) {
    return {
        creds: creds,
        success: false,
        message: null,
        user: null,
        code: null
    };
};

var Authentication = function (dbConnection) {
    var self = this;
    var continueWith = null;
    events.EventEmitter.call(self);

    //validate credentials
    var validateCredentials = function (authResult) {

        if(!authResult.creds.username) {
            authResult.message = "Username cannot be empty";
            self.emit("invalid", authResult);
        } else if(!authResult.creds.password) {
            authResult.message = "Password cannot be empty";
            self.emit("invalid", authResult);
        } else {
            self.emit("credentials-ok", authResult);
        }
    };
    //find the user
    var findUser = function (authResult) {
        dbConnection.query('SELECT * FROM users WHERE username = ?', [authResult.creds.username], function (err, rows) {
            assert.ok(err === null, err);
            if(rows != undefined && rows.length !== 0) {
                authResult.user = new User(rows[0]);
                self.emit("user-found", authResult);
            }  else {
                //authResult.message = "Invalid phone number";
                authResult.message = "Incorrect username or password";
                authResult.code = 10007;
                self.emit("invalid", authResult);
            }
        });
    };

    //compare the password
    var comparePasswords = function (authResult) {
        var matched = bcrypt.compareSync(authResult.creds.password, authResult.user.hashedPassword);
        if(matched) {
            self.emit("passwords-accepted", authResult);
        } else {
            //authResult.message = "Password is incorrect";
            authResult.message = "Incorrect username or password";
            authResult.code = 10007;
            self.emit("invalid", authResult);
        }
    };


    var authOk = function (authResult) {
        authResult.success = true;
        authResult.message = "Welcome!";
        self.emit("authenticated", authResult);
        self.emit("completed", authResult);

        if(continueWith) {
            continueWith(null, authResult);
        }
    };

    var authNotOk = function (authResult) {
        authResult.success = false;
        self.emit("not-authenticated", authResult);
        self.emit("completed", authResult);
        if(continueWith) {
            continueWith(null, authResult);
        }
    };

    self.on("login-received", validateCredentials);
    self.on("credentials-ok", findUser);
    self.on("user-found", comparePasswords);
    self.on("passwords-accepted", authOk);

    self.on("invalid", authNotOk);

    self.authenticate = function (creds, next) {

        continueWith = next;
        var authResult = new AuthResult(creds);
        self.emit("login-received", authResult);
    }
};
util.inherits(Authentication, events.EventEmitter);

module.exports = Authentication;