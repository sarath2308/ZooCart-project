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
    link:
    {
        type:String
    },
    startDate:{
        type:Date,
        required:true,
    },
    endDate:{
        type:Date,
        required:true
    },
})
const Banner=mongoose.model("Banner",bannerSchema)
module.exports=Banner;