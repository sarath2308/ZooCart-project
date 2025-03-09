const Product=require("../../models/productSchema")
const mongoose=require("mongoose")
const Category=require("../../models/CategorySchema")
const Brand=require("../../models/BrandSchema")
const User=require("../../models/userSchema")
const fs=require("fs");
const path=require("path");
const sharp=require("sharp");
const cloudinary =require("../../config/cloudinary");  // Adjust path if needed
const multer=require("../../helpers/multer")

const loadProduct = async (req, res) => {
    try {
        if(!req.session.admin)
        {
            return res.redirect("/admin/login")
        }
      // Fetch categories and brands
      const categories = await Category.find({ isListed: true });
      const brands = await Brand.find({ isBlocked: false });
          
          const products = await Product.find()
            .populate('category')
            .populate('brand')
            .sort({ createdOn: -1 }); 
     
      return res.render("products", {
        data: products,
        category: categories,  // Pass categories for use in the view
        brand: brands          // Pass brands for use in the view
      });
  
    } catch (error) {
      console.log("Error occurred while displaying all products:", error); // Improved error logging
      return res.redirect("/admin/pageerror");  // Redirect to error page
    }
  };
  


const loadAddProducts=async(req,res)=>
{
    if(!req.session.admin)
        {
            return res.redirect("/admin/login")
        }
    try{
 const category=await Category.find({isListed:true})
 const brands=await Brand.find({isBlocked:false});
 console.log(brands);

 return res.render("products-add",{
    cat:category,
    brands:brands,
    message:'',
    success:''
 });
}
catch(error)
{
    console.log("Error occured while loading add product page");
    return res.redirect("/admin/pageerror")
    
}

};


const addProducts = async (req, res) => {
    console.log("Request arrived at adding product");
console.log("Cloudinary Instance:", cloudinary);


    try {
        // Check if admin is logged in
        if (!req.session.admin) {
            return res.redirect("/admin/login");
        }

        // Fetch categories and brands
        const category = await Category.find({ isListed: true });
        const brands = await Brand.find({ isBlocked: false });
        const { productName, category: categoryName, brand, quantity, regularPrice, description, salePrice, color } = req.body;

        // Validate input data
        if (!productName || !categoryName || !brand || !quantity || !regularPrice) {
            return res.status(400).render("products-add", {
                success: false,
                cat: category,
                brands: brands,
                message: "All fields are required",
            });
        }

        // Check if files are uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).render("products-add", {
                success: false,
                cat: category,
                brands: brands,
                message: "No files uploaded",
            });
        }

        // Check if product already exists
        const productExists = await Product.findOne({
            productName: { $regex: new RegExp(`^${productName}$`, "i") },
        });

        if (productExists) {
            return res.status(400).render("products-add", {
                success: false,
                cat: category,
                brands: brands,
                message: "Product already exists, please try with another name",
            });
        }

        // Upload images to Cloudinary
        const uploadPromises = req.files.map((file) =>
            cloudinary.uploader.upload(file.path, { folder: "uploads" })
        );

        const images = await Promise.all(uploadPromises);
        const imageUrls = images.map((img) => img.secure_url);

        console.log("Uploaded Image URLs:", imageUrls); // Debugging line

        // Validate category and brand
        const categoryData = await Category.findOne({ name: categoryName }).select("_id");
        const brandData = await Brand.findOne({ brandName: brand }).select("_id");

        if (!categoryData || !brandData) {
            return res.status(400).render("products-add", {
                success: false,
                cat: category,
                brands: brands,
                message: "Invalid category or brand name",
            });
        }

        // Create new product
        const newProduct = new Product({
            productName,
            discription:description,
            brand: brandData._id,
            category: categoryData._id,
            regularPrice,
            salePrice,
            createdOn: new Date(),
            quantity,
            color,
            productImage: imageUrls, // Store Cloudinary URLs
            status: "Available",
        });

        await newProduct.save();
        return res.status(201).redirect("/admin/products");
    } catch (error) {
        console.error("Error occurred while adding products:", error);
        return res.redirect("/admin/pageerror");
    }
};

const addOffer=async(req,res)=>
{
    try {
       
        const{productId,percentage}=req.body;
        const findProduct=await Product.findOne({_id:productId})
        const findCategory=await Category.findOne({_id:findProduct.category})
        if(findCategory.CategoryOffer>percentage)
        {
            return res.status(401).json({success:false,message:`This product already have ${findCategory.CategoryOffer}% category offer `})
        }
       findProduct.salePrice=findProduct.regularPrice-Math.floor(findProduct.regularPrice*(percentage/100));
        findProduct.productOffer=parseInt(percentage);
        await findProduct.save();
        res.status(200).json({success:true,message:"offer successfully addedd"})
    } catch (error) {
        console.log(error);
        
        res.status(500).redirect("/admin/pageerror")
        console.log("error occured at adding offer to product");
        
    }
}
const removeOffer=async(req,res)=>
{
    try {
        const {productId}=req.body;
        const findProduct=await Product.findOne({_id:productId})
        const category= await Category.findOne({_id:findProduct.category})
        if(!findProduct)
            {
                res.status(400).json({success:false,message:"Product Not found"})
            }
        const percentage=category.CategoryOffer;
        findProduct.salePrice=findProduct.regularPrice-Math.floor(findProduct.regularPrice*(percentage/100));
        findProduct.productOffer=0;
        await findProduct.save();
        res.status(200).json({success:true,message:"offer removed"})
    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}
const BlockProducts=async(req,res)=>
{
    console.log("req arrived at blocking product");
    
    try {
        const {productId}=req.body;
        const findProduct=await Product.findById({_id:productId})
        if(!findProduct)
        {
            return res.json({success:false,message:"product Not found"})
        }
        findProduct.isBlocked=true;
        await findProduct.save();
        return res.status(200).json({success:true,message:"product Blocked"})
    } catch (error) {
       console.log("Error occured while blocking product"+error);
        res.redirect("/admin/products")
    }
}

const unblockProducts=async(req,res)=>
{
    
    try {
        const {productId}=req.body;
        const findProduct=await Product.findById({_id:productId})
        if(!findProduct)
        {
            return res.json({success:false,message:"product Not found"})
        }
        findProduct.isBlocked=false;
        await findProduct.save();
        return res.status(200).json({success:true,message:"product unblocked"})
    } catch (error) {
       console.log("Error occured while unblocking product"+error);
        res.redirect("/admin/products")
    }
}
const removeProducts=async(req,res)=>
{
    try {
        const {productId}=req.body;
        const findProduct=await Product.findById({_id:productId})
        if(!findProduct)
        {
            return res.json({success:false,message:"product Not found"})
        }
       const deleteProduct= await Product.deleteOne({_id:productId})
        return res.status(200).json({success:true,message:"product unblocked"})
    } catch (error) {
       console.log("Error occured while unblocking product"+error);
        res.redirect("/admin/products")
    }
}
const loadEditProducts = async (req, res) => {
    try {
        if(!req.session.admin)
            {
                return res.redirect("/admin/login")
            }
      const productId = req.query.id;
      
      const category = await Category.find({ isListed: true });
      const brands = await Brand.find({ isBlocked: false });
      
      // Use findOne since you're looking for a specific product by its ID
      const product = await Product.findOne({ _id: productId }).populate('category');
      
      if (!product) {
        console.log("Product not found");
        return res.redirect("/admin/pageerror");
      }
  
      return res.render("products-edit", {
        data: product,  // Pass the single product
        cat: category,  // Pass categories for use in the view
        brands: brands, // Pass brands for use in the view
        message: ''     // Empty message initially
      });
  
    } catch (error) {
      console.log("Error occurred while editing product: " + error);
      res.redirect("/admin/pageerror");
    }
  };
  




  const editProducts = async (req, res) => {
    try {
      const id = req.query.id;
      const products = await Product.findOne({ _id: id });
      const data = req.body;
      console.log(data);
  
      const existingProduct = await Product.findOne({
        productName: data.productName,
        _id: { $ne: id },
      });
      
      const categoryData = await Category.findOne({ name: data.category });
      const brandData=await Brand.findOne({name:data.brand})
      
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Product with the same name already exists. Try another name or update that product",
        });
      }
        // Upload images to Cloudinary
        const uploadPromises = req.files.map((file) =>
            cloudinary.uploader.upload(file.path, { folder: "uploads" })
        );

        const images = await Promise.all(uploadPromises);
        const imageUrls = images.map((img) => img.secure_url);

        console.log("Uploaded Image URLs:", imageUrls); // Debugging line

    
  
      const updateProduct = {
        productName: data.productName,
        discription: data.description,
        brand: brandData? brandData._id:products.brand,
        category: categoryData ? categoryData._id : products.category,  // Ensure category is updated
        regularPrice: data.regularPrice,
        salePrice: data.salePrice,
        createdOn: new Date(),
        quantity: data.quantity,
        color: data.color,
        status: 'Available',
      };
  
      // If new images are uploaded, push them to the productImage array
      if (images.length > 0) {
        updateProduct.productImage = images;
      }
  
      await Product.findByIdAndUpdate(id, updateProduct, { new: true });
  
      return res.redirect("/admin/products");
    } catch (error) {
      console.log("Error occurred while updating product details: " + error);
      res.redirect("/admin/pageerror");
    }
  };
const deleteImage=async(req,res)=>
    {
        try {
            const {imageId,productId}=req.body;
            const product=await Product.findByIdAndUpdate(productId,{$pull:{productImage:imageId}});
            const imagePath=path.join("public","public-image",imageId)
            if(fs.existsSync(imagePath)){
                await fs.unlinkSync(imagePath);
                console.log(`image ${imageId} deleted successfull`);
                
            }
            else{
                console.log(`image ${imageId} not found`); 
            }
            res.json({success:true,message:"image deleted"})
        } catch (error) {
            console.log("error occured while deleting product"+error);
            
        }
    }  











module.exports={
    loadAddProducts,
    addProducts,
    loadProduct,
    addOffer,
    removeOffer,
    BlockProducts,
    unblockProducts,
    removeProducts,
    loadEditProducts,
    editProducts,
    deleteImage

}