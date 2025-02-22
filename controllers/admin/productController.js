const Product=require("../../models/productSchema")
const mongoose=require("mongoose")
const Category=require("../../models/CategorySchema")
const Brand=require("../../models/BrandSchema")
const User=require("../../models/userSchema")
const fs=require("fs");
const path=require("path");
const sharp=require("sharp");

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
    const category = await Category.find({ isListed: true });
    const brands = await Brand.find({ isBlocked: false });

    try {
        if(!req.session.admin)
            {
                return res.redirect("/admin/login")
            }
        const products = req.body;
         console.log(products);
         
        // Check if product already exists by its name (case-insensitive)
        const productExists = await Product.findOne({
            productName: { $regex: new RegExp(`^${products.productName}$`, 'i') }
        });

        if (!productExists) {
            const images = [];

            // Create the directory for product images if it doesn't exist
            const targetDir = path.join('public', 'uploads', 'product-images');
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;
                    const resizedImagePath = path.join(targetDir, req.files[i].filename);

                    // Resize and save the image
                    await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
                    images.push(req.files[i].filename);
                }
            }

            // Get the category _id based on the selected category name
            const categoryId = await Category.findOne({ name: products.category });
            const brandId=await Brand.findOne({brandName:products.brand})

            if (!categoryId) {
                return res.status(400).render("products-add", { success:false,cat: category, brands: brands, message: "Invalid category name" });
            }

            // Create a new product with the category _id
            const newProduct = new Product({
                productName: products.productName,
                discription: products.description,
                brand: brandId._id,
                category: categoryId._id, // Store the category _id instead of name
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                color: products.color,
                productImage: images,
                status: 'Available',
            });

            await newProduct.save();
            res.status(201).redirect("/admin/products");
        } else {
            return res.status(400).render("products-add", { success:false,cat: category, brands: brands, message: "Product already exists, please try with another name" });
        }
    } catch (error) {
        console.error("Error occurred while adding products: ", error);
        return res.redirect("/admin/pageerror");
    }
};

const addOffer=async(req,res)=>
{
    try {
        if(!req.session.admin)
            {
                return res.redirect("/admin/login")
            }
        const{productId,percentage}=req.body;
        const findProduct=await Product.findOne({_id:productId})
        const findCategory=await Category.findOne({_id:findProduct.category})
        if(findCategory.CategoryOffer>percentage)
        {
            return res.status(401).json({success:false,message:"This product already have higher category offer"})
        }
       findProduct.salePrice=findProduct.salePrice-Math.floor(findProduct.regularPrice*(percentage/100));
        findProduct.productOffer=parseInt(percentage);
        await findProduct.save();
        findCategory.CategoryOffer=0;
        await findCategory.save();
        res.status(200).json({success:true,message:"offer successfully addedd"})
    } catch (error) {
        res.status(500).redirect("/admin/pageerror")
        console.log("error occured at adding offer to product");
        
    }
}
const removeOffer=async(req,res)=>
{
    try {
        const {productId}=req.body;
        const findProduct=await Product.findOne({_id:productId})
        if(!findProduct)
            {
                res.status(400).json({success:false,message:"Product Not found"})
            }
        const percentage=findProduct.productOffer;
        findProduct.salePrice=findProduct.salePrice+Math.floor(findProduct.regularPrice*(percentage/100));
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
      
      const images = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          images.push(req.files[i].filename);
        }
      }
  
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