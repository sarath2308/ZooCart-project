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
const Payment=require("../../models/paymentSchema")


//generate uniqueId

function generateUniqueNumber() {
  const timestamp = Date.now().toString(); // Current timestamp in milliseconds
  const randomNumber = parseInt(crypto.randomBytes(4).toString('hex'), 16); // Convert hex to integer
  const numericRandom = randomNumber.toString().slice(0, 6); // Extract first 6 digits for brevity
  return `${timestamp}${numericRandom}`;
}

function generateTransactionId() {
  const timestamp = Date.now().toString(); // Current timestamp in milliseconds
  const randomNumber = parseInt(crypto.randomBytes(4).toString('hex'), 16); // Convert hex to integer
  const numericRandom = randomNumber.toString().slice(0, 6); // Extract first 6 digits for brevity
  return `${timestamp}${numericRandom}`;
}



const loadCheckOut = async (req, res,next) => {
    try {
      const userId = req.session.user || (req.user && req.user._id);
      const userData = await User.findById({ _id: userId });
      const couponsUsed=userData.usedCoupons;
      const currentDate = new Date(); // Get the current date and time

const CouponData = await Coupon.find({
    isList: true, // Coupon is listed
    _id: { $nin: couponsUsed }, // Coupon is not used by the user
    expiredOn: { $gte: currentDate }, // Coupon is not expired
});
     const cart=req.query.cart;
      let sessionAddress=req.session.addressData
      let sessionPaymentMethod=req.session.paymentMethod;
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
          wallet:userWallet,
          sessionAddress,
          sessionPaymentMethod
        });
      } else {
        
        const {pid,quantity}=req.query;
        const product=await Product.findById({_id:pid})
        const grandRegularTotal=product.regularPrice*quantity;
        const grandTotal=product.salePrice*quantity;
        const packagingFee=10*quantity;
        const handlingFee=7*quantity;
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
          sessionAddress,
          sessionPaymentMethod

        })


      }
    } catch (error) {
      next(error)
    }
  };
  

const applyCoupon=async(req,res,next)=>
{
    try {
   
      
        const {couponCode,cart}=req.body;
               let grandTotal= req.session.grandTotal
               let grandRegularTotal=req.session.grandRegularTotal
               let totalQuantity=req.session.totalQuantity;
                const coupon=await Coupon.findOne({code:couponCode,isList:true})
                if(!coupon)
                {
                    return res.staus(400).json({success:false,message:"coupon not found"})
                }
                
                
                const appliedCoupon=coupon.code;
                const couponOfferPrice=coupon.offerPrice;
                grandTotal-=couponOfferPrice;
                const packagingFee=10*totalQuantity;
                const handlingFee=7*totalQuantity;
                grandTotal+=packagingFee+handlingFee;
                console.log(grandTotal);
                

                return res.status(200).json({success:true,message:"Coupon added",grandTotal,couponOfferPrice,appliedCoupon})
               
    } catch (error) {
      next(error)
        
    }
}

const removeCoupon=async(req,res,next)=>
{
  
  
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
                  next(error)
                     }
                    }
                      


const placeOrder = async (req, res,next) => {
  try {

    const userId = req.session.user || (req.user && req.user._id);
    const userData = await User.findById({ _id: userId });

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
    let orderPayload;
    //uniqe id 
    let uniqueId=generateUniqueNumber()
    const userWallet = await Wallet.findOne({ userId: userId });
    
      const addressId = orderData.addressId;
      paymentMethod = orderData.paymentMethod;
      const totalQuantity = orderData.totalQuantity;
      const grandRegularTotal = orderData.grandRegularTotal;
      const discountAmount = orderData.discountAmount;
       handlingFee = orderData.handlingFee;
       packagingFee = orderData.packagingFee;
      grandTotal = orderData.grandTotal;
      couponCode = orderData.couponCode;
      const cart=orderData.cart;
   
      //store that to session 

      req.session.paymentMethod=paymentMethod;
      req.session.addressData=await Address.findById({_id:addressId})
      //cart data
      items = req.session.cartProducts;
      
      if(couponCode)
      {
       couponData = await Coupon.findOne({ code: couponCode });
    }

if(cart)
{
      if(paymentMethod==='online payment')
         {
          
          
          let orderedItems=[]
       let couponVal = 0;

       for (let item of items) {
       let productData = await Product.findById({ _id: item.productId });
       if(item.quantity>productData.quantity)
       {
        return res.status(404).json({message:`we don't have enough stock on ${productData.productName} ,Please reduce the quantity and try again`})
       }

    // Skip out-of-stock products
       if (!productData || productData.status === "Out of Stock" || productData.quantity <= 0) {
        continue;
         }

        if (couponData) {
        couponVal=couponData.offerPrice
        userData.usedCoupons.push(couponData._id)
             }
        orderedItems.push({
        product: item.productId,
        quantity: item.quantity,
        price: productData.salePrice
         });
   
          }


        orderPayload = {
                 orderedItems,                      
                 totalPrice: grandRegularTotal,
                  handlingFee: handlingFee,
                  packagingFee: packagingFee,
                  deliveryCharge: "Free",
                  discount:discountAmount-couponVal,
                  paymentMethod: paymentMethod,
                  finalAmount:grandTotal,
                  address: addressId,
                   totalQuantity: totalQuantity,
                   invoiceDate: new Date(),
                    status: 'processing',
                   couponApplied: couponVal?couponVal:0,
                   userId: userId,
                   cartId: uniqueId,
                       };
                       newOrder=await new Order(orderPayload)
                       savedOrder=await newOrder.save()
                        
                       await User.findByIdAndUpdate(userId, { $push: { orderHistory: savedOrder._id } });
                       req.session.order=savedOrder;

            }
             else
              {
         if (couponData) {
         userData.usedCoupons.push(couponData._id);
         await userData.save();
           }
         if (!items || !Array.isArray(items)) {
          throw new Error("Cart products not found or invalid.");
         }

        for (let item of items) {
          let productData = await Product.findById({ _id: item.productId });
          if(item.quantity>productData.quantity)
            {
             return res.status(404).json({message:`we don't have enough stock on ${productData.productName} ,Please reduce the quantity and try again`})
            }

         // Skip out-of-stock products

        if (!productData || productData.status === "Out of Stock" || productData.quantity <= 0) {
         console.warn(`Skipping out-of-stock product: ${productData ? productData.productName : 'Unknown Product'}`);
         continue; // Skip this product
                }


                // removing from cart
                await Cart.findOneAndUpdate(
                  { userId: userId },
                  { $pull: { items: { productId: item.productId } } }, // Remove item matching productId
                  { new: true }
              );

        let adjustedPrice = item.totalPrice;
          let couponVal;
          handlingFee = item.quantity * 7;
           packagingFee = item.quantity * 10;

         if (couponCode) {
        let total = grandTotal + couponData.offerPrice;
         couponVal = Math.ceil((item.totalPrice / total) * couponData.offerPrice);

         adjustedPrice = item.totalPrice - couponVal;
        if (adjustedPrice < 0) {
          adjustedPrice = 0;
              }
             }
        orderedItems=[{
         product:item.productId,
         quantity:item.quantity,
         price:item.price
              }]

          orderPayload = {
                 orderedItems,                      
                 totalPrice: item.totalPrice,
                 handlingFee,
                 packagingFee,
                 deliveryCharge: "Free",
                 discount: productData.regularPrice - adjustedPrice,
                  paymentMethod: paymentMethod,
                  finalAmount: adjustedPrice + handlingFee + packagingFee,
                   address: addressId,
                  totalQuantity: item.quantity,
                  invoiceDate: new Date(),
                  status: 'processing',
                  couponApplied: couponVal ? couponVal : 0,
                   userId: userId,
                  cartId: uniqueId,
                           };
                           newOrder=await new Order(orderPayload)
                           savedOrder=await newOrder.save()
                           if(paymentMethod==='wallet')
                           {
                            savedOrder.paymentStatus=true;
                            await savedOrder.save()
                           }
                            
                           await User.findByIdAndUpdate(userId, { $push: { orderHistory: savedOrder._id } });
                           await Product.findByIdAndUpdate(
                            savedOrder.orderedItems[0].product, // Access product ID within orderedItems
                             { $inc: { quantity: -item.quantity} }, // Reduce stock by ordered quantity
                             { new: true }
                           )
                        }
                        }
}
else
{

  let couponVal=0;
  if (couponData) {
    couponVal=couponData.offerPrice
    userData.usedCoupons.push(couponData._id)
         }
  let  item=req.session.product;
  let productData=await Product.findById({_id:item._id})

  if(totalQuantity>productData.quantity)
    {
     return res.status(404).json({message:`we don't have enough stock on ${productData.productName},Please reduce the quantity and try again`})
    }
   orderedItems=[{
      product:item._id,
      quantity:totalQuantity,
      price:productData.salePrice*totalQuantity
  }]

   orderPayload={
      orderedItems:orderedItems,
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
      couponApplied: couponVal? couponVal : 0,
      userId: userId,
      uniqueId,
      
    };
    newOrder=await new Order(orderPayload)
    savedOrder=await newOrder.save()
     
    await User.findByIdAndUpdate(userId, { $push: { orderHistory: savedOrder._id } });
    req.session.order=savedOrder;
   
    if(paymentMethod!=='online payment')
    {
      await Product.findByIdAndUpdate(
         savedOrder.orderedItems[0].product, // Access product ID within orderedItems
          { $inc: { quantity: -totalQuantity } }, // Reduce stock by ordered quantity
          { new: true }
      );
    }
}


  //payment details
  if (paymentMethod === 'wallet') {

    const payment = {
      amount: grandTotal,
      paymentFlow: false,
      description: "ordered",
      status: 'debited',
      orderId: uniqueId,
      transactionId:generateTransactionId()  // Now savedOrder is defined
    };
    // Deduct the grandTotal from the wallet balance
    userWallet.balance -= grandTotal;
    userWallet.paymentHistory.push(payment);
    await userWallet.save();

    delete req.session.addressData
     delete req.session.paymentMethod;
     return res.status(201).json({
      success: true,
      payment_method: 'wallet',
      savedOrder,
      cart:cart?true:false,
      message: Array.isArray(items) && items.length > 0 
        ? "Order placed successfully from cart" 
        : "Order placed successfully for single product.",
    });
  }



  //online payment
    if (paymentMethod === 'online payment') {
      
      const razorpayOrder = await razorpay.orders.create({
        amount: grandTotal * 100, // Amount in paise
        currency: 'INR',
        receipt: `order_${uniqueId}`,
      });
      
      razorpayOrder.user_key = process.env.RAZORPAY_KEY_ID;
      
      const paymentInfo=await new Payment({
        orderId:savedOrder._id,
        razorpay_order_id:razorpayOrder.id,
      })
      await paymentInfo.save();
      return res.status(201).json({
        payment_method: 'online',
        order: razorpayOrder,
        cart,
        savedOrder,
      });
    } 
  
  
  else{
      if (couponData) {
        userData.usedCoupons.push(couponData._id);
        await userData.save();
      }
      
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
   next(error)
  }
};






const invoiceData=async(req,res,next)=>
{
  try {
    const userId = req.session.user || (req.user && req.user._id);
    const orderId=req.query.orderId;
   
    

    const orderData=await Order.findById({_id:orderId}).populate("orderedItems.product")
   const addressId=orderData.address;
   const deliveryAddressDoc = await Address.findOne({ userId: userId });
   let deliveryAddress;

   if (deliveryAddressDoc) {
       
       deliveryAddress = deliveryAddressDoc.address.find(addr => addr._id.toString() === addressId.toString());
       console.log("Delivery Address:", deliveryAddress);
   }
    
    const uuid = orderData.orderId;
    const hexString = uuid.replace(/-/g, '');
    const numericValue = BigInt("0x" + hexString);
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
    next(error)
    
  }
}


const orderPlaced=async(req,res,next)=>
{
  try {
    const orderId=req.session.order._id;
    return res.render("orderSuccess",
      {
        orderId,
      }
    )
  } catch (error) {
    next(error)
    
  }
}


  const verifyPayment=async(req,res,next)=>
  {
    try {
      const userId= req.session.user || (req.user && req.user._id);
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature,orderId} = req.body;

      const savedOrder=await Order.findById({_id:orderId})
      const paymentData=await Payment.findOne({orderId:orderId})

      let cartId;
      let uniqueId;
      let couponDiscount;
      if(savedOrder.cartId)
      {
        cartId=savedOrder.cartId
      }
      else
      {
        uniqueId=savedOrder.uniqueId;
      }

      // Generate the expected signature
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET) // Use your Razorpay key_secret
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');
    
      if (generatedSignature === razorpay_signature) {

       paymentData.status="PAID"
       await paymentData.save()
     if(savedOrder.orderedItems.length>1)
     {
     // Payment verified, proceed with splitting orders
     const orderedItems = savedOrder.orderedItems;
     const totalFinalAmount = savedOrder.finalAmount;
 
     let newOrders = [];
 
     for (let item of orderedItems) {
       const itemTotalPrice = item.price * item.quantity;
       const productData=await Product.findById(item.product)


       if(item.quantity>productData.quantity)
       {
        await User.findByIdAndUpdate(userId, {
          $pull: { orderHistory: savedOrder._id }
        });

        const deleteOrder=await Order.deleteOne({_id:savedOrder._id})
        return res.status(404).json({message:"Some items are out of stock. Your order has been canceled. Please place a new order. ",refresh:true})
       }

       // remove from cart

       await Cart.findOneAndUpdate(
        { userId: userId },
        { $pull: { items: { productId: item.product } } }, // Remove item matching productId
        { new: true }
    );

       let totalDiscount=(productData.regularPrice*item.quantity)-(productData.salePrice*item.quantity)
         if(savedOrder.couponApplied)
         {
        couponDiscount = Math.ceil((itemTotalPrice / totalFinalAmount) * savedOrder.couponApplied)
        totalDiscount+=couponDiscount
         }
         else{
           couponDiscount=0;
         }
 
       const finalAmount = (itemTotalPrice - couponDiscount)+(item.quantity*7+item.quantity*10);
 
       // Create a new order for each item
       const newOrder = new Order({
         userId: savedOrder.userId,
         orderedItems: [item], // Single item per order
         totalPrice: productData.regularPrice*item.quantity,
         handlingFee: item.quantity*7,
         packagingFee: item.quantity*10,
         deliveryCharge:"Free",
         discount:totalDiscount, // Distributed discount
         paymentMethod: savedOrder.paymentMethod,
         totalQuantity: item.quantity,
         finalAmount: finalAmount, // Final amount after discount
         address: savedOrder.address,
         invoiceDate: new Date(),
         status: "processing",
         createdOn: new Date(),
         couponApplied: couponDiscount, // Store applied coupon per item
         paymentStatus: true, // Mark as paid
         paymentId: razorpay_payment_id,
         cartId:cartId?cartId:0,
         uniqueId:uniqueId?uniqueId:0,
       });
 
       newOrders.push(newOrder);
       await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { orderHistory: savedOrder._id }
    });
        // Save new orders in bulk
        await Order.insertMany(newOrders);
        await User.findByIdAndUpdate(userId, {
          $push: { orderHistory: { $each: newOrders.map(order => order._id) } }
        });
 
        // Remove the original combined order
        await Order.findByIdAndDelete(orderId);
        return res.status(201).json({success:true,message:"payment success"})
     }else{

      if(savedOrder.cartId)
      {
        await Cart.findOneAndUpdate(
          { userId: userId },
          { $pull: { items: { productId: savedOrder.orderedItems[0].product } } }, // Remove item matching productId
          { new: true }
        )
      }

      const productData=await Product.findById(savedOrder.orderedItems[0].product)
      if(productData.quantity<savedOrder.totalQuantity)
      {
        await User.findByIdAndUpdate(userId, {
          $pull: { orderHistory: savedOrder._id }
        });
        const deleteOrder=await Order.deleteOne({_id:savedOrder._id})
        return res.status(404).json({message:"product is out of stock. Your order has been canceled. Please place a new order. ",refresh:true})
      }
      savedOrder.paymentStatus=true;
      savedOrder.paymentId= razorpay_payment_id;
      await savedOrder.save()
      await Product.findByIdAndUpdate(
        savedOrder.orderedItems[0].product,
        { $inc: { quantity: -savedOrder.totalQuantity } },
        { new: true }
      );

      return res.status(201).json({success:true,message:"payment success"})
    }
     }

     else
     {
      return res.staus(401).json({success:false,message:"payment failed"})
     }
      
    } catch (error) {
      
      next(error)
   
    }
  }



  const getRetryData=async(req,res,next)=>
  {
    try {
      const userId=req.session.user || (req.user && req.user._id);
      const orderId=req.query.orderId;
      const paymentData=await Payment.findOne({orderId:orderId})
      const orderData=await Order.findById(orderId)
      const userData=await User.findById({_id:orderData.userId})
      
      for(let item of orderData.orderedItems)
      {
        let productData=await Product.findById(item.product)
        if(item.quantity>productData.quantity)
        {
          await User.findByIdAndUpdate(userId, {
            $pull: { orderHistory: orderData._id }
          });
  
          const deleteOrder=await Order.deleteOne({_id:orderData._id})
          return res.status(404).json({message:"Some items are out of stock. Your order has been canceled. Please place a new order. ",refresh:true})
        }
      }
      if(!paymentData)
      {
        return res.status(400).json({success:false,message:"order not found"})
      }
      const newOrder = await razorpay.orders.create({
        amount: orderData.finalAmount * 100, // Convert to paise
        currency: "INR",
        receipt: `retry_${orderData._id}`,
        payment_capture: 1,
      });
      if (paymentData) {
       paymentData.razorpay_order_id = newOrder.id;
       paymentData.status = "PENDING";
        await paymentData.save();
      }
  
      return res.status(200).json({
        success: true,
        order: newOrder,
        razorpay_key: process.env.RAZORPAY_KEY_ID,
        user: {
          name: userData.name,
          email: userData.email,
          phone:userData.phone,
        },
      });
    } catch (error) {
      
      next(error)
    }
  }

module.exports=
{
    loadCheckOut,
    applyCoupon,
    placeOrder,
    invoiceData,
    orderPlaced,
    verifyPayment,
    removeCoupon,
    getRetryData
}