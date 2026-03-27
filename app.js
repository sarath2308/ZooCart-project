const express=require("express")
const app=express()
require("dotenv").config()
const db=require("./config/db")
const path=require("path")
const userRouter=require("./routes/userRoutes")
const adminRouter=require("./routes/adminRoutes")
const session=require('express-session')
const passport=require('./config/passport')
const MongoStore = require("connect-mongo");
const mongoose=require("mongoose")


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

app.use((req, res, next) => {
    // Exclude API, static paths, auth routes
    if (req.method === 'GET' && !req.xhr && !req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/fetch') && !req.originalUrl.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|json)$/i) && !req.originalUrl.startsWith('/fonts')) {
        if (!['/signup', '/login', '/logout', '/auth/google', '/auth/google/callback','/verify-otp'].includes(req.originalUrl.split('?')[0])) {
            req.session.returnTo = req.originalUrl;
        }
    }
    next();
});

const User = require("./models/userSchema.js");
app.use(async(req, res, next) => {
    try {
        const userId = req.session.user || (req.user && req.user._id);
        if (userId) {
            res.locals.user = await User.findById(userId);
        } else {
            res.locals.user = null;
        }
        next();
    } catch (err) {
        next(err);
    }
});

//handling user requests
app.use("/",userRouter)
//admin requests handling
app.use('/admin',adminRouter)


app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
      console.error("Error caught by middleware:", err);
  // Check if the request expects JSON (API request)
  if (req.xhr || req.headers.accept?.includes("application/json")) {
    return res.status(statusCode).json({ 
      success: false, 
      error: err.message || "Internal Server Error" 
    });
  }

  // Determine if the error is from the admin side
  const isAdminRoute = req.originalUrl.startsWith("/admin");

  // Render different error pages based on user/admin routes
  const errorPage = isAdminRoute ? "pageerror" : "page-not-found";

  res.status(statusCode).render(errorPage, { 
    message: err.message || (isAdminRoute ? "Admin Page Not Found" : "Page Not Found") 
  });
});

const PORT=process.env.PORT || 3000;
app.listen(PORT,()=>
{
    console.log("Sever Running......");
    
})
module.exports=app;
