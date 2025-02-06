const express=require("express")
const app=express()
const User=require("../../models/userSchema")
const mongoose=require('mongoose')
const bcrypt=require("bcrypt")


const pageerror=async(req,res)=>
{
   return res.render("pageerror");
}
const loginPage=async(req,res)=>
{
    if(req.session.admin)
    {
        return res.redirect('/admin')
    }
    else
    {
    console.log("inside login");
    try {
        return res.render('adminlogin',{message:''})
    } 
    catch (error) 
    {
       console.log("error occured can't render admin login"); 
    }
}
}
const login = async (req, res) => {
    console.log("inside post login");
    
    const { email, password } = req.body;
    console.log(email, password);
   
    try {
        // Await the result of the find query
        const findAdmin = await User.findOne({ email: email, isAdmin: true });

        if (findAdmin) {
            console.log("find admin true");
            
            const passwordCheck = await bcrypt.compare(password, findAdmin.password);
            if (passwordCheck) {
                console.log("password check true");
                
                req.session.admin = true;
                return res.redirect('/admin');
            } else {
                return res.status(401).render("adminlogin", { message: "Incorrect Password" });
            }
        } else {
            return res.status(401).render("adminlogin", { message: "Incorrect Email" });
        }
    } catch (error) {
        console.log("Error occurred while validating Admin login");
        console.error(error);
        return res.status(500).render("adminlogin", { message: "An error occurred, please try again later." });
    }
};
const loadDashboard=async(req,res)=>
{
    console.log("inside dashboard");
      if(req.session.admin)
    {
        try {
            res.render("dashboard")
        } catch (error) {
            res.redirect("/pageerror");
        }

    }
    else{
        return res.redirect('/admin/login')
    }
}
const logout=async(req,res)=>
{
    req.session.destroy((err)=>
    {
        if(err)
        {
            console.log("couldn't destroy the admin session");
        }
        else{
            return res.redirect("/admin/login")
        }
    })
}
module.exports={
    loginPage,
    login,
    loadDashboard,
    pageerror,
    logout,
}