const express=require('express')
const router=express.Router()
const adminController=require("../controllers/admin/adminController")
const {userAuth,adminAuth}=require("../middlewares/auth")
const customerController=require("../controllers/admin/customerController")
const categoryController=require("../controllers/admin/categoryController")
const multer=require("multer");
const storage=require("../helpers/multer")
const uploads=multer({storage:storage});
const brandController=require("../controllers/admin/brandController")
const productController=require("../controllers/admin/productController")
const bannerController=require("../controllers/admin/bannerController")
const couponController=require("../controllers/admin/couponController")


router.get('/pageerror',adminController.pageerror)
router.get('/login',adminController.loginPage)
router.post('/login',adminController.login)
router.get("/",adminAuth,adminController.loadDashboard)
router.get("/logout",adminController.logout)
router.get("/demoAdmin",adminController.demoAdmin)


//User Management
router.get("/users",adminAuth,customerController.loadUsers)
router.get("/users/block/:id",adminAuth,customerController.blockUser)
router.get("/users/unblock/:id",adminAuth,customerController.unblockUser)

//category management
router.get("/category",adminAuth,categoryController.ShowCategory)
router.post("/categories/add",adminAuth,categoryController.addCategory)
router.put("/categories/update",adminAuth,categoryController.updateCategory)
router.delete("/categories/delete",adminAuth,categoryController.deleteCategory)
router.put("/categories/list",adminAuth,categoryController.listCategory)
router.put("/categories/unlist",adminAuth,categoryController.unlistCategory)
router.post("/categories/addoffer",adminAuth,categoryController.addOffer)
router.post("/categories/removeoffer",adminAuth,categoryController.removeOffer)

//brand management routers
router.get("/brands",adminAuth,brandController.loadBrand)
router.post("/brands/add",adminAuth,uploads.single("brandImage"),brandController.addBrand)
router.post("/brands/block",adminAuth,brandController.blockBrand)
router.put("/brands/unblock",adminAuth,brandController.unblockBrand)
router.put("/brands/remove",adminAuth,brandController.removeBrand)

//product Management
router.get("/products",adminAuth,productController.loadProduct)
router.get("/products/addproducts",adminAuth,productController.loadAddProducts)
router.post("/products/addproducts",adminAuth,uploads.array("images",4),productController.addProducts)
router.post("/products/addoffer",adminAuth,productController.addOffer)
router.post("/products/removeoffer",adminAuth,productController.removeOffer)
router.post("/products/blockproduct",adminAuth,productController.BlockProducts)
router.post("/products/unblockproduct",adminAuth,productController.unblockProducts)
router.post("/products/removeproduct",adminAuth,productController.removeProducts)
router.get("/products/editproduct",adminAuth,productController.loadEditProducts)
router.post("/products/deleteImage",adminAuth,productController.deleteImage)
router.post("/products/editproduct",adminAuth,uploads.array("images",4),productController.editProducts)
//coupon management
router.get("/coupons",adminAuth,couponController.loadCoupon)
router.post("/add-coupon",adminAuth,couponController.addCoupon)
router.post("/edit-coupon",adminAuth,couponController.editCoupon)
router.post("/coupon-list",adminAuth,couponController.listCoupon)
router.post("/coupon-unlist",adminAuth,couponController.unlistCoupon)



//banner management
router.get("/banners",adminAuth,bannerController.loadBannerPage)
module.exports=router;