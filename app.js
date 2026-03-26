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
const helmet = require("helmet");


app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "https://checkout.razorpay.com",
          "https://cdn.razorpay.com",
          "https://*.razorpay.com", // ✅ covers all Razorpay scripts
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
          "https://code.jquery.com",
          "https://cdn.datatables.net",
          "'unsafe-inline'",
        ],

        styleSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
          "https://unicons.iconscout.com",
          "https://cdn.datatables.net",
          "'unsafe-inline'",
        ],

        fontSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
          "https://unicons.iconscout.com",
        ],

        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://*.razorpay.com", // ✅ safer than just razorpay.com
        ],

        connectSrc: [
          "'self'",
          "https://*.razorpay.com", // ✅ THIS is what you were missing
        ],

        frameSrc: [
          "'self'",
          "https://*.razorpay.com", // ✅ required for checkout iframe
          "https://www.google.com",
        ],

        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    },

    // ⚠️ This can break third-party integrations
    crossOriginEmbedderPolicy: false, // ✅ safer for Razorpay
  })
);

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
    if (req.method === 'GET' && !req.xhr && !req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/fetch') && !req.originalUrl.match(/\.(css|js|png|jpg|jpeg|gif|ico)$/i)) {
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



app.use((err,req,res,next)=>
{
  if(err)
  {
    if(err instanceof AggregateError)
    {
      
    }
  }
})
const PORT=process.env.PORT || 3000;
app.listen(PORT,()=>
{
    console.log("Sever Running......");
    
})
module.exports=app;
