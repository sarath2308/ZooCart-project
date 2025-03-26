const Product=require("../../models/productSchema")
const Category=require("../../models/CategorySchema")
const Brand=require("../../models/BrandSchema")
const User=require("../../models/userSchema")
const Review=require("../../models/reviewSchema")
const mongoose = require("mongoose");



const productDetails=async(req,res)=>
{
    try {
        const userId=req.session.user || req.user._id;
        const userData=await User.findById({_id:userId})
        const productId=req.query.id;
        const productData=await Product.findOne({_id:productId,isBlocked:false}).populate('category').populate('brand')
        if(productData.quantity>0)
        {
            productData.status='Available';
            await productData.save()
        }
        if(!productData)
            {
                return res.status(404).redirect("/shop")
            }
            
            const reviewData=await Review.find({productId}).populate("userId")
            async function getAverageRating(productId) {
                try {
                    const result = await Review.aggregate([
                        {
                            $match: { productId: new mongoose.Types.ObjectId(productId) } // Match the provided productId
                        },
                        {
                            $group: {
                                _id: "$productId",
                                averageRating: { $avg: "$rating" }, // Calculate the average rating
                                totalReviews: { $sum: 1 } // Count the total number of reviews
                            }
                        }
                    ]);
            
                    if (result.length > 0) {
                        return {
                            averageRating: result[0].averageRating.toFixed(1), // Rounded to 1 decimal place
                            totalReviews: result[0].totalReviews
                        };
                    } else {
                        return { averageRating: "0.0", totalReviews: 0 }; // No reviews found
                    }
                } catch (error) {
                    console.error("Error fetching average rating:", error);
                    return { averageRating: "0.0", totalReviews: 0 };
                }
            }

            let averageReview=await getAverageRating(productId)
            console.log(averageReview);
            
            
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
                productOffer,
                averageReview,
                reviewData
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