const express=require('express')
const router=express.Router()
const userController=require("../controllers/user/userController")
const productController=require("../controllers/user/productController")
const passport=require('passport')
const {userAuth}=require("../middlewares/auth")
const profileController=require("../controllers/user/profileController")
const wishlistController=require("../controllers/user/wishlistController")
const cartController=require("../controllers/user/cartController")
const checkoutController=require("../controllers/user/checkoutController")

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
router.get("/forgotpassword",userController.loadforgot)
router.post("/forgotpassword",userController.forgotPassword)
router.post("/verify-forgot-otp",userController.verifyforgotOtp)
router.post("/forgotResend-otp",userController.forgotResendOtp)
router.get("/newpassword",userController.loadNewPassword)
router.post("/newpassword",userController.updatePassword)

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/signup?message=blocked'}),(req,res)=>
{
    res.redirect('/')
});
//products page-all products 
router.get("/shop",userAuth,userController.loadShoppingPage)

//product details
router.get("/productDetails",userAuth,productController.productDetails)


//user Profile
router.get("/userProfile",userAuth,userController.loadUserProfile)
router.post("/update-profile",userAuth,profileController.updateProfile)
router.post("/add-phone",userAuth,profileController.addPhone)
router.post("/api/users/:otpType/otp",userAuth,profileController.sendOtp)
router.get('/fetchProducts',userAuth,userController.fetchProducts)
router.post('/api/users/:otpType/otp/verify',userAuth,profileController.verifyOtp)
router.put("/api/users/password",userAuth,profileController.newPassword)
router.put("/api/users/email",userAuth,profileController.updateEmail)
router.get("/orderDetails",userAuth,profileController.orderDetails)
// router.post("/user-resend-otp",userAuth,profileController.)

// address management 

router.post("/add-address",userAuth,profileController.addAddress)
router.post('/update-default-address',userAuth,profileController.changeDefault)
router.post("/edit-address",userAuth,profileController.editAddress)
router.post("/delete-address",userAuth,profileController.deleteAddress)

//wishList management
router.get("/wishlist",userAuth,wishlistController.loadWishlist)
router.post("/addToWishlist",userAuth,wishlistController.addToWishlist)
router.post("/removeFromWishlist",userAuth,wishlistController.removeFromWishlist)

//cart management
router.get("/cart",userAuth,cartController.loadCart)
router.post("/addToCart",userAuth,cartController.addToCart)
router.put("/api/cart/item/:itemId",userAuth,cartController.updateCart)
router.post("/remove-cart-item",userAuth,cartController.removeItem)


//checkout
router.get("/checkout",userAuth,checkoutController.loadCheckOut);
router.post("/api/coupons/apply",userAuth,checkoutController.applyCoupon)
router.post("/api/addresses",userAuth,profileController.addAddress)
router.post("/api/orders/placeOrder",userAuth,checkoutController.placeOrder)
router.get("/orderInvoice",userAuth,checkoutController.orderPlaced)


router.get('/demoUser',userController.demoUser)



module.exports=router;