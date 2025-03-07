const mongoose = require("mongoose");
const { Schema } = mongoose;

const walletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,  // Fixed "Objectid" to "ObjectId"
        ref: "User",
        required: true,
    },
    balance:{
        type:Number,
        default:0,
    },
    paymentHistory: [{
      amount:{
        type:Number,
        default:0,
        },
        date:{
            type:Date,
            default:Date.now
        },
        paymentFlow:{
            type:Boolean,
            
        },
        description:{
            type:String,
            required:true,
        },
        status:{
            type:String,
            required:true,
            enum:['credited','debited','pending']
        },
        orderId:{
            type: Schema.Types.ObjectId,  // Fixed "Objectid" to "ObjectId"
            ref: "Order",
            required: true,
        },
    }]
});

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
