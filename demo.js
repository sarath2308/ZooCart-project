const placeOrder = async (req, res) => {
  try {
    console.log("req arrived at place order");
    
    const userId = req.session.user || (req.user && req.user._id);
    const userData = await User.findById({ _id: userId });
  
    
    const orderData = req.body;
    let newOrder;
    let items;
    let paymentMethod;
    let grandTotal;
    let couponCode;
    let orderedItems;
    
    const userWallet = await Wallet.findOne({ userId: userId });
    
      const addressId = orderData.addressId;
      paymentMethod = orderData.paymentMethod;
      const totalQuantity = orderData.totalQuantity;
      const grandRegularTotal = orderData.grandRegularTotal;
      const discountAmount = orderData.discountAmount;
      const coupon = orderData.coupon;
      const handlingFee = orderData.handlingFee;
      const packagingFee = orderData.packagingFee;
      grandTotal = orderData.grandTotal;
      couponCode = orderData.couponCode;
      const cart=orderData.cart;
      if(couponCode)
      {
      const couponData = await Coupon.findOne({ code: couponCode });
      if (couponData) {
        if (userData.usedCoupons.includes(couponData._id)) {
          throw new Error("Coupon already used");
        }
        userData.usedCoupons.push(couponData._id);
        await userData.save();
      }
    }
      if (cart){

 // Cart order: multiple products
    items = req.session.cartProducts;
 if (!items || !Array.isArray(items)) {
   throw new Error("Cart products not found or invalid.");
 }
 
 // Here, we divide the total discount among the distinct products in the cart.
 const numProducts = items.length;
 const couponPerUnit = couponData ? couponData.offerPrice / numProducts : 0;
 
 // Create a separate order for each product in the cart
 for (let item of items) {
   // Adjust the sale price by subtracting the per-unit discount
   let adjustedPrice = item.salePrice- couponPerUnit;
   if (adjustedPrice < 0) {
     adjustedPrice = 0;
   }
   
   let orderPayload = {
     // We store a single product order inside an array
     orderedItems:{
       product: item.productId,
       quantity: item.quantity,
       price: item.salePrice
     },
     totalPrice: item.regularPrice,  // You might want to recalculate this per product if needed.
     handlingFee: 7*item.quantity,
     packagingFee: 10*item.quantity,
     deliveryCharge: "Free",
     discount: discountAmount, // Total discount from coupon (optional: recalc per order)
     paymentMethod: paymentMethod,
     finalAmount: adjustedPrice,  // Alternatively, recalc per order: (adjustedPrice * quantity + fees, etc.)
     address: addressId,
     totalQuantity: item.quantity,  // Quantity for this product
     invoiceDate: new Date(),
     status: 'processing',
     couponApplied: couponPerUnit, // Discount applied to this order
     userId: userId,
   };
   
   const newOrder = new Order(orderPayload);
   const savedOrder = await newOrder.save();
   
   // Decrement product stock for this product
   await Product.findByIdAndUpdate(
     item.productId,
     { $inc: { quantity: -item.quantity } },
     { new: true }
   );
 }
 
 // Update user's order history with all orders
 for (let order of savedOrders) {
   await User.findByIdAndUpdate(userId, { $push: { orderHistory: order._id } });
 }
 
 req.session.order = savedOrders;
 
 return res.status(201).json({
   success: true,
   payment_method: paymentMethod === 'online payment' ? 'online' : 'cod',
   savedOrders,
   cart: true,
   message: "Order placed successfully from cart."
 });
 








        }));
      }else{
        items=req.session.product;
        orderedItems ={
          product:items._id,
          quantity: totalQuantity,
          price:items.salePrice
        }
      }
      
      // Create new order without a wallet field (or wallet set to null)
      newOrder = new Order({
        orderedItems: orderedItems,
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
        wallet: null // Ensure wallet is not defaulted to 0
      });

   
    // Save the order first to get the savedOrder._id
    const savedOrder = await newOrder.save();
    req.session.order = savedOrder;

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
      newOrder.paymentStatus = true;
    }
    
    // If online payment, create Razorpay order
    if (paymentMethod === 'online payment') {
      const razorpayOrder = await razorpay.orders.create({
        amount: grandTotal * 100, // Amount in paise
        currency: 'INR',
        receipt: `order_${savedOrder._id}`,
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
      for (let item of savedOrder.orderedItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: -item.quantity } },
          { new: true }
        );
      }
      
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



