const Wishlist=require("../../models/wishlistSchema")
const Products=require("../../models/productSchema")
const mongoose=require("mongoose")
const User=require("../../models/userSchema")

const loadWishlist=async(req,res)=>
{
    try {
        const id=req.session.user ||req.user._id;
        const user=await User.findById({_id:id})
        const products=await Products.find({_id:{$in:user.wishlist}}).populate('category').populate('brand')
        return res.render("wishlist",
            {
                user,
                wishlist:products,
            }
        )
    } catch (error) {
        console.log("error occured while loading the page");
        
        console.log(error);
        return res.redirect("/page-not-found")
        
    }
}
const addToWishlist = async (req, res) => {
    try {
        console.log("req arrived at add to Wishlist");
        
      const { pid } = req.body;
      const userId = req.session.user;
  
      // Check if pid and userId are provided
      if (!pid || !userId) {
        return res.status(400).json({ success: false, message: "Product ID and User ID are required" });
      }
  
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      // Check if the product is already in the wishlist
      if (user.wishlist.includes(pid)) {
        return res.status(200).json({ success: true, message: "Already added to wishlist" });
      }
  
      // Add product to wishlist and save
      user.wishlist.push(pid);
      await user.save();
  
      return res.status(200).json({ success: true, message: "Added to wishlist" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error occurred" });
    }
  };

  const removeFromWishlist = async (req, res) => {
    try {
        console.log("Request arrived at remove from Wishlist");

        const { pid } = req.body;
        const userId = req.session.user;

        // Check if pid and userId are provided
        if (!pid || !userId) {
            return res.status(400).json({ success: false, message: "Product ID and User ID are required" });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if the product exists in the wishlist
        const index = user.wishlist.indexOf(pid);
        if (index === -1) {
            return res.status(400).json({ success: false, message: "Product not found in wishlist" });
        }

        // Remove the product from the wishlist
        user.wishlist.splice(index, 1);
        await user.save();

        return res.status(200).json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error occurred" });
    }
};

  
module.exports={
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
};