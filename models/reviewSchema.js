const mongoose=require('mongoose')
const {Schema}=mongoose;
const reviewSchema=new Schema({
    orderId:{
        type:Schema.Types.ObjectId,
        ref:"Order",
        required:true
    },
    review:{
        type:String,
        required:true,
    },
    rating:
    {
       type:Number,
       required:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true 
    },
    date:{
        type:Date,
        default:Date.now
    },
    productId:{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:true 
    }
})
const Review=mongoose.model("Reviews",reviewSchema)
module.exports=Review;