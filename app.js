

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const middleware = require("./middleware");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");

// const bcrypt = require('bcrypt');
//
// const saltRounds = 10; I commented it this because I intent to use passport for hashing and logging


const app = express(); //anywhere after this point I can access my .env file and call it using process.env.NAME

app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);


const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  googleId:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//this always goes before the model
// userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", {scope:['profile']}));


app.get("/auth/google/secrets", passport.authenticate("google", {failureRedirect:"/login"}),function(req,res){
  res.redirect("/secrets");
})

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

app.get("/secrets", middleware.requireLogin ,function(req, res, next){
    res.status(200).render("secrets");
});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req,res){

  // bcrypt.hash(req.body.password, saltRounds, function(err, hash){
  //   var newUser = new User({
  //     email:req.body.username,
  //     // password:md5(req.body.password)
  //     password:hash
  //   });
  //
  //   newUser.save(function(err){
  //     if (err) {
  //       console.log(err);
  //     }else{
  //       res.render("secrets");
  //     }
  //   })
  // });

  //PASSPORT

  User.register({username:req.body.username}, req.body.password, function(err,user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });


    }
  });

});

app.post("/login", function(req,res){
  // const username = req.body.username;



    // User.findOne({email:username}, function(err, foundUser){
    //   if (err) {
    //     console.log(err);
    //   }else{
    //     if (foundUser) {
    //       bcrypt.compare(req.body.password, foundUser.password, function(err,result){
    //         if (result === true) {
    //           res.render("secrets");
    //         }else{
    //           console.log("Password is invalid");
    //         }
    //       });
    //       // if (foundUser.password == password) {
    //       //   res.render("secrets");
    //       // }else{
    //       //   console.log("Password is invalid");
    //       // }
    //     }
    //   }
    // })

  // const password = md5(req.body.password);

  //PASSPORT

  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);

      res.redirect("/login");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.listen("3000", function(){
  console.log("Server started on port 3000");
});
