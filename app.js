var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var register = require('./routes/register');
var index = require('./routes/index');
var users = require('./routes/users');
const fileUpload = require('express-fileupload');

// Authentication Packages
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var MySQLStore = require('express-mysql-session')(session);
var bcrypt = require('bcrypt');
var flash = require('connect-flash');

var app = express();

if (process.env.NODE_ENV === "development"){
  //grabs .env files to allow var to connect database.
  require('dotenv').config();
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//set port
//var port = process.env.PORT || 8080;

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(flash());


var options = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database : process.env.DB_NAME
};

var sessionStore = new MySQLStore(options);


//Authentication use
app.use(session({
  secret: 'fdslfsdlkfjld',
  store: sessionStore,
  resave: false,
  saveUninitialized: false
  // cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());


app.use('/', index);
app.use('/register', register);
app.use('/users', users);



// LOCAL LOGIN =============================================================
// =========================================================================
// we are using named strategies since we have one for login and one for signup
// by default, if there was no name, it would just be called 'local'

passport.use(new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
},
function(req, email, password, done) { // callback with email and password from our form
     const db = require('./db');
     db.query("SELECT user_id, password FROM `user` WHERE `email` = '" + email + "'",function(err,rows){
        if (err){
          console.log("errror");
          done(err);
        }

        if (rows.length === 0) {
          return done(null, false, {message: `This email is not in our system.`}); // req.flash is the way to set flashdata using connect-flash
        }
        else {
          console.log(rows[0].user_id);
          const hash = rows[0].password.toString();

          bcrypt.compare(password, hash, function(err, response){
            if(response === true){
              console.log("here");
              // all is well, return successful user
              const user_id = rows[0].user_id;
              return done(null, {user_id: rows[0].user_id});
            }
            else {
              return done(null, false, {message: `Incorrect Password`});
            }
          });
        }
    });

}));



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// Handlebars default config
const hbs = require('hbs');
const fs = require('fs');

const partialsDir = __dirname + '/views/partials';

const filenames = fs.readdirSync(partialsDir);

filenames.forEach(function (filename) {
  const matches = /^([^.]+).hbs$/.exec(filename);
  if (!matches) {
    return;
  }
  const name = matches[1];
  const template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
  hbs.registerPartial(name, template);
});

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context, null, 2);
});

// app.listen(port, function() {
//   console.log();
//   console.log("go to http://localhost:" + port);
// });

module.exports = app;
