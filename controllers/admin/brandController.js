const Brand=require("../../models/BrandSchema")
const Product=require("../../models/productSchema")
const path=require('path')


const loadBrand=async(req,res,next)=>
{
    try {
        const brands=await Brand.find({}).sort({createdAt:-1})
        return res.render("brands",{brands,currentPath:req.path})
    } catch (error) {
     next(error)
        
    }
}
const addBrand = async (req, res,next) => {
    try {
      const { brandName } = req.body;
      const image = path.basename(req.file.path);
  
      if (!image) {
        return res.status(400).json({ success: false, message: "Image is required" });
      }
  
      const checkDuplicate = await Brand.findOne({
        brandName: { $regex: new RegExp(`^${brandName}$`, 'i') }
      });
  
      if (checkDuplicate) {
        return res.status(409).json({ success: false, message: "Brand already exists" });
      }
  
      const newBrand = new Brand({
        brandName,
        brandImage: image,
      });
  
      await newBrand.save();
      res.status(200).json({ success: true, message: "Brand added successfully" });
  
    } catch (error) {
  
      next(error)
    }
  };
  const blockBrand = async (req, res,next) => {
    try {
      const { brandId } = req.body;  // Get brand ID from URL
      const brand = await Brand.findById(brandId);
  
      if (!brand) {
        return res.status(404).json({ success: false, message: "Brand not found" });
      }
      brand.isBlocked=true;
      await brand.save();
      res.status(200).json({
        success: true,
        message: `Brand has been ${brand.isBlocked ? "blocked" : "unblocked"} successfully`,
      });
    } catch (error) {
      next(error)
    }
  };

 const unblockBrand =async (req, res,next) => {
    try {
      const { brandId } = req.body;  // Get brand ID from URL
      const brand = await Brand.findById(brandId);
  
      if (!brand) {
        return res.status(404).json({ success: false, message: "Brand not found" });
      }
      brand.isBlocked=false;
      await brand.save();
      res.status(200).json({
        success: true,
        message: `Brand has been ${brand.isBlocked ? "blocked" : "unblocked"} successfully`,
      });
    } catch (error) {
      
     next(error)
    }
  };
  
  const removeBrand=async (req, res,next) => {
    try {
      const { brandId } = req.body;  // Get brand ID from URL
      const brand = await Brand.findById(brandId);
  
      if (!brand) {
        return res.status(404).json({ success: false, message: "Brand not found" });
      }
      const remove=await Brand.deleteOne({_id:brandId})
      res.status(200).json({
        success: true,
        message: `Brand has been removed successfully`,
      });
    } catch (error) {
      
     next(error)
    }
  };
  
module.exports={
    loadBrand,
    addBrand,
    blockBrand,
    unblockBrand,
    removeBrand
}