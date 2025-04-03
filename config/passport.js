const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require("../models/userSchema");
const env = require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLECLIENT_ID,
    clientSecret: process.env.GOOGLECLIENT_SECRET,
    callbackURL: "https://zoocart.shop/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {  
    try {
        console.log("inside passport auth");
        
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            if (user.isBlocked) {
                console.log("User found but blocked:", user.email);
                return done(null, false, { message: "User is blocked." });
            }
            console.log("Existing user found:", user.email);
            return done(null, user);  // Return the existing, active user
        }

        // Create a new user if not found
        console.log("Creating new user with data:", {
            name: profile.displayName,
            email: profile.emails[0]?.value, // Use optional chaining to avoid errors if emails[0] is undefined
            googleId: profile.id
        });
        user = new User({
            name: profile.displayName,
            email: profile.emails[0]?.value,
            googleId: profile.id,
        });
        await user.save();
        console.log("New user saved successfully:", user);
        return done(null, user);  // Return the newly created user

    } catch (error) {
        console.error("Error in Google Strategy:", error);
        console.error("Error details:", error.message, error.stack);
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            done(err, null);
        });
});

module.exports = passport;