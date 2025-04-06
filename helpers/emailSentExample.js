require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("Email length:", process.env.NODEMAILER_EMAIL.length);
console.log("Email raw:", JSON.stringify(process.env.NODEMAILER_EMAIL));
console.log("Password length:", process.env.NODEMAILER_PASSWORD.length);
console.log("Password raw:", JSON.stringify(process.env.NODEMAILER_PASSWORD));

async function sendVerificationEmail(email, otp, name) {
    // ... rest of your code
}
