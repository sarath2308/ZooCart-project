const mongoose=required("mongoose")
const {Schema}=mongoose
const ProductSchema=new Schema({
    productName:{
        type:String,
        required:true,
    },
    discription:{
        type:String,
        required:true,
    },
    brand:
    {
        type:String,
        required:True
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    regularPrice:{
        type:Number,
        required:true,
    },
    salePrice:{
        type:Number,
        required:true,
    },
    productOffer:{
        type:Number,
        default:0,
    },
    quantity:{
        type:Number,
        default:true,
    },
    color:{
        type:String,
        required:true
    },
    productImage:{
        type:[String],
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available","Out of Stock","Discontinued"],
        required:true,
        default:"Available"
    }
    },{timestamp:true});
    const Product=mongoose.model("Product",ProductSchema)
    module.exports=Product;