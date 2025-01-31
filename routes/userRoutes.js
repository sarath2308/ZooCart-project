const express=require('express')
const router=express.Router()
const userController=require("../controllers/user/userController")
router.get("/",userController.loadHomePage)
router.get("/page-not-found",userController.pageNotFound)







module.exports=router;