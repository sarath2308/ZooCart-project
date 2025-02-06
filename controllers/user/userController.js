const express=require("express")
const app=express()
const nodemailer=require("nodemailer");
const User=require("../../models/userSchema.js")
const env=require("dotenv").config();
const bcrypt=require("bcrypt")
const loadHomePage=async(req,res)=>
{
    try{
        const user=req.session.user;
        if(user)
        {
            const userData=await User.findOne({_id:user});
            res.render("home",{user:userData})
        }  
        else
        {
            return res.render('home',{user:''});
          }
}
    catch(err)
    {
        console.log("couldn't load home page");
        res.status(500).send("Server Error")
    }
}
const pageNotFound=async(req,res)=>
{
    try{
        return res.render("page-not-found")
    }
    catch(err)
    {
       console.log("could not load page not found ");
       res.status(500).send("Server Error")
       
    }
}
const signupPage=async(req,res)=>
{
    if (req.query.message === 'blocked')
        {
            return res.render("signup",{message:"Your account has been blocked by the admin. Please contact support for further assistance"})
        }
    if(req.session.user || (req.user && req.user.id))
    {
      return res.redirect('/');
    }
    else
    {
    try{
        return res.render('signup',{message:''})
    }
    catch(err)
    {
        console.log("can't load sign up page");
        res.status(500).redirect("/page-not-found");
        
    }
}
}
//function to generate otp
function generateOtp()
{
    return Math.floor(100000+Math.random()*900000).toString();
}
//sending mail to the user
async function sendVerificationEmail(email, otp,name) {
    try {
        // Create a transporter object using Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false, // Use `true` for port 465, `false` for all other ports
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        // Send the email
        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email, // Corrected: 'to' should be lowercase
            subject: `Verify Your Account using this OTP: ${otp}`,
            text: `hello,${name}We received a request to verify your identity with a One-Time Password (OTP). Please use the following OTP to complete the verification process,`,
            html:`<p>Dear ${name},</p>
               <p>We received a request to verify your identity with a One-Time Password (OTP). Please use the following OTP to complete the verification process:</p>
               <p><strong>Your OTP is: ${otp}</strong></p>
               <p>This OTP will expire in 1 minute, so please enter it promptly. If you did not request this OTP, please ignore this email.</p>
               <p>Thank you for using ZooCart.</p>
               <p>Best regards,<br>The ZooCart Team<br>[Company Address]<br>9526847469<br>zoocart.com</p>`,
        });

        // Check if the email was accepted by the recipient's server
        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

const signup=async(req,res)=>
{
    if(req.session.user)
    {
        res.redirect("/");
    }
    else
    {
    const {name,email,phone,password}=req.body;
    try{
      const findUser=await User.findOne({email})
       if(findUser)
         {
          return res.render("signup",{message:"User With This Email Already Exists"})
         } 
          const otp=generateOtp();
           const emailSent=await sendVerificationEmail(email,otp,name)
            if(!emailSent)
              {
             res.json('email.error')
              }
            const expiry= Date.now() + 60 * 1000;
            req.session.otpExpiry=expiry;
            req.session.userOtp=otp;
            req.session.userData={name,email,phone,password};
            res.render("verify-otp");
              console.log("Otp sent",otp);
}
    catch(err)
    {
        console.error("signup error",err);
        res.redirect("/page-not-found");
    }
}
}
const loginPage = async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);

    try {
        // Find user that is not an admin (isAdmin: 0) and has the given email
        const findUser = await User.findOne({ isAdmin: 0, email: email });

        // If user not found, return incorrect credentials message
        if (!findUser) {
            return res.status(401).render("signup", { message: "Incorrect Email or Password" });
        }

        // If the user is blocked, show the blocked account message
        if (findUser.isBlocked) {
            return res.status(403).render("signup", { message: "Your account has been blocked by the admin. Please contact support for further assistance" });
        }

        // Compare the entered password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, findUser.password);

        // If passwords don't match, return incorrect password message
        if (passwordMatch) {
            req.session.user = findUser._id;
            return res.redirect("/");
        }
        else
        {
            return res.status(401).render("signup", { message: "Incorrect Password!" });
        }
    } catch (error) {
        // If any error occurs during the process, log it and return a general error message
        console.error(error);
        return res.status(500).render("signup", { message: "An error occurred. Please try again later." });
    }
}
const securePassword=async(password)=>
{
    const passwordHash=await bcrypt.hash(password,10)
    return passwordHash;
}
const verifyOtp = async (req, res) => {
    try {
        console.log("Inside verify OTP");

        // Validate input
        const { otp } = req.body;
        if (!otp || typeof otp !== 'string' || otp.length !== 6) {
            return res.status(400).json({ success: false, message: "Invalid OTP format" });
        }

        // Validate session data
        if (!req.session.otpExpiry || !req.session.userOtp || !req.session.userData) {
            return res.status(400).json({ success: false, message: "Session expired or invalid" });
        }
        if (Date.now() > req.session.otpExpiry) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }
        // Log session and received OTP for debugging
        console.log("Session OTP:", req.session.userOtp);
        console.log("Received OTP:", otp);
        console.log("Session OTP Type:", typeof req.session.userOtp);
        console.log("Received OTP Type:", typeof otp);

        // Trim and normalize OTP
        const receivedOtp = otp.trim();
        const sessionOtp = req.session.userOtp.trim();

        // Verify OTP
        if (receivedOtp === sessionOtp) {
            const user = req.session.userData;

            // Hash the password
            const passwordHash = await securePassword(user.password);

            // Save the user to the database
            const saveUser = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            });

            await saveUser.save();

            // Set user session
            req.session.user = saveUser._id;

            // Clear OTP and user data from session
            delete req.session.userOtp;

            // Respond with success
            return res.json({ success: true, redirectUrl: "/" });
        } else {
            // Invalid OTP
            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);

        // Handle specific errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: "Validation error. Please check your input." });
        }

        // Generic error response
        return res.status(500).json({ success: false, message: "An error occurred. Please try again later." });
    }
};
const resendOtp=async(req,res)=>
{
    if (!req.session.userData) {
        return res.status(400).json({
            success: false,
            message: "User data not found in session. Please log in again."
        });
    }
    const { name, email } = req.session.userData;
    console.log(email);
    if(!email)
    {
        res.json({success:false,message:"Email Not in the Session,Try again"})
    }
    try {
        const newOtp=generateOtp()
        req.session.userOtp=newOtp;
        const resendMail=await sendVerificationEmail(email,newOtp,name)
        if (resendMail)
        {
            console.log("Resend Otp:"+newOtp);
            res.status(200).json({success:true,message:"Otp resend Successfully"}) 
        }
        else{
            res.status(500).json({success:false,message:"Failed to Send OTP"}) 
        }

    } catch (error) {
        console.error("couldn't send Resend Email",error);
        res.status(500).json({success:false,message:"Internal Server Error,Please Try again"}) 
    }
}
const logout=async(req,res)=>
{
    try
    {
    req.session.destroy((err)=>
    {
        if(err)
        {
            console.log("errpr occured while distroying the session"+err); 
             return res.redirect("/page-not-found")
        }
        else
        {
           return res.redirect("/signup")
        }
    })
}
catch(error)
{
    console.log("logout error",error);
    res.redirect("/page-not-found");
    
}
}
module.exports={
    loadHomePage,
    pageNotFound,
    signupPage,
    signup,
    loginPage,
    verifyOtp,
    resendOtp,
    logout
}