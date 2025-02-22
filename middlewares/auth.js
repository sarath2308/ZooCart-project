const User=require('../models/userSchema')
const userAuth = async (req, res, next) => {
    const id=req.session.user;
    try {
      if (!req.session.user) {
        return res.redirect('/signup');  // No session, redirect to signup
      }
  
      const user = await User.findById({_id:id});
      if (user) {
        if(user.isBlocked)
        {
            return res.redirect("/logout");
        }
        next();  // Proceed if the user exists and is not blocked
      } else {
        console.log(" does not exist");
        res.redirect('/logout');
      }
    } catch (error) {
      console.error("Error in User auth middleware:", error);
      res.status(500).send("Internal Server Error");
    }
  };
const adminAuth=(req,res,next)=>
{
    if(!req.session.admin)
    {
        return res.redirect("/admin/login")
    }
    const admin=req.session.admin;
    User.findOne({_id:admin,isAdmin:true})
    .then(data=>
    {
        if(data)
        {
        next();
        }
        else
        {
            res.redirect("/admin/login")
        }
    }
    ).catch(error=>
    {
        console.log("Error in admin auth middleware");
        res.status(500).send("Internal Server Error")
    }
    )
}
module.exports={
    userAuth,
    adminAuth,
}