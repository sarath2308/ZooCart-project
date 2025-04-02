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
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup?message=blocked'}),(req,res)=>
{
    res.redirect('/')
});
//products page-all products 
router.get("/shop",userAuth,userController.loadShoppingPage)
router.get('/fetchProducts',userAuth,userController.fetchProducts)

//product details
router.get("/productDetails",userAuth,productController.productDetails)


//user Profile
router.get("/userProfile",userAuth,userController.loadUserProfile)
router.get("/userDetails",userAuth,profileController.userDetails)
router.get("/editUserProfile",userAuth,profileController.editUserDetails)
router.get("/change-email",userAuth,profileController.changeEmail)
router.get("/change-password",userAuth,profileController.changePassword)

router.post("/api/userProfile/update-profile",userAuth,profileController.updateProfile)

router.post("/api/userProfile/change-email/otp",userAuth,profileController.sendOtp)
router.post("/api/userProfile/change-email/verify-otp",userAuth,profileController.verifyOtp)
router.post("/api/userProfile/change-password/otp",userAuth,profileController.sendOtp)
router.put("/api/userProfile/change-password/verify-otp",userAuth,profileController.verifyOtp)
//orders
router.get("/orders",userAuth,profileController.loadOrders)

//wallet
router.get("/wallet",userAuth,profileController.loadWallet)

router.get("/orderDetails",userAuth,profileController.orderDetails)
router.patch("/api/userProfile/orders/orderDetails/cancelOrder",userAuth,profileController.cancelOrder)
router.patch("/api/userProfile/orders/orderDetails/returnOrder",userAuth,profileController.returnOrder)
router.post("/api/userProfile/orders/orderDetails/addReview",userAuth,profileController.addReview)
router.patch("/api/userProfile/orders/orderDetails/editReview",userAuth,profileController.editReview)

// address management 
router.get("/address",userAuth,profileController.loadAddress)
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
router.post("/api/coupons/remove",userAuth,checkoutController.removeCoupon)
router.post("/api/addresses",userAuth,profileController.addAddress)
router.post("/api/orders/placeOrder",userAuth,checkoutController.placeOrder)
router.get("/order-placed",userAuth,checkoutController.orderPlaced)
router.get("/orderInvoice",userAuth,checkoutController.invoiceData)
router.post("/api/orders/verifyPayment",userAuth,checkoutController.verifyPayment)


//Retry payment
router.get("/api/orders/retry-payment",userAuth,checkoutController.getRetryData)

router.get("/about",userAuth,userController.loadAbout)
router.get("/contact",userAuth,userController.loadContact)



module.exports=router;