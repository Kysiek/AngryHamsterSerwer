var express = require('express'),
    bodyParser = require('body-parser'),
    Membership = require('./services/membership/index'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    mysql = require('mysql'),
    assert = require('assert'),
    flash = require('connect-flash'),
    config = require('./config/config');

app = express();
var membership;

connection = mysql.createConnection({host: config.DB_HOST, user: config.DB_USER, password: config.DB_PASSWORD, database: config.DB_NAME}, function (err, result) {
    assert(err == null, "Could not connect to the Database");
    console.log("Connected successfully to the database");
});
connection.connect(function (err) {
    assert(err == null, "Could not connect to the Database");
    console.log("Connected successfully to the database");
    membership = new Membership(connection);
});


var port = process.env.PORT || 80;

passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    },
    function(username, password, done) {
        console.log("Szukanie u¿ytkownika: " + username + " " + password);
        membership.authenticate(username, password, function (err, authResult) {
            if(authResult.success) {
                done(null, authResult.user);
            } else {
                done(null, false, {message: authResult.message, code: authResult.code});
            }
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.authenticationToken);
});
passport.deserializeUser(function (token, done) {
    membership.findUserByToken(token, done);
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(session({
    secret: 'keyboard cat',
    proxy: true,
    resave: true,
    saveUninitialized: true }));
app.use(cookieParser('double secret probation'));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var userRouter = express.Router();

userRouter.route('/register')
    .post(function (req, res) {
        console.log("There was a request to register");
        var bodyArgs = req.body;
        membership.register(bodyArgs.username, bodyArgs.password, function (err, result) {
            result.code = result.code || 200;
            delete result.user;
            res.json(result);
        });
    });

userRouter.route('/login')
    .post(function (req,res,next) {

        passport.authenticate('local', function(err, user, info) {
            if (err) { return next(err); }
            if (!user) {
                var code = info.code || 200;
                return res.json({success: false, message: info.message, code: code}); }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.json({success: true, message: "Successfully logged", user: req.user, code: 200});
            });
        })(req, res, next);
    })
    .get(ensureAuthenticated, function(req, res){
        res.json({ user: req.user});
    });



userRouter.route('/logout')
    .get(ensureAuthenticated, function(req, res){
        req.logout();
        res.status(200).json({success: true, message: "Successfully logout", code: 200})
    });

app.use('/user', userRouter);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.status(401).json({message: "You are not logged", code: 10008});
}

app.listen(port, function () {
    console.log('Running on PORT: ' + port);
});