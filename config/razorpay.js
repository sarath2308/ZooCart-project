const Razorpay = require('razorpay');
require('dotenv').config()
console.log(process.env.RAZORPAY_KEY_ID)
console.log(process.env.RAZORPAY_KEY_SECRET)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Replace with your Razorpay key_id
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Replace with your Razorpay key_secret
});

module.exports = razorpay;




