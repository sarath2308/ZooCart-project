const mongoose=require("mongoose")
const {Schema}=mongoose;
const CategorySchema=new Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    discription:{
        type:String,
        required:true,
    },
    IsListed:{
        type:Boolean,
        default:true,
    },
    CategoryOffer:{
        type:Number,
        default:0,
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})
const Category=mongoose.model("Category",CategorySchema)
module.exports=Category;