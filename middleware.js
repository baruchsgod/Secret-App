exports.requireLogin = (req,res,next) => {
  // if(req.session && req.session.user){
  //   return next();
  // }else{
  //   return res.redirect("/login");
  // }

  if (req.isAuthenticated()) {
    return next();
  }else{
    res.redirect("/login");
  }
}
