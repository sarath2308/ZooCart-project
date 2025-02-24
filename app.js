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
const MongoStore = require("connect-mongo");
const mongoose=require("mongoose")
//middlewars
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.set("view engine","ejs")
app.set("views",[path.join(__dirname,"views/user"),path.join(__dirname,"views/admin")])
app.use(express.static(path.join(__dirname,"public")))
db();
//session
mongoose.connect( process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected for session storage"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use(session({
  secret: process.env.SESSION_SECRET, // Change this to a strong secret
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessions", // Collection to store sessions
    ttl: 24 * 60 * 60 // Session expiration (24 hours)
  }),
  cookie: {
    maxAge: 73*60*60*1000, // 1 day
    httpOnly: true,
    secure: false // Set to true if using HTTPS
  }
}));
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