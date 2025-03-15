const Cart=require("../../models/cartSchema")
const User=require("../../models/userSchema")
const Product=require("../../models/productSchema")
const Coupon=require("../../models/couponSchema")
const mongoose=require("mongoose")
const mongodb=require("mongodb")
const Category = require("../../models/CategorySchema")


const loadCart = async (req, res) => {
  try {
    const userId = req.session.user || (req.user && req.user._id);
    const userData=await User.findById({_id:userId})
    const oid = new mongoose.Types.ObjectId(userId);

    // Aggregation on the Cart collection
    const cartData = await Cart.aggregate([
      // Find the cart document for the current user
      { $match: { userId: oid } },
      // Unwind the items array to work on each item individually
      { $unwind: "$items" },
      // Project needed fields from each item
      {
        $project: {
          quantity: "$items.quantity",
          price: "$items.price",         // salePrice stored when added
          totalPrice: "$items.totalPrice", // price * quantity
          productId: "$items.productId"
        }
      },
      // Lookup the corresponding product details from the products collection
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      // Unwind productDetails to flatten the result
      { $unwind: "$productDetails" },
      // Group to calculate totals for sale and regular prices
      {
        $group: {
          _id: null,
          items: { $push: "$$ROOT" },
          grandTotal: { $sum: { $multiply: [ "$productDetails.salePrice", "$quantity" ] } },
          grandRegularTotal: { $sum: { $multiply: [ "$productDetails.regularPrice", "$quantity" ] } },
          totalQuantity: { $sum: "$quantity" }
        }
      }
    ]);

    let items, grandTotal, grandRegularTotal, totalQuantity;
    if (cartData.length > 0) {
      items = cartData[0].items;
      grandTotal = cartData[0].grandTotal;
      grandRegularTotal = cartData[0].grandRegularTotal;
      totalQuantity = cartData[0].totalQuantity;
    } else {
      items = [];
      grandTotal = 0;
      grandRegularTotal = 0;
      totalQuantity = 0;
    }
    const handlingFee=7*totalQuantity;
     const packagingFee=10*totalQuantity;
     grandTotal+=handlingFee+packagingFee;
     console.log("items means cart data ");
     console.log(items);
     
     
     req.session.cartProducts=items;

    res.render("cart", {
      products:items,           // cart items with product details
      grandTotal,      // total using salePrice
      grandRegularTotal,
      handlingFee,
      packagingFee, // total using regularPrice
      totalQuantity,
      userData

    });
  } catch (error) {
    console.error(error);
    res.redirect("/page-not-found");
  }
};


    const addToCart = async (req, res) => {
      try {
        console.log("req arrived at addToCart ");
        
        const { pid } = req.body;
        const userId = req.session.user || (req.user && req.user._id);
        const user=await User.findById({_id:userId})
        const checkProduct=await Product.findById({_id:pid})
        const checkCategory=checkProduct.category;
        const findCategory=await Category.findOne({_id:checkCategory,isListed:true})
        console.log("check Product"+checkProduct);
        console.log("find Category"+findCategory);
        
        if(checkProduct.isBlocked || !findCategory)
        {
          return res.status(400).json({success:false,message:"This product is currently unavailable and cannot be added to your cart." })
        }
    
        if (!pid || !userId) {
          return res.status(400).json({ success: false, message: "Product ID and User ID are required" });
        }
    
        // Check if a Cart document exists for the current user
        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
          // If no cart exists, create one
          cart = new Cart({ userId, items: [] });
        }
    
        // Check if the product is already in the cart
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === pid);
        if (itemIndex > -1) {
          return res.status(200).json({ success: true, message: "Great news! The item is already in your cart. You can update the quantity to add more" });
        }
    
        // Retrieve product details to get the salePrice and other info
        const product = await Product.findById(pid);
        if (!product) {
          return res.status(404).json({ success: false, message: "Product not found" });
        }
    
        // Add the product to the cart with quantity 1 and calculate totalPrice
        cart.items.push({
          productId: pid,
          quantity: 1,
          price: product.salePrice,
          totalPrice: product.salePrice  // since quantity is 1
        });
    
        await cart.save();
         // Check if the product exists in the wishlist
         const index = user.wishlist.indexOf(pid);
         if (index > -1) {
              // Remove the product from the wishlist
         user.wishlist.splice(index, 1);
         await user.save(); 
         }
 
        return res.status(200).json({ success: true, message: "Added to cart" });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error occurred" });
      }
    };
    



    const updateCart = async (req, res) => {
      try {
        console.log("Request arrived at updateCart");
        let itemId=req.params.itemId;
        let { quantity } = req.body;
        const itemObjId = new mongoose.Types.ObjectId(itemId);
        const userId = req.session.user || (req.user && req.user._id);
      
        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
          return res.status(400).json({ success: false, message: "User doesn't have a cart" });
        }
        
     
        let foundItem = null;
        cart.items.forEach(item => {
          if (item.productId.toString() === itemObjId.toString()) {
            foundItem = item;
          }
        });
        
        if (!foundItem) {
          return res.status(404).json({ success: false, message: "Item not found in cart" });
        }
       
        foundItem.quantity = quantity;
        foundItem.totalPrice = foundItem.price * quantity; 
        
        await cart.save();
        
  
        const product = await Product.findById(foundItem.productId);
        if (!product) {
          return res.status(404).json({ success: false, message: "Product not found" });
        }
        
      
        const itemTotal = product.salePrice * foundItem.quantity;
        
       
        const oid = new mongoose.Types.ObjectId(userId);
        
  
        const cartData = await Cart.aggregate([
          { $match: { userId: oid } },
          { $unwind: "$items" },
          {
            $project: {
              quantity: "$items.quantity",
              price: "$items.price",        
              totalPrice: "$items.totalPrice",
              productId: "$items.productId"
            }
          },
          {
            $lookup: {
              from: "products", 
              localField: "productId",
              foreignField: "_id",
              as: "productDetails"
            }
          },
          { $unwind: "$productDetails" },
          {
            $group: {
              _id: null,
              items: { $push: "$$ROOT" },
              grandTotal: { $sum: { $multiply: [ "$productDetails.salePrice", "$quantity" ] } },
              grandRegularTotal: { $sum: { $multiply: [ "$productDetails.regularPrice", "$quantity" ] } },
              totalQuantity: { $sum: "$quantity" }
            }
          }
        ]);
        
        let items, grandTotal, grandRegularTotal, totalQuantity;
        if (cartData.length > 0) {
          items = cartData[0].items;
          grandTotal = cartData[0].grandTotal;
          grandRegularTotal = cartData[0].grandRegularTotal;
          totalQuantity = cartData[0].totalQuantity;
        } else {
          items = [];
          grandTotal = 0;
          grandRegularTotal = 0;
          totalQuantity = 0;
        }
        //updated data to the session
        req.session.cartProducts=items;
        req.session.grandTotal=grandTotal;
        req.session.grandRegularTotal=grandRegularTotal;
        req.session.totalQuantity=totalQuantity;
        const handlingFee =7*totalQuantity;
        const packagingFee =10*totalQuantity;
         console.log(grandTotal);
         
        return res.status(200).json({
          success: true,
          message: "Cart updated successfully",
          updatedItem: { _id: foundItem._id, quantity: foundItem.quantity, itemTotal },
          items,
          totalQuantity,
          grandTotal:grandTotal+handlingFee+packagingFee,
          grandRegularTotal,
          handlingFee,
          packagingFee
        });
      } catch (error) {
        console.log(error);
        
         res.status(500).json({ success: false, message: "Error updating cart" });
      }
    };
    
//remove item from cart

const removeItem=async(req,res)=>
{
  try {
    const {itemId}=req.body;
    const userId = req.session.user || (req.user && req.user._id);
    const itemObjId = new mongoose.Types.ObjectId(itemId);
    let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
          return res.status(400).json({ success: false, message: "User doesn't have a cart" });
        }

        let foundItemIndex = -1;
cart.items.forEach((item, index) => {
  if (item.productId.toString() === itemObjId.toString()) {
    foundItemIndex = index;
  }
});

if (foundItemIndex === -1) {
  return res.status(404).json({ success: false, message: "Item not found in cart" });
} else {
  // Remove the found item from the cart items array
  cart.items.splice(foundItemIndex, 1);
  await cart.save();
  req.session.cartProducts=cart.items;
        
       
        const oid = new mongoose.Types.ObjectId(userId);
        
  
        const cartData = await Cart.aggregate([
          { $match: { userId: oid } },
          { $unwind: "$items" },
          {
            $project: {
              quantity: "$items.quantity",
              price: "$items.price",        
              totalPrice: "$items.totalPrice",
              productId: "$items.productId"
            }
          },
          {
            $lookup: {
              from: "products", 
              localField: "productId",
              foreignField: "_id",
              as: "productDetails"
            }
          },
          { $unwind: "$productDetails" },
          {
            $group: {
              _id: null,
              items: { $push: "$$ROOT" },
              grandTotal: { $sum: { $multiply: [ "$productDetails.salePrice", "$quantity" ] } },
              grandRegularTotal: { $sum: { $multiply: [ "$productDetails.regularPrice", "$quantity" ] } },
              totalQuantity: { $sum: "$quantity" }
            }
          }
        ]);
        
        let items, grandTotal, grandRegularTotal, totalQuantity;
        if (cartData.length > 0) {
          items = cartData[0].items;
          grandTotal = cartData[0].grandTotal;
          grandRegularTotal = cartData[0].grandRegularTotal;
          totalQuantity = cartData[0].totalQuantity;
        } else {
          items = [];
          grandTotal = 0;
          grandRegularTotal = 0;
          totalQuantity = 0;
        }
        
        return res.status(200).json({
          success: true,
          message: "item removed",
          totalQuantity,
          grandTotal,
          grandRegularTotal
        });
}

  } catch (error) {
    console.log("error occured while removing item from cart");
    console.log(error);
  }
}



module.exports={
    loadCart,
    addToCart,
    updateCart,
    removeItem,
}