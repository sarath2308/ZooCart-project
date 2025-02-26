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
const { loginPage } = require("./userController")


const loadCheckOut = async (req, res) => {
    try {
      console.log("Request arrived at checkout");
      const CouponData=await Coupon.find({isList:true})
     const cart=req.query.cart;
     console.log(cart);
     
     const userId = req.session.user || (req.user && req.user._id);
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
      const packagingFee=10*totalQuantity;
      const handlingFee=7*totalQuantity;
      req.session.grandTotal=grandTotal;
       
        return res.render("checkout", {
          products: items,           // cart items with product details
          grandTotal:grandTotal+packagingFee+handlingFee,                // total using salePrice
          grandRegularTotal,         // total using regularPrice
          totalQuantity,
          userData,
          addressData: addressData ? addressData.address : null,
          couponData:CouponData,
          couponApplied:'',
          packagingFee,
          handlingFee
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
      console.log("inside apply coupon");
      
        const {couponCode,cart}=req.body;
               let grandTotal= req.session.grandTotal
               let grandRegularTotal=req.session.grandRegularTotal
               let totalQuantity=req.session.totalQuantity;

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
                const packagingFee=10*totalQuantity;
                const handlingFee=7*totalQuantity;
                grandTotal+=packagingFee+handlingFee;
                console.log(grandTotal);
                

                return res.status(200).json({success:true,message:"Coupon added",grandTotal,couponOfferPrice,appliedCoupon})

               }
               else
               {
            console.log("not cart need to addd single product");
            
               }


               
    } catch (error) {
        console.log(error);
        
    }
}



const placeOrder = async (req, res) => {
  try {
    console.log("req arrived at place order");
    
    const userId = req.session.user || (req.user && req.user._id);
    const cart=req.query.cart;
      const orderData=req.body;
      let newOrder;
      let items;
      if (cart) {
       items=req.session.cartProducts;
      const addressId=orderData.addressId;
      const paymentMethod=orderData.paymentMethod;
      const totalQuantity=orderData.totalQuantity;
      const grandRegularTotal=orderData.grandRegularTotal;
      const discountAmount=orderData.discountAmount;
      const coupon=orderData.coupon;
      const handlingFee=orderData.handlingFee;
      const packagingFee=orderData.packagingFee;
      const grandTotal=orderData.grandTotal;
  
      console.log("all items"+items);
      

        const orderedItems = items.map(item => ({
          product: item.productId, // assuming item has productId
          quantity: item.quantity,
          price: item.price
        }));

      newOrder = new Order({
        orderedItems:orderedItems,
        totalPrice: grandRegularTotal,
        handlingFee:handlingFee,
        packagingFee:packagingFee,
        deliveryCharge:"Free",
        discount:discountAmount,
        paymentMethod:paymentMethod,
        finalAmount:grandTotal,
        address: addressId,
        totalQuantity:totalQuantity,
        invoiceDate: new Date(),
        status: 'processing',
        couponApplied:coupon?true:false
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
        paymentMethod:paymentMethod,
        totalQuantity:totalQuantity,
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

    // Loop over each ordered item and decrement its stock by the ordered quantity
    for (let item of savedOrder.orderedItems) {
      // Use findByIdAndUpdate to decrement stock using MongoDB's $inc operator
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
    }
  console.log("save order");
  console.log(savedOrder);
  
  
    // Clean up session data for order
    req.session.order = savedOrder;  
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
    const userId = req.session.user || (req.user && req.user._id);
    const orderId=req.session.order._id;

    const orderData=await Order.findById({_id:orderId}).populate("orderedItems.product")
   const addressId=orderData.address;
   const deliveryAddressDoc = await Address.findOne({ userId: userId });
   let deliveryAddress;

   if (!deliveryAddressDoc) {
       console.log("No address found for this user.");
   } else {
       deliveryAddress = deliveryAddressDoc.address.find(addr => addr._id.toString() === addressId.toString());
       console.log("Delivery Address:", deliveryAddress);
   }
    
    const uuid = orderData.orderId;
    const hexString = uuid.replace(/-/g, '');
    const numericValue = BigInt("0x" + hexString);
    console.log(numericValue);
    const createdOn = new Date(orderData.createdOn);
    const deliveryDate = new Date(createdOn);
    deliveryDate.setDate(deliveryDate.getDate() + 4);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
orderData.createdOnFormatted = createdOn.toLocaleDateString('en-US', options);
const deliveryDateFormatted = deliveryDate.toLocaleDateString('en-US', options);
  const orderedDate = new Date(orderData.createdOn).toLocaleString('en-US', { 
      timeZone: 'Asia/Kolkata', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
  });



    return res.render("orderPlaced",{
      data:orderData,
      orderId:numericValue,
      deliveryDate:deliveryDateFormatted,
      orderedDate,
      deliveryAddress

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
    placeOrder,
    orderPlaced,
}