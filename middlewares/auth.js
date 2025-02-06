const User=require('../models/userSchema')
const userAuth=(req,res,next)=>{
if(req.session.user)
{
    User.findById(req.session.user)
    .then(data=>
    {
        if(data&&!data.isBlocked)
        {
            next()
        }
        else
        {
            res.redirect('/signup')
        }
    }).catch(error=>
    {
         console.log("Error in User auth middleware");
         res.status(500).send("Internal Server Error")
    })
}
else{
    res.redirect("/signup")
}
}

const adminAuth=(req,res,next)=>
{
    User.findOne({isAdmin:true})
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