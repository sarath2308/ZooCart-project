const Brand=require("../../models/BrandSchema")
const Product=require("../../models/productSchema")
const path=require('path')


const loadBrand=async(req,res)=>
{
    try {
        const brands=await Brand.find({}).sort({createdAt:-1})
        return res.render("brands",{brands})
    } catch (error) {
        console.log("error occured while redering brands pages");
        
    }
}
const addBrand = async (req, res) => {
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
      console.error("Error occurred while adding new Brand:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  const blockBrand = async (req, res) => {
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
      console.error("Error while blocking/unblocking the brand:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
 const unblockBrand =async (req, res) => {
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
      console.error("Error while unblocking the brand:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  
  const removeBrand=async (req, res) => {
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
      console.error("Error while blocking/unblocking the brand:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
module.exports={
    loadBrand,
    addBrand,
    blockBrand,
    unblockBrand,
    removeBrand
}