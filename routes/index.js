var express = require('express');
var router = express.Router();
var expressValidator = require('express-validator');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
// Latex to pdf requirements
const latex = require('node-latex');
const fs = require('fs');
const { createReadStream, createWriteStream } = require('fs');
// Hashing password requirements
var bcrypt = require('bcrypt');
const saltRounds = 10;
const fileUpload = require('express-fileupload');
const nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var PDFLatex = require('pdflatex');

//*******************************************************//
//                  HOME (GET)                     //
//*******************************************************//
/* GET */
router.get('/', function(req, res, next) {
  let error_message = req.flash('error')[0];
  res.locals.error_message = error_message;
  res.render('homeMain', { title: 'Welcome to' });
});

//*******************************************************//
//                  LOGIN (POST/GET)                     //
//*******************************************************//

/* POST */
router.post('/login', passport.authenticate(
    'local', {
    successRedirect: '/userhomepage',
    failureRedirect: '/',
    failureFlash : true,
}));

//*******************************************************//
//                  REGISTER (POST/GET)                  //
//*******************************************************//
/* GET */
router.get('/register', function(req, res, next) {
   res.render('homeMain', { title: 'Welcome to' });
});

/* POST */
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
  const errors = req.validationErrors();
  // Check for Errors
  if(errors){
    console.log(`errors: ${JSON.stringify(errors)}`);
    res.render('homeMain', { title: 'Registration Error', errors: errors});
  }
  // If no Errors store uploaded Image and add user info to Mysql
  else {
    //Variables from Registration Form
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const Region = req.body.Region;
    // const img = req.files.signature;
    const db = require('../db.js');

    // Hash password entry before inserting into database
    bcrypt.hash(password, saltRounds, function(err, hash){
          //Insert Into User Table (Registration Form).
          db.pool.query('INSERT INTO user (name, Region, email, password) VALUES (?,?,?,?)', [name, Region, email, hash], function(error, results, fields){
              //if error throw alert us
              if(error){
                console.log(`errors: ${JSON.stringify(errors)}`);
                res.render('homeMain', {errors: errors});
              }
              //Insert Into User Table (Registration Form).
              db.pool.query("SELECT user_id from user WHERE email = ?", [email] , function(error, results, fields){
                  //if error throw alert us
                  if(error) {
                    console.log(`errors: ${JSON.stringify(error)}`);
                  }
                  else {
                    const user_id = results[0];
                    req.login(user_id, function(error){
                      console.log(error)
                    });
                    //if data inserted succesfuly return us to Registrationpage.
                    res.render('signature', { title: 'Success: Signature', userId: user_id });
                  }
              });
          });
    });
  }
});


//*******************************************************//
//                  Signature (POST/GET)                  //
//*******************************************************//
/* GET */
router.get('/signature', function(req, res, next) {

  res.render('signature', { title: 'Success: Signature' });
});
//*******************************************************//
//                  Homepage (POST/GET)                  //
//*******************************************************//
/* GET */
router.get('/userhomepage', function(req, res, next) {
  res.render('userhomepage', { title: 'Homepage' });
});

/* POST */
router.post('/userhomepage', function(req, res){
  // Declare variables
  var userId = req.user.user_id;
  var img = req.body.url;
  const db = require('../db.js');

  //Insert Img data to db with current registered user.
  db.pool.query('UPDATE user SET img = ? WHERE user_id = ?', [img, userId], function(error, results, fields){
      //if error throw alert us
      if(error){
        console.log(console.error);
        res.render('homeMain', error);
      }
      else {
        console.log("Added Signature");
        res.render('userhomepage', { title: 'Added signature'});
      }
   });
});

//*******************************************************//
//                  CreateAward (POST/GET)               //
//*******************************************************//
/* GET */
router.get('/createAward', function(req, res, next) {
  res.render('createAward');
});

/* POST */
router.post('/createAward', function(req, res, next) {

  req.checkBody('name', 'The email or name is invalid, please try again.').notEmpty();
  req.checkBody('email', 'The email or name is invalid, please try again.').isEmail();
  const errors = req.validationErrors();

  // Check for Errors
  if(errors){
    console.log(`errors: ${JSON.stringify(errors)}`);
    res.render('createAward', {
      title: 'Create Award ',
      errors: errors
    });
  }
  // If no Errors store uploaded Image and add user info to Mysql
  else {
    const employee_name = req.body.name;
    const employee_email = req.body.email;
    const creator_id = req.user.user_id;

    const award_type = 'Employee of the month';
    const db = require('../db.js');

    //Insert Into User Table (Registration Form).
    //Insert Into User Table (Registration Form).
    db.pool.query("SELECT Region, img FROM user where user_id = ?", [creator_id], function(error, results, fields){
        //if error throw alert us
        if(error) {throw error;}
        else {
          const Region = JSON.stringify(results[0].Region).replace(/['"]+/g, '');
          // Grabs Image BLOB return from mysql & saves it to upload_images directory as png.
          var image = JSON.stringify(results[0].img);
          image = image.replace(/['"]+/g, '')
          image = image.split(",").pop();
          // write image to upload_images path.
          require("fs").writeFile('public/images/upload_images/signature.png', image, 'base64', function(err) {
            console.log(err);
          });
          // Once user inputs username & email create award in database.
          db.pool.query('INSERT INTO `awards`(`award_type`, `employee_name`, `employee_email`, `creator_id`) VALUES (?,?,?,?)',
          [award_type, employee_name, employee_email, creator_id], function(error, results, fields){
              //if error throw alert us
              if(error) {throw error;}
              else {
                  var award_path = results.insertId+ '.pdf'
                  //variables for award
                  //var award = "\\documentclass{letter}\n\\usepackage{graphicx}\n\\graphicspath{{/app/public/images/upload_images/}}\n\\signature{"+employee_name+"}\n\\begin{document}\n\\begin{letter}{Eridanus:Web3 \\ Portland\\ Oregon\\ United States}\n\\opening{Dear Sir or Madam:}\n\nCongratulations! You have been selected as the ‘Month of the Employee.\n\n% Main text\n\\closing{.}\n\\encl{Region "+Region+"}\n\\fromsig{\\includegraphics[scale=0.4]{signature}}\n\n\\end{letter}\n\\end{document}\n";
                  var award = "\\documentclass{letter}\n\\usepackage{graphicx}\n\\graphicspath{{/Users/juandaccarett/Desktop/Last_Semester/Capstone_Project/emp/public/images/upload_images/}}\n\\signature{"+employee_name+"}\n\\begin{document}\n\\begin{letter}{Eridanus:Web3 \\ Portland\\ Oregon\\ United States}\n\\opening{Dear Sir or Madam:}\n\nCongratulations! You have been selected as the ‘Month of the Employee.\n\n% Main text\n\\closing{.}\n\\encl{Region "+Region+"}\n\\fromsig{\\includegraphics[scale=0.4]{signature}}\n\n\\end{letter}\n\\end{document}\n";
                  // Creates award and saves them to awardsCreated folder with the name of the award_id
                  latexToPdf('latex.tex', award, award_path);
                  res.render('sendAward', { title: "Review Award" ,awardPath: 'awardsCreated/'+award_path, email: employee_email});
              }
          });

       }
    });
   }
 });

 //*******************************************************//
 //                  sendAward(POST/GET)               //
 //*******************************************************//
 /* GET */
 router.get('/sendAward', function(req, res, next) {
  console.log("GET CALL");
  res.render('sendAward');
 });
 /* POST */
 router.post('/sendAward', function(req, res, next) {
   console.log("POST CALL");
   nodemailer.createTestAccount((err, account) => {
         // create reusable transporter object using the default SMTP transport
         var transporter = nodemailer.createTransport(smtpTransport({
             service: 'gmail',
             auth: {
               user: 'employeerecogproject@gmail.com',
               pass: 'Testing91!'
             }
         }));
         // setup email data with unicode symbols
         let mailOptions = {
         from: '"Employee Recognition 👻" <employeerecogproject@gmail.com>', // sender address
         to: req.body.email, // list of receivers
         subject: 'Hello ✔', // Subject line
         text: 'Thank you', // plain text body
         html: '<b>Recognizing Exellence</b>', // html body
           attachments: [{
               filename: 'Employee Award',
               path: 'public/'+req.body.path,
               contentType: 'application/pdf'
           }]
         };
         // send mail with defined transport object
         transporter.sendMail(mailOptions, (error, info) => {
             if (error) {
                res.render('sendAward',{title: 'Error Sending Email'})
                return console.log(error);
             }
             else {
               console.log('Message sent: %s', info.messageId);
               // Preview only available when sending through an Ethereal account
               console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
               res.render('userhomepage',{title: 'Email Sent succesfuly'})
             }
         });
   });
});

 //*******************************************************//
 //                  View Awards(POST/GET)               //
 //*******************************************************//
 /* GET */
 router.get('/viewAwards', function(req, res, next) {

  console.log("GET CALL");
  const user_id = req.user.user_id;
  const db = require('../db.js');

  db.pool.query("SELECT award_id, employee_name, award_type FROM awards WHERE creator_id = ?", [user_id], function(errors, results, fields){
      //if error throw alert us
      if (errors) {
        res.render('viewAwards', {title: "ERROR | Delete Awards"});
         return console.log(errors);
      }
      else {
        console.log(results);
        res.render('viewAwards', {title: "Edit | Delete Awards", packet: results});
      }
  });

});
 /* GET */
 router.post('/viewAwards', function(req, res, next) {

    console.log("POST CALL");
    const db = require('../db.js');

    db.pool.query("DELETE FROM awards WHERE award_id = ?", [req.body.award_id], function(errors, results, fields){
        //if error throw alert us
        if (errors) {
           return console.log("COULD NOT DELETE");
        }
        else {
          console.log("SUCCESS DELETING");
        }
    });
 });

//to store user id in session
passport.serializeUser(function(user_id, done) {
    done(null, user_id);
});
//to read from session by user id
passport.deserializeUser(function(user_id, done) {
      done(null, user_id);
});

//*******************************************************//
//                  Functions                            //
//*******************************************************//
//(Latex to Pdf document.)
function latexToPdf(inputFilename, latexstring, outputFilename){
    fs.writeFile(inputFilename, latexstring, function(err) {
        if(err) {
          return console.log(err);
        }
        console.log("The file was saved!");
    });
    const input = createReadStream(inputFilename);
    const output = createWriteStream("public/awardsCreated/"+outputFilename);
    latex(input).pipe(output)
    console.log("PDF created!");
}

module.exports = router;
