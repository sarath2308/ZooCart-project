const mongoose=require("mongoose")
const {Schema}=mongoose;
const wishlistSchema=new Schema({
    userId:{
        type:Schema.Types.Objectid,
        ref:"User",
        required:true,
    },
    products:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:"product",
            required:true,
        },
        addedOn:{
            type:Date,
            default:Date.now
        }
    }]
})
const WishList=mongoose.model("Wishlist",wishlistSchema)
module.exports=WishList;