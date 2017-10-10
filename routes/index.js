var express = require('express');
var router = express.Router();
var expressValidator = require('express-validator');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var bcrypt = require('bcrypt');

const saltRounds = 10;
const fileUpload = require('express-fileupload');

/* GET Register page. */
router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Registration' });
});

/* GET Login page. */
router.get('/login', function(req, res, next) {
  // Set a flash message by passing the key, followed by the value, to req.flash().
  let error_message = req.flash('error')[0];

  res.locals.error_message = error_message;

  res.render('login', {title: 'Login'});
});

/* GET Homepage page. */
router.get('/userhomepage', function(req, res, next) {
  console.log(req.user);
  console.log(req.isAuthenticated());
  res.render('userhomepage', { title: 'Homepage' });
});

/* POST request to register */
router.post('/register', function(req, res, next) { // Here we add our user to our database.

  // Using express-validator to validate our user input from our Registration form input
  req.checkBody('name', 'Username field cannot be empty.').notEmpty();
  req.checkBody('name', 'Username must be between 4-15 characters long.').len(3, 25);
  req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
  req.checkBody('email', 'Email address must be between 4-100 characters long, please try again.').len(4, 100);
  req.checkBody('password', 'Password must be between 8-100 characters long.').len(8, 100);
  req.checkBody("password", "Password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");
  req.checkBody('passwordMatch', 'Password must be between 8-100 characters long.').len(8, 100);
  req.checkBody('passwordMatch', 'Passwords do not match, please try again.').equals(req.body.password);
  // req.checkBody('signature', 'image must be uploaded').notEmpty();

  const errors = req.validationErrors();


  // Check for Errors
  if(errors){
    console.log(`errors: ${JSON.stringify(errors)}`);
    res.render('register', {
      title: 'Registration Error',
      errors: errors
    });
  }
  // If no Errors store uploaded Image and add user info to Mysql
  else {
    //Variables from Registration Form
    //Check image upload if fails
    if (!req.files)
    return res.status(400).send('No files were uploaded.');
    var file = req.files.signature;
    var img_name=file.name;
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const Region = req.body.Region;
    const img = req.files.signature;
    const db = require('../db.js');

    // Hash password entry before inserting into database
    bcrypt.hash(password, saltRounds, function(err, hash){
          //check the uploaded image is the right format.
          if(file.mimetype == "image/jpeg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" ){

            //move the upload image to upload_images folder and save the directory which will be saved by storing in the users DB.
             file.mv('public/images/upload_images/'+file.name, function(err) {
                  if (err) return res.status(500).send(err);
                  //Insert Into User Table (Registration Form).
                  db.query('INSERT INTO user (name, Region, email, password, img) VALUES (?,?,?,?,?)', [name, Region, email, hash, img_name], function(error, results, fields){
                      //if error throw alert us
                      if(error){
                        console.log(`errors: ${JSON.stringify(errors)}`);
                        res.render('register', {
                          title: 'Registration Error',
                          errors: errors
                        });
                      }

                      //Insert Into User Table (Registration Form).
                      db.query("SELECT LAST_INSERT_ID() as user_id", function(error, results, fields){
                          //if error throw alert us
                          if(error){
                            throw error;
                          }
                          else {

                            const user_id = results[0];

                            console.log(results[0]);
                            req.login(user_id, function(err){
                              res.redirect('/userhomepage');
                            });
                            //if data inserted succesfuly return us to Registrationpage.
                            res.render('register', { title: 'Registration Complete' });

                          }
                      });

                 })

             });

          }

      });

    }
});

/* GET Login page. */
router.post('/login', passport.authenticate(
    'local', {
    successRedirect: '/userhomepage',
    failureRedirect: '/login',
    failureFlash : true,
}));

//to store user id in session
passport.serializeUser(function(user_id, done) {
    done(null, user_id);
});
//to read from session by user id
passport.deserializeUser(function(user_id, done) {
      done(null, user_id);
});



module.exports = router;
