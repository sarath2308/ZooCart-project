const express=require("express")
const app=express()
const env=require("dotenv").config()
const db=require("./config/db")
const path=require("path")
const userRouter=require("./routes/userRoutes")
const adminRouter=require("./routes/adminRoutes")
const bcrypt=require('bcrypt')
const session=require('express-session')
const passport=require('./config/passport')
//middlewars
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.set("view engine","ejs")
app.set("views",[path.join(__dirname,"views/user"),path.join(__dirname,"views/admin")])
app.use(express.static(path.join(__dirname,"public")))
db();
//session
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:73*60*60*1000
    }
}))
//cache Control
app.use((req,res,next)=>
{
    res.set('cache-control','no-store')
    next();
})
//passport middleware
app.use(passport.initialize())
app.use(passport.session());

//handling user requests
app.use("/",userRouter)
//admin requests handling
app.use('/admin',adminRouter)
const PORT=3000||process.env.PORT;
app.listen(PORT,()=>
{
    console.log("Sever Running......");
    
})
module.exports=app;