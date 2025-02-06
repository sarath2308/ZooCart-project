const express=require('express')
const router=express.Router()
const userController=require("../controllers/user/userController")
const passport=require('passport')



router.get("/",userController.loadHomePage)
router.get("/page-not-found",userController.pageNotFound)
//before form submission
router.get("/signup",userController.signupPage)
//after form submission
router.post("/signup",userController.signup)
router.post("/login",userController.loginPage)
router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)
router.get("/logout",userController.logout)


router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/signup?message=blocked'}),(req,res)=>
{
    res.redirect('/')
});



module.exports=router;