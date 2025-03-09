const User=require('../models/userSchema')
const userAuth = async (req, res, next) => {
  const id = req.session.user || (req.user && req.user._id);
  try {
    if (!req.session.user && !req.user) {
      return res.redirect('/signup'); // No session, redirect to signup
    }
    
    const user = await User.findById(id);
    if (user) {
      if (user.isBlocked) {
        
          return res.redirect('/logout');  // Or any other route (maybe a blocked notice page)

      } else {
        next(); // Proceed if the user exists and is not blocked
      }
    } else {
      console.log("User does not exist");
      res.redirect('/logout');
    }
  } catch (error) {
    console.error("Error in user auth middleware:", error);
    res.status(500).send("Internal Server Error");
  }
};

const adminAuth= async(req,res,next)=>
{
    if(!req.session.admin)
    {
        return res.redirect("/admin/login")
    }
    const admin=req.session.admin;
    console.log("admin Auth"+admin);
    
    await User.findOne({_id:admin,isAdmin:true})
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
      console.log(error);
      
        console.log("Error in admin auth middleware");
        res.status(500).send("Internal Server Error")
    }
    )
}

module.exports={
    userAuth,
    adminAuth,
}