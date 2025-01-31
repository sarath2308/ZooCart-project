const mongoose=require("mongoose")
const env=require("dotenv").config()
const connectdb=async()=>
{
    try{
           await mongoose.connect(process.env.MONGODB_URI)
           console.log("DB connected");
           
    }
    catch(error)
    {
         console.log("error occured while connecting to db"+error.message);
         process.exit(1) ;
    }
}
module.exports=connectdb;