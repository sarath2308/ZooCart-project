const express=require("express")
const app=express()
const User=require("../../models/userSchema")
const mongoose=require('mongoose')
const bcrypt=require("bcrypt")


const pageerror=async(req,res)=>
{
   return res.render("pageerror");
}

const loginPage = async (req, res) => {
    try {
      if (req.session.admin) {
        return res.redirect('/admin');  // If session exists, redirect to admin page
      }
  
      console.log("Inside login");
      res.render('adminlogin', { message: '' });  // Render login page with an empty message
    } catch (error) {
      console.error("Error occurred: Can't render admin login", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
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
                
                req.session.admin = findAdmin.email;
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
const demoAdmin = async (req, res) => {
    try {
        const email = "zoocartofficial@gmail.com";
        const admin = await User.findOne({ email: email,isAdmin:true}); // Use findOne instead of find

        if (admin) {
            req.session.admin = admin._id; // Store user ID in session
            return res.redirect("/admin");
        } else {
            console.log("Error: addmin not found for demo login.");
            res.status(404).send("admin not found");
        }
    } catch (error) {
        console.log("Error occurred while using demo admin:", error);
        res.status(500).send("Internal Server Error");
    }
};
module.exports={
    loginPage,
    login,
    loadDashboard,
    pageerror,
    logout,
    demoAdmin
}