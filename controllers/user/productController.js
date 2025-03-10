const Product=require("../../models/productSchema")
const Category=require("../../models/CategorySchema")
const Brand=require("../../models/BrandSchema")
const User=require("../../models/userSchema")

const productDetails=async(req,res)=>
{
    try {
        const userId=req.session.user || req.user._id;
        const userData=await User.findById({_id:userId})
        const productId=req.query.id;
        const productData=await Product.findById({_id:productId}).populate('category').populate('brand')
        const category=await Category.findById({_id:productData.category._id})
        const relatedProduct=await Product.find({category:category})
        const categoryOffer=category.CategoryOffer || 0;
        const productOffer=productData.productOffer ||0;
        const totalOffer=categoryOffer + productOffer;
        console.log("productOffer:"+productOffer);
        console.log("categoryOffer:"+category);
        
        
        return res.render("productDetails",{
            user:userData,
            product:productData,
            quantity:productData.quantity,
            category:category,
            status:productData.status,
            totalOffer:totalOffer,
            relatedProduct:relatedProduct,
            categoryOffer,
            productOffer
        })
    } catch (error) {
        console.log("error occured while showing product Details"+error);
        return res.redirect("/page-not-found")
    }
}







module.exports=
{
    productDetails,
}