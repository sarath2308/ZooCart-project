const mongoose=require("mongoose")
const connectdb=async()=>
{
    try{
           await mongoose.connect(process.env.MONGODB_URI)
             
    }
    catch(error)
    {
         process.exit(1) ;
    }
}
module.exports=connectdb;
