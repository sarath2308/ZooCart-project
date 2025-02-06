const express=require('express')
const router=express.Router()
const adminController=require("../controllers/admin/adminController")
const {userAuth,adminAuth}=require("../middlewares/auth")
const customerController=require("../controllers/admin/customerController")
const categoryController=require("../controllers/admin/categoryController")

router.get('/pageerror',adminController.pageerror)
router.get('/login',adminController.loginPage)
router.post('/login',adminController.login)
router.get("/",adminAuth,adminController.loadDashboard)
router.get("/logout",adminController.logout)


//User Management
router.get("/users",adminAuth,customerController.loadUsers)
router.get("/users/block/:id",adminAuth,customerController.blockUser)
router.get("/users/unblock/:id",adminAuth,customerController.unblockUser)

//category management
router.get("/category",adminAuth,categoryController.ShowCategory)
router.post("/categories/add",adminAuth,categoryController.addCategory)
router.put("/categories/update",adminAuth,categoryController.updateCategory)
router.delete("/categories/delete",adminAuth,categoryController.deleteCategory)



module.exports=router;