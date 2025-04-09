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
          "https://checkout.razorpay.com", // Razorpay
          "https://cdnjs.cloudflare.com", // ✅ Cropper.js & others
          "https://cdn.jsdelivr.net",
          "https://code.jquery.com",
          "https://cdn.datatables.net",
          "'unsafe-inline'", // ✅ only if absolutely needed
        ],
        styleSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com", // ✅ Cropper.js CSS
          "https://cdn.jsdelivr.net",
          "https://unicons.iconscout.com",
          "https://cdn.datatables.net",
          "'unsafe-inline'", // ✅ Cropper sometimes needs this for styles
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
          "https://razorpay.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.razorpay.com",
          "https://checkout.razorpay.com",
          "https://lumberjack.razorpay.com",
        ],
        frameSrc: [
          "'self'",
          "https://checkout.razorpay.com",
          "https://api.razorpay.com",
          "https://www.google.com",
        ],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrcAttr: ["'unsafe-inline'"], // optional
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: { policy: "credentialless" },
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
