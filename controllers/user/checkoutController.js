const Cart=require("../../models/cartSchema")
const User=require("../../models/userSchema")
const Product=require("../../models/productSchema")
const Coupon=require("../../models/couponSchema")
const mongoose=require("mongoose")
const Address=require("../../models/addressSchema")
const Order=require("../../models/orderSchema")
const razorpay=require("../../config/razorpay")
require('dotenv').config()
const crypto=require('crypto')
const Wallet=require("../../models/walletSchema")


//generate uniqueId

function generateUniqueNumber() {
  const timestamp = Date.now().toString(); // Current timestamp in milliseconds
  const randomNumber = parseInt(crypto.randomBytes(4).toString('hex'), 16); // Convert hex to integer
  const numericRandom = randomNumber.toString().slice(0, 6); // Extract first 6 digits for brevity
  return `${timestamp}${numericRandom}`;
}



const loadCheckOut = async (req, res) => {
    try {
      const userId = req.session.user || (req.user && req.user._id);
      const userData = await User.findById({ _id: userId });
      const couponsUsed=userData.usedCoupons;
      console.log("Request arrived at checkout");
      const currentDate = new Date(); // Get the current date and time

const CouponData = await Coupon.find({
    isList: true, // Coupon is listed
    _id: { $nin: couponsUsed }, // Coupon is not used by the user
    expiredOn: { $gte: currentDate }, // Coupon is not expired
});
     const cart=req.query.cart;
     console.log(cart);
    
      const oid = new mongoose.Types.ObjectId(userId);
      const addressData = await Address.findOne({ userId: userId });
      const userWallet=await Wallet.findOne({userId:userId})
      
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
      req.session.totalQuantity=totalQuantity;
      console.log("items:");
      console.log(items);
      
      
       
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
          handlingFee,
          wallet:userWallet
        });
      } else {
        const {pid,quantity}=req.query;
        const product=await Product.findById({_id:pid})
        const grandRegularTotal=product.regularPrice*quantity;
        const grandTotal=product.salePrice*quantity;
        const packagingFee=10*quantity;
        const handlingFee=7*quantity;
           console.log("products"+product);
           req.session.grandTotal=grandTotal;
           req.session.totalQuantity=quantity;
           req.session.product=product;
        return res.render("checkout",{
          products:product,
          grandTotal:grandTotal+packagingFee+handlingFee,
          grandRegularTotal,
          totalQuantity:quantity,
          userData,
          addressData: addressData ? addressData.address : null,
          couponData:CouponData,
          couponApplied:'',
          packagingFee,
          handlingFee,
          wallet:userWallet,

        })


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
               
    } catch (error) {
        console.log(error);
        return res.status(400).json({success:false,message:"coupon not applied"})
        
    }
}

const removeCoupon=async(req,res)=>
{
  console.log("req arrived at remoeve Coupon");
  
  try{
               let grandTotal= req.session.grandTotal
               let totalQuantity=req.session.totalQuantity;
                console.log(grandTotal);
                const packagingFee=10*totalQuantity;
                const handlingFee=7*totalQuantity;
                grandTotal+=packagingFee+handlingFee;
                console.log(grandTotal);
                

                return res.status(200).json({success:true,message:"Coupon removed",grandTotal})
               }
                 catch (error) {
                        console.log(error);
                        return res.status(400).json({success:false,messsage:"server error"})
                     }
                    }
                      


const placeOrder = async (req, res) => {
  try {
    console.log("req arrived at place order");
    
    const userId = req.session.user || (req.user && req.user._id);
    const userData = await User.findById({ _id: userId });
    console.log("user Data from place order"+userData);
    
  
    
    const orderData = req.body;
    let newOrder;
    let items;
    let paymentMethod;
    let grandTotal;
    let couponCode;
    let orderedItems;
    let handlingFee;
    let packagingFee;
    let  savedOrder;
    let couponData;
    //uniqe id 
    let uniqueId=generateUniqueNumber()
    const userWallet = await Wallet.findOne({ userId: userId });
    
      const addressId = orderData.addressId;
      paymentMethod = orderData.paymentMethod;
      const totalQuantity = orderData.totalQuantity;
      const grandRegularTotal = orderData.grandRegularTotal;
      const discountAmount = orderData.discountAmount;
      const coupon = orderData.coupon;
       handlingFee = orderData.handlingFee;
       packagingFee = orderData.packagingFee;
      grandTotal = orderData.grandTotal;
      couponCode = orderData.couponCode;
      const cart=orderData.cart;
      console.log("cart status "+cart);
      console.log("coupon code that reached place order"+couponCode);
      
      
      if(couponCode)
      {
       couponData = await Coupon.findOne({ code: couponCode });
      if (couponData) {
        userData.usedCoupons.push(couponData._id);
        await userData.save();
      }
    }
      if (cart){

        items = req.session.cartProducts;
        if (!items || !Array.isArray(items)) {
          throw new Error("Cart products not found or invalid.");
        }
    
        for (let item of items) {
          let adjustedPrice=item.totalPrice;
          let couponVal;
          let productData=await Product.findById({_id:item.productId})
          handlingFee=item.quantity*7;
          packagingFee=item.quantity*10;
          if(couponCode)
            {
              let total=grandTotal+couponData.offerPrice;
           couponVal=Math.ceil(item.totalPrice/total*couponData.offerPrice);
            console.log("discount amount"+couponVal);
            
             adjustedPrice = item.totalPrice-couponVal;
            if (adjustedPrice < 0) {
              adjustedPrice = 0;
            }
            }
          let orderPayload = {
            orderedItem:item.productId,
            totalPrice: item.totalPrice,  // You might want to recalculate this per product if needed.
            handlingFee,
            packagingFee,
            deliveryCharge: "Free",
            discount:productData.regularPrice-adjustedPrice , // Total discount from coupon (optional: recalc per order)
            paymentMethod: paymentMethod,
            finalAmount: adjustedPrice+handlingFee+packagingFee,  // Alternatively, recalc per order: (adjustedPrice * quantity + fees, etc.)
            address: addressId,
            totalQuantity: item.quantity,  // Quantity for this product
            invoiceDate: new Date(),
            status: 'processing',
            couponApplied: couponVal?couponVal:0, // Discount applied to this order
            userId: userId,
            cartId:uniqueId,
          };

          const newOrder = new Order(orderPayload);
          savedOrder = await newOrder.save();
          
        await User.findByIdAndUpdate(userId, { $push: { orderHistory: savedOrder._id } });
        req.session.order = savedOrder;
        }
 }else{
      let  item=req.session.product;
        newOrder = new Order({
          orderedItem:item._id,
          totalPrice: grandRegularTotal,
          handlingFee: handlingFee,
          packagingFee: packagingFee,
          deliveryCharge: "Free",
          discount: discountAmount,
          paymentMethod: paymentMethod,
          finalAmount: grandTotal,
          address: addressId,
          totalQuantity: totalQuantity,
          invoiceDate: new Date(),
          status: 'processing',
          couponApplied: coupon ? parseInt(coupon) : 0,
          userId: userId,
          uniqueId,
          
        });
     savedOrder = await newOrder.save();
    req.session.order = savedOrder;

      }
      

    // Now update wallet if payment method is wallet
    if (paymentMethod === 'wallet') {
      const payment = {
        amount: grandTotal,
        paymentFlow: false,
        description: "ordered",
        status: 'debited',
        orderId: savedOrder._id,  // Now savedOrder is defined
      };
      // Deduct the grandTotal from the wallet balance
      userWallet.balance -= grandTotal;
      userWallet.paymentHistory.push(payment);
      await userWallet.save();
      savedOrder.paymentStatus = true;
      await Product.findByIdAndUpdate(
        savedOrder.orderedItem,
        { $inc: { quantity: -savedOrder.totalQuantity } },
        { new: true }
      );
      await savedOrder.save()
    }
    
    // If online payment, create Razorpay order
    if (paymentMethod === 'online payment') {
      const razorpayOrder = await razorpay.orders.create({
        amount: grandTotal * 100, // Amount in paise
        currency: 'INR',
        receipt: `order_${uniqueId}`,
      });
      
      razorpayOrder.user_key = process.env.RAZORPAY_KEY_ID;
      console.log(razorpayOrder);
      return res.status(201).json({
        payment_method: 'online',
        order: razorpayOrder,
        cart:cart?true:false,
        savedOrder,
      });
    } else {
      // Update user's order history
      await User.findByIdAndUpdate(userId, {
        $push: { orderHistory: savedOrder._id }
      });
      
      // Decrement product stock for each ordered item
      await Product.findByIdAndUpdate(
        savedOrder.orderedItem,
        { $inc: { quantity: -savedOrder.totalQuantity } },
        { new: true }
      );
      
      console.log("Order saved:", savedOrder);
      
      delete req.session.grandRegularTotal;
      savedOrder.name = userData.name;
      savedOrder.email = userData.email;
      savedOrder.phone = userData.phone ? userData.phone : '99999999999';
      
      return res.status(201).json({
        success: true,
        payment_method: 'cod',
        savedOrder,
        cart:cart?true:false,
        message: Array.isArray(items) && items.length > 0 
          ? "Order placed successfully from cart" 
          : "Order placed successfully for single product.",
      });
    }
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};






const invoiceData=async(req,res)=>
{
  console.log("inside order placed ........................................");
  try {
    const userId = req.session.user || (req.user && req.user._id);
    const orderId=req.query.orderId;
    console.log("orderId"+orderId);
    

    const orderData=await Order.findById({_id:orderId}).populate("orderedItem")
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


const orderPlaced=async(req,res)=>
{
  try {
    const orderId=req.session.order._id;
    return res.render("orderSuccess",
      {
        orderId,
      }
    )
  } catch (error) {
    console.log("error occured while showing order");
    console.log(error);
    
    
  }
}

const orderNotPlaced=async(req,res)=>
  {
  let cart=req.query.cart;
try {
  return res.render('orderFailure',{
    cart,
  })
} catch (error) {

  console.log("error occured while ");
  console.log(error);
  
}
  }


  const verifyPayment=async(req,res)=>
  {
    try {
      const userId= req.session.user || (req.user && req.user._id);
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature,orderId} = req.body;

      const savedOrder=await Order.findById({_id:orderId})
      let cart;
      if(savedOrder.orderedItem)
      {
        cart=true
      }
      else
      {
        false
      }

      // Generate the expected signature
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET) // Use your Razorpay key_secret
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');
    
      if (generatedSignature === razorpay_signature) {
       savedOrder.paymentStatus=true;
       savedOrder.paymentId=razorpay_payment_id;
       await savedOrder.save()
          // Update the user document with this order
    await User.findByIdAndUpdate(userId, {
      $push: { orderHistory: savedOrder._id }
    });

    // Loop over each ordered item and decrement its stock by the ordered quantity
   
    await Product.findByIdAndUpdate(
      savedOrder.orderedItem,
      { $inc: { quantity: -savedOrder.totalQuantity } },
      { new: true }
    );
  console.log("save order");
        res.json({ success:true,cart });
      } else {
        // Payment is invalid
        res.json({ success:false,cart });
      }
    } catch (error) {
      console.log("error occured while verifying payment");
      console.log(error);
   
    }
  }
module.exports=
{
    loadCheckOut,
    applyCoupon,
    placeOrder,
    invoiceData,
    orderPlaced,
    orderNotPlaced,
    verifyPayment,
    removeCoupon,
}