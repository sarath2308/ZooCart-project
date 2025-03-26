const mongoose = require("mongoose");
const { Schema } = mongoose;

const PaymentSchema = new Schema({
    orderId: { 
        type:Schema.Types.ObjectId,
         ref: "Order",
          required: true 
        }, 
    razorpay_order_id: {
         type: String,
          required: true
         },
    status: {
         type: String,
          default: "PENDING" 
        }, 
});

const Payment = mongoose.model("Payments",PaymentSchema);
module.exports = Payment;
