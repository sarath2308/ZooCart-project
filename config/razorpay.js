const Razorpay = require('razorpay');
require('dotenv').config()
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Replace with your Razorpay key_id
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Replace with your Razorpay key_secret
});

module.exports = razorpay;