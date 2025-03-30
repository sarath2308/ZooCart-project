const Wishlist=require("../../models/wishlistSchema")
const Products=require("../../models/productSchema")
const mongoose=require("mongoose")
const User=require("../../models/userSchema")

const loadWishlist = async (req, res,next) => {
    try {
        const id = req.session.user || req.user._id;
        const user = await User.findById({ _id: id });

        // Get current page from query params (default: 1)
        let page = parseInt(req.query.page) || 1;
        let limit = 5; // Number of products per page
        let skip = (page - 1) * limit;

        // Get total count of wishlist items
        const totalWishlistItems = await Products.countDocuments({ _id: { $in: user.wishlist } });

        // Fetch paginated wishlist products
        const products = await Products.find({ _id: { $in: user.wishlist } })
            .populate('category')
            .populate('brand')
            .skip(skip)
            .limit(limit);

        // Calculate total pages
        let totalPages = Math.ceil(totalWishlistItems / limit);

        return res.render("wishlist", {
            user,
            wishlist: products,
            currentPage: page,
            totalPages,
            total:totalWishlistItems
        });

    } catch (error) {
      next(error)
    }
};

const addToWishlist = async (req, res,next) => {
    try {
       
        
      const { pid } = req.body;
      const userId = req.session.user || (req.user && req.user._id);
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
     
      next(error)
    }
  };

  const removeFromWishlist = async (req, res,next) => {
    try {
       

        const { pid } = req.body;
        const userId = req.session.user || (req.user && req.user._id);

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
      next(error)
    }
};

  
module.exports={
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
};