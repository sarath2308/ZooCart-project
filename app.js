const express=require("express")
const app=express()
const env=require("dotenv").config()
const db=require("./config/db")
const path=require("path")
const userRouter=require("./routes/userRoutes")
//middlewars
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.set("view engine","ejs")
app.set("views",[path.join(__dirname,"views/user"),path.join(__dirname,"views/admin")])
app.use(express.static(path.join(__dirname,"public")))
db();
//handling user requests
app.use("/",userRouter)
app.use("/page-not-found",userRouter)


const PORT=3000||process.env.PoRT;
app.listen(PORT,()=>
{
    console.log("Sever Running......");
    
})
module.exports=app;