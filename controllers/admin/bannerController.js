const Banner=require("../../models/bannerSchema")
const Product=require("../../models/productSchema")
const path=require("path");
const fs=require('fs');
const cloudinary=require("../../config/cloudinary")
const multer=require("../../helpers/multer")


const loadBannerPage=async(req,res,next)=>
{
    try {
        const products=await Product.find({status:{$nin:["Out of Stock","Discontinued"]},isBlocked:false})
        const banners=await Banner.find()
        
        return res.render("banners",
            {
                products,
                data:banners,
                currentPath:req.path
            }
        )
    } catch (error) {
       next(error)
        
    }
}


const addBanner = async (req, res,next) => {
    try {
        const { startDate, endDate, title, productId, bannerPosition } = req.body;

        // Check if productId is provided
        const bannerData = {
            title,
            startDate,
            endDate,
            position:bannerPosition,
        };

        if (productId) {
            bannerData.productId = productId;
        }

        // Check if there’s an existing banner in the selected position
        const existingBanner = await Banner.findOne({ position:bannerPosition });
        if (existingBanner) {
            await Banner.deleteOne({ _id: existingBanner._id });
            console.log(`Old banner with ID ${existingBanner._id} removed.`);
        }

       // Image Upload for single file
if (!req.file) {
    return res.redirect("/admin/pageerror")
}

const uploadResult = await cloudinary.uploader.upload(req.file.path, { folder: "uploads" });
bannerData.image = uploadResult.secure_url;

        const newBanner = new Banner(bannerData);
        await newBanner.save();

        res.status(201).redirect("/admin/banners")

    } catch (error) {
       next(error)
    }
};

const deleteBanner=async(req,res,next)=>
{
  
    
    try {
        const id=req.query.id;
        const bannerData=await Banner.findByIdAndDelete({_id:id})
        if(bannerData)
        {
            return res.status(200).json({success:true,message:"deleted"})
        }
        else
        {
            return res.status(400).json({success:false,message:"not deleted"})
        }
    } catch (error) {
       
       next(error)
    }
}




module.exports={
    loadBannerPage,
    addBanner,
    deleteBanner
}