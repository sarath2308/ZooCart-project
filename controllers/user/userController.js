const express=require("express")
const app=express()
const nodemailer=require("nodemailer");
const User=require("../../models/userSchema.js")
const Category=require("../../models/CategorySchema.js")
const Product=require("../../models/productSchema.js")
const Brand=require("../../models/BrandSchema.js")
const Address=require("../../models/addressSchema.js")
const Order=require("../../models/orderSchema.js")
const Cart=require("../../models/cartSchema.js")
const env=require("dotenv").config();
const bcrypt=require("bcrypt")
const Wallet=require("../../models/walletSchema.js")

const loadHomePage=async(req,res)=>
{
    try{
        console.log(req.session.user);
        
        const category=await Category.find({isListed:true})
        const products= await Product.find({
            isBlocked:false,
            category:{$in:category.map((cat)=>cat._id)},
            quantity:{$gt:0}
        }).sort({createdOn:-1}).limit(8)

        const user=req.session.user;
        if(user)
        {
            const userData=await User.findOne({_id:user});
            res.render("home",{
                user:userData,
                products:products,
                category:category,
        })
        }  
        else
        {
            return res.render('home',{user:'',products:products,category:category});
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
            return res.render("signup",{success:false,message:"Your account has been blocked by the admin. Please contact support for further assistance"})
        }
    if(req.session.user || (req.user && req.user.id))
    {
      return res.redirect('/');
    }
    else
    {
    try{
        return res.render('signup',{success:'',message:''})
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
    const userId = req.session.user || (req.user && req.user._id);
    if(userId)
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
          return res.render("signup",{success:false,message:"User With This Email Already Exists"})
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
            return res.status(401).render("signup", { success:false,message: "Incorrect Email or Password" });
        }

        // If the user is blocked, show the blocked account message
        if (findUser.isBlocked) {
            return res.status(403).render("signup", {success:false, message: "Your account has been blocked by the admin. Please contact support for further assistance" });
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
            return res.status(401).render("signup", { success:false,message: "Incorrect Password!" });
        }
    } catch (error) {
        // If any error occurs during the process, log it and return a general error message
        console.error(error);
        return res.status(500).render("signup", {success:false, message: "An error occurred. Please try again later." });
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


const loadforgot=async(req,res)=>
{
    try {
        return res.render("forgotpassword",{success:'',message:''});
    } catch (error) {
        console.log("error occured while loading the forgot password"+error);
        return res.redirect("/page-not-found")
        
    }
}

//send forgot password otp


async function forgotEmail(email, otp) {
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
            to: email,
            subject: `Reset Your Password using this OTP: ${otp}`,
            text: `Hello User,\n\nWe received a request to reset your password. Please use the following One-Time Password (OTP) to reset your password:\n\nYour OTP is: ${otp}\n\nThis OTP will expire in 1 minute. If you did not request a password reset, please ignore this email.\n\nThank you for using ZooCart.\n\nBest regards,\nThe ZooCart Team\n[Company Address]\n9526847469\nzoocart.com`,
            html: `<p>Dear User,</p>
                   <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to reset your password:</p>
                   <p><strong>Your OTP is: ${otp}</strong></p>
                   <p>This OTP will expire in 1 minute. If you did not request a password reset, please ignore this email.</p>
                   <p>Thank you for using ZooCart.</p>
                   <p>Best regards,<br>The ZooCart Team<br>[Company Address]<br>9526847469<br>zoocart.com</p>`
          });
          

        // Check if the email was accepted by the recipient's server
        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

const forgotPassword=async(req,res)=>
{
    try {

        const {email}=req.body;
        const findUser=await User.findOne({email:email})
        console.log(findUser);
        
        if(findUser)
        {
        const otp=generateOtp();
        const emailSent=await forgotEmail(email,otp)
         if(!emailSent)
           {
          res.json('email.error')
           }
         const expiry= Date.now() + 60 * 1000;
         req.session.otpExpiry=expiry;
         req.session.forgotOtp=otp;
         req.session.userData=email;
         console.log("Otp sent",otp);
         return res.render("forgotOtp",{otpSuccess:true});
        }
        else
        {
         return res.render("forgotpassword",{success:false,message:"User does not exist,please signup"})
        }
    } catch (error) {
        console.log("error occured while sending otp for forgot user");
        return res.redirect("/page-not-found")
    }
}

const verifyforgotOtp=async(req,res)=>
{
    try {
   
        // Validate input
        const { otp } = req.body;
        if (!otp || typeof otp !== 'string' || otp.length !== 6) {
            return res.status(400).json({ success: false, message: "Invalid OTP format" });
        }

        // Validate session data
        if (!req.session.otpExpiry || !req.session.forgotOtp || !req.session.userData) {
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
        const sessionOtp = req.session.forgotOtp.trim();

        // Verify OTP
        if (receivedOtp === sessionOtp) {
            const user = req.session.userData;

            delete req.session.userOtp;

            // Respond with success
            return res.json({ success: true, redirectUrl: "/newpassword" });
        } else {
            // Invalid OTP
            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.error("Error forgot verifying OTP:", error);

        // Handle specific errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: "Validation error. Please check your input." });
        }

        // Generic error response
        return res.status(500).json({ success: false, message: "An error occurred. Please try again later." });
    }
};


const forgotResendOtp = async (req, res) => {
    try {
        if (!req.session.userData) {
            return res.status(400).json({
                success: false,
                message: "User data or email not found in session. Please log in again."
            });
        }

        const  email= req.session.userData;
        console.log(`Resending OTP to email: ${email}`);

        const newOtp = generateOtp();
        req.session.userOtp = newOtp;

        const resendMail = await forgotEmail(email, newOtp);
        
        if (resendMail) {
            console.log(`Resend OTP: ${newOtp}`);
            return res.status(200).json({ success: true, message: "OTP resent successfully." });
        } else {
            return res.status(500).json({ success: false, message: "Failed to send OTP." });
        }
    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json({ success: false, message: "Internal server error. Please try again." });
    }
};

const loadNewPassword=async(req,res)=>
{
    console.log("req arrived at load new password");
    
    try {
        return res.render("newPassword",{success:'',message:''})
    } catch (error) {
        console.log("error occured while loading new Password page"+error);
        return res.redirect("/page-not-found")
        
    }
}

const updatePassword=async(req,res)=>
{
    console.log("req arrived at update password");
    
    try {
        const{password}=req.body;
        const email=req.session.userData;
        const userData=await User.find({email:email})
        console.log(password);
        console.log(email);
        console.log(userData);
        
        if(userData)
        {
            const hashPassword=await bcrypt.hash(password,10)
           const updatedData=await User.updateOne({email:email},{$set:{password:hashPassword}})
           if(updatedData.modifiedCount>0)
           {
            req.session.userData='';
            return res.render("signup",{success:true,message:"password updated succesfully"})
           }
           else
           {
            console.log("could not update password");
            return res.render("newPassword",{success:false,message:"somthing went wrong can not update password try again later!"})
            
           }
        }
        else
        {
            console.log("while updating password email not found");
            
        }
    } catch (error) {
       console.log("error occured while updating password"+error);
        
    }
}

//user progile loading
const loadUserProfile = async (req, res) => {
    try {
      const userId = req.session.user || req.user._id;
  
      // Fetch user details
      const data = await User.findOne({ _id: userId });
      
  
      const addressDoc = await Address.findOne({ userId: userId });
      const userWallet = await Wallet.findOne({ userId: userId }).lean();

if (userWallet && userWallet.paymentHistory) {
    userWallet.paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
}

console.log(userWallet);

      
      console.log("wallet data");
      console.log(userWallet);
      
      
      
      
    console.log("address Data");
    console.log(addressDoc);
    
      const orders = await Order.find({ _id: { $in: data.orderHistory } })
        .populate("address") 
        .populate({
          path: "orderedItem", 
          model: "Product",
        }).sort({createdOn:-1})
        let ordersWithReadableId =[]
      if(orders!==null)
      {
      ordersWithReadableId = orders.map((order) => {
        if (order.orderId) {
          const hexString = order.orderId.replace(/-/g, "");
      
          order.readableOrderId = BigInt("0x" + hexString).toString();
        }
        return order;
      });
    }
  
      return res.render("UserProfile", {
        data,
        addressData: addressDoc ? addressDoc.address : null,
        orders: ordersWithReadableId ?  ordersWithReadableId :null,
        wallet:userWallet,
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
      return res.redirect("/page-not-found");
    }
  };
  
  
  

  const loadShoppingPage = async (req, res) => {
    try {
      const userId = req.session.user || req.user._id;
      const userData = await User.findById(userId);
      const categories = await Category.find({ isListed: true });
      const categoryIds = categories.map(category => category._id.toString());
      const brands = await Brand.find({ isBlocked: false });
      const cartData=await Cart.findOne({userId:userId})
      let cartItems=[];
      if(cartData)
      {
       cartItems=cartData.items;
      console.log("cart itemss");
      }
      
  console.log(cartItems);
  
      // Extract and validate query parameters
      let page =  1;
      const limit = 9;
    
  
      // Build the filter object
      const filter = {
        isBlocked: false,
        category: { $in: categoryIds },
        quantity: { $gt: 0 }
      };
  
  
      // Fetch products with filters, sorting, and pagination
      const products = await Product.find(filter).limit(limit);
      const totalProducts = await Product.countDocuments(filter);
      const totalPages = Math.ceil(totalProducts / limit);
  
      // If the request is AJAX, render and return just the partial HTML for products and pagination info.
      if (req.xhr) {
        req.app.render('partials/_products', { products }, (err, productsHtml) => {
          if (err) {
            return res.status(500).json({ success: false, message: "Error rendering products" });
          }
          return res.json({
            success: true,
            productsHtml,
            currentPage: page,
            totalPages: totalPages
          });
        });
      } else {
        // For full-page render, pass all variables
        return res.render("shop", {
          user: userData,
          products: products,
          category: categories.map(category => ({ _id: category._id, name: category.name })),
          brand: brands,
          totalProducts: totalProducts,
          currentPage: page,
          totalPages: totalPages,
          cartItems
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  };
  


  const fetchProducts = async (req, res) => {
    try {
      const { query, priceRanges, sort, categories, brands, page = 1 } = req.query;
      console.log("price range:" + priceRanges);
      let parsedPriceRanges = [];
      if (priceRanges) {
        try {
          parsedPriceRanges = typeof priceRanges === 'string' ? JSON.parse(priceRanges) : priceRanges;
        } catch (e) {
          console.error("Error parsing priceRanges:", e);
          parsedPriceRanges = [];
        }
      }
  
      // Build the filter object
      const filter = {};
  
      if (query) {
        filter.productName = { $regex: query, $options: 'i' };
      }
  
      if (parsedPriceRanges.length > 0) {
        filter.$or = parsedPriceRanges.map(range => ({
          salePrice: { $gt: range.gt, $lt: range.lt }
        }));
      }
  
      if (categories) {
        filter.category = { $in: categories.split(',') };
      }
  
      if (brands) {
        filter.brand = { $in: brands.split(',') };
      }
  
      // Pagination
      const itemsPerPage = 9;
      const skip = (page - 1) * itemsPerPage;
  
      // Build the sort object. If sort is provided, sort by salePrice.
      let sortOptions = {};
      if (sort) {
        // Assuming sort is a string "1" or "-1", we convert it to a number.
        sortOptions = { salePrice: Number(sort) };
      }
  
      const products = await Product.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(itemsPerPage);
  
      const totalProducts = await Product.countDocuments(filter);
      const totalPages = Math.ceil(totalProducts / itemsPerPage);
  
      res.json({
        products,
        currentPage: parseInt(page),
        totalPages,
      });
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).send('Server error');
    }
  };
  


const productDetails=async(req,res)=>
    {
      try {
          return res.render("productDetails")
      } catch (error) {
          console.log("error occured");
          console.log(error);
          
          
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
    logout,
    loadforgot,
    forgotPassword,
    verifyforgotOtp,
    loadNewPassword,
    updatePassword,
    loadUserProfile,
    loadShoppingPage,
    productDetails,
    fetchProducts,
    forgotResendOtp,
}