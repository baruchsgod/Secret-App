

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


const app = express(); //anywhere after this point I can access my .env file and call it using process.env.NAME

app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true, useUnifiedTopology: true});


const userSchema = new mongoose.Schema({
  email:String,
  password:String
});



userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields: ["password"]}); //this always goes before the model

const User = new mongoose.model("User", userSchema);

app.get("/", function(req,res){
  res.render("home");
});

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

app.get("/secrets", function(req, res, next){

});

app.post("/register", function(req,res){
  var newUser = new User({
    email:req.body.username,
    password:req.body.password
  });

  newUser.save(function(err){
    if (err) {
      console.log(err);
    }else{
      res.render("secrets");
    }
  })
});

app.post("/login", function(req,res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email:username}, function(err, foundUser){
    if (err) {
      console.log(err);
    }else{
      if (foundUser) {
        if (foundUser.password == password) {
          res.render("secrets");
        }else{
          console.log("Password is invalid");
        }
      }
    }
  })
});

app.listen("3000", function(){
  console.log("Server started on port 3000");
});
