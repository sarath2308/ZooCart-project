const mongoose=require('mongoose')
const {Schema}=mongoose;
const bannerSchema=new Schema({
    image:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true,
    },
    product:{
        type:Schema.Types.ObjectId,
           ref:'Product',
    },
    position:{
        type:String,
        required:true,
        unique:true,
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