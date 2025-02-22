const Cart=require("../../models/cartSchema")
const User=require("../../models/userSchema")
const Product=require("../../models/productSchema")
const Coupon=require("../../models/couponSchema")
const mongoose=require("mongoose")
const mongodb=require("mongodb")
const Category = require("../../models/CategorySchema")
const Address=require("../../models/addressSchema")
const Order=require("../../models/orderSchema")
const {v4:uuidv4}=require('uuid')


const loadCheckOut = async (req, res) => {
    try {
      console.log("Request arrived at checkout");
      const CouponData=await Coupon.find({isList:true})
     const cart=req.query.cart;
     console.log(cart);
     
      const userId = req.session.user;
      console.log("User ID:", userId);
      
      const userData = await User.findById({ _id: userId });
      const oid = new mongoose.Types.ObjectId(userId);
      const addressData = await Address.findOne({ userId: userId });
      
         if (cart) {
        const cartData = await Cart.aggregate([
          { $match: { userId: oid } },
          { $unwind: "$items" },
          {
            $project: {
              quantity: "$items.quantity",
              price: "$items.price",         // salePrice stored when added
              totalPrice: "$items.totalPrice", // price * quantity
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
          { $match: { "productDetails.status": { $ne: "Out of Stock" } } },
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
        
        console.log("Aggregated Cart Data:", cartData);
        
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
        
        // console.log("Products to render:", items);
        // console.log("Grand Total:", grandTotal);
        req.session.CartItems=items;
        req.session.grandTotal=grandTotal;
        req.session.grandRegularTotal=grandRegularTotal;
        req.session.totalQuantity=totalQuantity;
       
        return res.render("checkout", {
          products: items,           // cart items with product details
          grandTotal,                // total using salePrice
          grandRegularTotal,         // total using regularPrice
          totalQuantity,
          userData,
          addressData: addressData ? addressData.address : null,
          couponData:CouponData,
          couponApplied:''
        });
      } else {
        console.log("cart is false");
        return res.redirect("/cart");
      }
    } catch (error) {
      console.error("Error in loadCheckOut:", error);
      res.redirect("/page-not-found");
    }
  };
  

const applyCoupon=async(req,res)=>
{
    try {
        const {couponCode,cart}=req.body;
               let grandTotal= req.session.grandTotal
               let grandRegularTotal=req.session.grandRegularTotal

               if(cart)
               {
                const coupon=await Coupon.findOne({code:couponCode,isList:true})
                if(!coupon)
                {
                    return res.staus(400).json({success:false,message:"coupon not found"})
                }
                console.log(grandTotal);
                
                const appliedCoupon=coupon.code;
                const couponOfferPrice=coupon.offerPrice;
                grandTotal-=couponOfferPrice;
                req.session.grandTotal=grandTotal;
                console.log(grandTotal);
                

                return res.status(200).json({success:true,message:"Coupon added",grandTotal,grandRegularTotal,couponOfferPrice,appliedCoupon})

               }
               else
               {
            console.log("not cart need to addd single product");
            
               }


               
    } catch (error) {
        console.log(error);
        
    }
}
const orderSummary=async(req,res)=>
{
    try {
      console.log("inside order summary");
      
        const userId=req.session.user;
         const items=req.session.CartItems
       const grandTotal= req.session.grandTotal
        const grandRegularTotal=req.session.grandRegularTotal
       const totalQuantity= req.session.totalQuantity;
       const {addressId,coupon}=req.body;
       console.log(items);
       
       if(!addressId || !coupon)
       {
        console.log("address id missing");
        
       }
       const addressData=await Address.findOne({userId:userId})
       const couponData=await Coupon.findOne({code:coupon})
       const selectedAddress=addressData.address.find(ad=>ad._id.toString()===addressId.toString())
      
       req.session.deliveryAddress=selectedAddress
       if(!selectedAddress)
       {
        res.status(401).json("address not found")
       };
       return  res.render("orderSummary", {
        products:items,           // cart items with product details
        grandTotal,      // total using salePrice
        grandRegularTotal, // total using regularPrice
        totalQuantity,
        addressData:selectedAddress,
        couponData
       })
    } catch (error) {
        console.log("error occured while laoding the order summary"+error);
        return res.redirect("/page-not-found")
        
    }
}



// const placeOrder = async (req, res) => {
//   try {

  
//     const userId = req.session.user;  // assuming this is the logged-in user's _id
//     const items = req.session.CartItems; // array of cart items
//     const grandTotal = req.session.grandTotal;
//     const grandRegularTotal = req.session.grandRegularTotal; 
//     const deliveryAddress = req.session.deliveryAddress;

//     const cart=req.query;

//     let newOrder;

//     if (cart && items.length>0) {
//       // For cart-based orders:
//       const orderedItems = items.map(item => ({
//         product: item.productId, // make sure your item has productId
//         quantity: item.quantity,
//         price: item.price
//       }));

//       const discount = grandRegularTotal ? (grandRegularTotal - grandTotal) : 0;
//       const finalAmount = grandTotal;

//       newOrder = new Order({
//         // Optionally, if you don't have userId field in the order schema,
//         // you can just store the order id in the user's orders array
//         orderedItems,
//         totalPrice: grandTotal,
//         discount,
//         finalAmount,
//         address: deliveryAddress._id,
//         invoiceDate: new Date(),
//         status: 'pending',
//         couponApplied: discount > 0
//       });
//     } else {
//       // For single product order:
//       const { productId, quantity, price, address } = req.query;
//       if (!productId || !quantity || !price || !address) {
//         return res.status(400).json({
//           success: false,
//           message: "Missing required fields for single product order."
//         });
//       }
      
//       const orderedItems = [{
//         product: productId,
//         quantity: Number(quantity),
//         price: Number(price)
//       }];
      
//       const totalPrice = Number(price) * Number(quantity);
//       const finalAmount = totalPrice;
      
//       newOrder = new Order({
//         orderedItems,
//         totalPrice,
//         discount: 0,
//         finalAmount,
//         address: address,
//         invoiceDate: new Date(),
//         status: 'processing',
//         couponApplied: false
//       });
//     }

//     // Save the new order
//     const savedOrder = await newOrder.save();

//     // Update the user document with this order
//     await User.findByIdAndUpdate(userId, {
//       $push: { orderHistory: savedOrder._id }  // assuming orders is an array of ObjectIds
//     });
//     //delete session data for the order
//   req.session.order=savedOrder;  
//   req.session.orderData=items;
//      req.session.grandTotal;
//     delete req.session.grandRegularTotal; 

//    return  res.status(201).json({
//       success: true,
//       message: items && items.length > 0 ? "Order placed successfully from cart" : "Order placed successfully for single product.",
//       order: savedOrder
//     });

//   } catch (error) {
//     console.error("Error placing order:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error while placing order"
//     });
//   }
// };


const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;  // Logged-in user's _id
    const items = req.session.CartItems; // Array of cart items
    const grandTotal = req.session.grandTotal;
    const grandRegularTotal = req.session.grandRegularTotal; 
    const deliveryAddress = req.session.deliveryAddress;
    const cart = req.query;

    let newOrder;

    if (cart && items.length > 0) {
      // For cart-based orders:
      const orderedItems = items.map(item => ({
        product: item.productId, // assuming item has productId
        quantity: item.quantity,
        price: item.price
      }));

      const discount = grandRegularTotal ? (grandRegularTotal - grandTotal) : 0;
      const finalAmount = grandTotal;

      newOrder = new Order({
        orderedItems,
        totalPrice: grandTotal,
        discount,
        finalAmount,
        address: deliveryAddress._id,
        invoiceDate: new Date(),
        status: 'pending',
        couponApplied: discount > 0
      });
    } else {
      // For single product order:
      const { productId, quantity, price, address } = req.query;
      if (!productId || !quantity || !price || !address) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields for single product order."
        });
      }
      
      const orderedItems = [{
        product: productId,
        quantity: Number(quantity),
        price: Number(price)
      }];
      
      const totalPrice = Number(price) * Number(quantity);
      const finalAmount = totalPrice;
      
      newOrder = new Order({
        orderedItems,
        totalPrice,
        discount: 0,
        finalAmount,
        address: address,
        invoiceDate: new Date(),
        status: 'processing',
        couponApplied: false
      });
    }

    // Save the new order
    const savedOrder = await newOrder.save();

    // Update the user document with this order
    await User.findByIdAndUpdate(userId, {
      $push: { orderHistory: savedOrder._id }
    });

    // Decrease product stock based on ordered items
    // Loop over each ordered item and decrement its stock by the ordered quantity
    for (let item of savedOrder.orderedItems) {
      // Use findByIdAndUpdate to decrement stock using MongoDB's $inc operator
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
    }

    // Clean up session data for order
    req.session.order = savedOrder;  
    req.session.orderData = items;
    delete req.session.grandRegularTotal;

    return res.status(201).json({
      success: true,
      message: items && items.length > 0 
        ? "Order placed successfully from cart" 
        : "Order placed successfully for single product.",
      order: savedOrder
    });

  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while placing order"
    });
  }
};






const orderPlaced=async(req,res)=>
{
  console.log("inside order placed ........................................");
  try {
    const userId=req.session.user;
    const orderItems=req.session.orderData
    const order=req.session.order;
    const grandTotal= req.session.grandTotal;
    const deliveryAddress=req.session.deliveryAddress;
    const orderData=await Order.findById({_id:order._id})
    const addressId=orderData.address;
    const addressData=await Address.findOne({userId:userId})
    const selectedAddress=addressData.address.find(ad=>ad._id.toString()===addressId)
  console.log(order);
  
   
    
    const uuid = orderData.orderId;
    // Remove dashes
    const hexString = uuid.replace(/-/g, '');
    // Convert hex to BigInt
    const numericValue = BigInt("0x" + hexString);
    console.log(numericValue);
    const createdOn = new Date(orderData.createdOn);
    const deliveryDate = new Date(createdOn);
    deliveryDate.setDate(deliveryDate.getDate() + 4);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
orderData.createdOnFormatted = createdOn.toLocaleDateString('en-US', options);
const deliveryDateFormatted = deliveryDate.toLocaleDateString('en-US', options);


    return res.render("orderPlaced",{
      items:orderItems,
      orderData,
      orderId:numericValue,
      addressData:deliveryAddress,
      deliveryDate:deliveryDateFormatted,
      grandTotal,
  })
  } catch (error) {
    console.log(error);
    return res.redirect("/page-not-found")
    
  }
}




module.exports=
{
    loadCheckOut,
    applyCoupon,
    orderSummary,
    placeOrder,
    orderPlaced,
}