const Address=require("../../models/addressSchema")
const User=require("../../models/userSchema")
const Order=require("../../models/orderSchema.js")
const mongoose=require("mongoose")
const express=require("express")
const app=express()
const nodemailer=require("nodemailer");
const Category=require("../../models/CategorySchema.js")
const Product=require("../../models/productSchema.js")
const Brand=require("../../models/BrandSchema.js")
const env=require("dotenv").config();
const bcrypt=require("bcrypt")
const Wallet=require("../../models/walletSchema.js")
const transactionIdGenerator=require("../../helpers/transactionId.js")
const Review=require("../../models/reviewSchema.js")



function generateOtp()
{
    return Math.floor(100000+Math.random()*900000).toString();
}

async function sendVerificationEmail(email, otp) {
    try {
        // Create a transporter object using Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false, // Use `true` for port 465, `false` for all other ports
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        // Send the email
        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email, // Corrected: 'to' should be lowercase
            subject: `Verify Your Account using this OTP: ${otp}`,
            text: `hello,User We received a request to change your email with a One-Time Password (OTP). Please use the following OTP to complete the verification process,`,
            html:`<p>Dear User,</p>
               <p>We received a request to verify your identity with a One-Time Password (OTP). Please use the following OTP to complete the verification process:</p>
               <p><strong>Your OTP is: ${otp}</strong></p>
               <p>This OTP will expire in 1 minute, so please enter it promptly. If you did not request this OTP, please ignore this email.</p>
               <p>Thank you for using ZooCart.</p>
               <p>Best regards,<br>The ZooCart Team<br>[Company Address]<br>9526847469<br>zoocart.com</p>`,
        });

        // Check if the email was accepted by the recipient's server
        return info.accepted.length > 0;
    } catch (error) {
      
        return false;
    }
}

const updateProfile = async (req, res,next) => {
    try {
        // Get userId from session or req.user
        const userId = req.session.user || (req.user && req.user._id);

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const { fullName, mobile } = req.body;

        // Validate input fields
        if (!fullName || !mobile) {
            return res.status(400).json({ success: false, message: "Full name and mobile are required" });
        }

        // Update user profile
        const updateUser = await User.findByIdAndUpdate(
            userId,
            { $set: { name: fullName, phone: mobile } },
            { new: true } // Return updated document
        );

        if (!updateUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "Profile updated", user: updateUser });

    } catch (error) {
        next(error)
    }
}



const sendOtp=async(req,res,next)=>
{

    
    try {
        const userId = req.session.user || (req.user && req.user._id);
        const userData=await User.findById({_id:userId})
        let {email}=req.body;
        if(!email)
        {
            email=userData.email;
        }

            const Otp=generateOtp()
           
                    if(userData)
                    {
                    const emailSent=sendVerificationEmail(email,Otp)
                    if(emailSent)
                    {
                        console.log("Otp:"+Otp);
                        
                        req.session.userOtp=Otp;
                        req.session.otpExpiry= Date.now() + 60 * 1000;
                        return res.status(200).json({success:true,message:"Otp sent"})
                    }
                    else
                    {
                        return res.status(400).json({success:false,message:"couldn't send Email please try after some time"})
                    }
                }
        } catch (error) {
      
            next(error)
        
    }
}

const verifyOtp=async(req,res,next)=>
{
    try{
    const userId = req.session.user || (req.user && req.user._id);
        const userData=await User.findById({_id:userId})
        
       
            // Validate input
            const { otp,email,password} = req.body;
            if (!otp || typeof otp !== 'string' || otp.length !== 6) {
                return res.status(400).json({ success: false, message: "Invalid OTP format" });
            }
    
            // Validate session data
            if (!req.session.otpExpiry || !req.session.userOtp) {
                return res.status(401).json({ success: false, message: "Session expired or invalid" });
            }
            if (Date.now() > req.session.otpExpiry) {
                return res.status(402).json({ success: false, message: "OTP has expired. Please request a new one." });
            }
         
    
            const receivedOtp = otp.trim();
            const sessionOtp = req.session.userOtp.trim();
    

            if (receivedOtp === sessionOtp) {
               if(password)
               {
                const hashPassword=await bcrypt.hash(password,10)
                const updatePassword=await User.updateOne({_id:userId},{$set:{password:hashPassword}})
                if(updatePassword.modifiedCount>0)
                {
                    res.status(200).json({success:true,message:"pasword changed"})
                }
                else
                {
                    res.staus(400).json({success:false,message:"pasword change unsuccess"})
                }
               }
               else
               {
                userData.email=email;
                await userData.save();
                return res.status(200).json({ success: true, message: "email updated." });
               }
               
                
            } else {
                // Invalid OTP
                return res.status(403).json({ success: false, message: "Invalid OTP. Please try again." });
            }
        } catch (error) {
           
            next(error)
        }
    };
  
      




const addAddress = async (req, res,next) => {
    try {
       
        
        const userId = req.session.user || (req.user && req.user._id); // Get user ID from the session
        const { addressData } = req.body; // Get the address data from the request body

        addressData.userId = userId; // Add the userId to the address data
         console.log(addressData);
         
        // Find the user in the database
        const findUser = await User.findOne({ _id: userId });
        
        if (findUser) {
                if (addressData.default) {
                  await Address.updateOne(
                    { userId },
                    { $set: { "address.$[elem].default": false } },
                    { arrayFilters: [{ "elem.default": true }] }
                  );
                }
                // Then, add the new address to the user's address array...
              

            // Add the new address to the user's address array
            const addAddress = await Address.findOneAndUpdate(
                { userId },
                { $push: { address: addressData } },
                { new: true, upsert: true }
            );

            // Check if address was successfully added
            if (addAddress) {
                return res.status(201).json({ success: true, message: "Address added successfully" });
            } else {
                return res.status(401).json({ success: false, message: "Address adding failed" });
            }
        } else {
            return res.status(400).json({ success: false, message: "User not found" });
        }
    } catch (error) {
        next(error)
    }
};



const changeDefault = async (req, res,next) => {
    

    try {
        const { addressId } = req.body;

        // Validate addressId
        if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({ success: false, message: "Invalid address ID" });
        }

        // Find the address document that contains the address with the given addressId
        const addressDoc = await Address.findOne({ "address._id": addressId });

        if (!addressDoc) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // Step 1: Reset the default flag for all other addresses of the same user
        await Address.updateMany(
            { userId: addressDoc.userId }, // Match all addresses for the user
            { $set: { "address.$[elem].default": false } }, // Set default to false
            { arrayFilters: [{ "elem._id": { $ne: addressId } }] } // Exclude the selected address
        );

        // Step 2: Set the selected address as default
        await Address.updateOne(
            { "address._id": addressId }, // Match the selected address
            { $set: { "address.$.default": true } } // Set default to true
        );

        return res.json({ success: true, message: "Default address updated successfully" });

    } catch (error) {
        
        next(error)
    }
};

const editAddress = async (req, res,next) => {
  
    
    try {
        const userId = req.session.user || (req.user && req.user._id); // Get user ID from session
        const { addressData } = req.body; // Get updated address data from request body
        const  {addressId} = addressData; // Extract addressId from addressData

        if (!addressId) {
            return res.status(400).json({ success: false, message: "Address ID is required" });
        }

        // Find the address document that contains the address with the given addressId
        const addressDoc = await Address.findOne({ userId, "address._id": addressId });

        if (!addressDoc) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // Update the specific address fields
        const updatedAddress = await Address.findOneAndUpdate(
            { userId, "address._id": addressId },
            {
                $set: {
                    "address.$.addressType": addressData.addressType,
                    "address.$.name": addressData.name,
                    "address.$.city": addressData.city,
                    "address.$.landMark": addressData.landMark,
                    "address.$.state": addressData.state,
                    "address.$.pincode": addressData.pincode,
                    "address.$.phone": addressData.phone,
                    "address.$.altPhone": addressData.altPhone,
                    "address.$.default": addressData.default || false
                }
            },
            { new: true }
        );

        if (!updatedAddress) {
            return res.status(500).json({ success: false, message: "Failed to update address" });
        }

        // If the updated address is set as default, reset other addresses to non-default
        if (addressData.default) {
            await Address.updateMany(
                { userId, "address._id": { $ne: addressId } },
                { $set: { "address.$[elem].default": false } },
                { arrayFilters: [{ "elem._id": { $ne: addressId } }] }
            );
        }

        return res.json({ success: true, message: "Address updated successfully" });
    } catch (error) {
       
        next(error)
    }
};





const deleteAddress = async (req, res,next) => {
    try {
        const userId = req.session.user || (req.user && req.user._id);
         // Get user ID from session
        const { addressId } = req.body; // Extract addressId from request body

        if (!addressId) {
            return res.status(400).json({ success: false, message: "Address ID is required" });
        }

        // Find the user's address document that contains the address
        const addressDoc = await Address.findOne({ userId });

        if (!addressDoc) {
            return res.status(404).json({ success: false, message: "User address not found" });
        }

        // Find the address to be deleted
        const addressToDelete = addressDoc.address.find(addr => addr._id.toString() === addressId);
        if (!addressToDelete) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // Remove the address from the array
        const updatedAddresses = addressDoc.address.filter(addr => addr._id.toString() !== addressId);

        // If the deleted address was the default, assign a new default if available
        if (addressToDelete.default && updatedAddresses.length > 0) {
            updatedAddresses[0].default = true; // Set the first available address as default
        }

        // Update the address document
        await Address.updateOne({ userId }, { $set: { address: updatedAddresses } });

        return res.json({ success: true, message: "Address deleted successfully" });

    } catch (error) {
       
        next(error)
    }
};
 const orderDetails=async(req,res,next)=>
 {
    try {
      
        
        const userId= req.session.user || (req.user && req.user._id);
        const userData=await User.findById({_id:userId})
        const orderId=req.query.orderId;
        const orderData=await Order.findById({_id:orderId}).populate("orderedItems.product")
       
        const reviewData=await Review.findOne({orderId})
        
        const addressId=orderData.address;
        const addressData=await Address.findOne({userId:userId})
        let deliveryAddress;
     
        if (addressData) {
            deliveryAddress = addressData.address.find(addr => addr._id.toString() === addressId.toString());
        }
        
        if(!orderData)
        {
            return res.status(401).json({success:false,message:"error occured"
            })
        }
        let readableOrderId ;
        if (orderData && orderData.orderId) {  // Ensure orderData and orderId exist
            const hexString = orderData.orderId.replace(/-/g, ""); // Remove dashes
             readableOrderId = BigInt("0x" + hexString).toString(); // Convert to number
        }
        

        return res.status(200).render("orderDetails",
            {
                orderData,
                userData,
                readableId:readableOrderId,
                deliveryAddress,
                reviewData
            }
        )
        
    } catch (error) {
        
        next(error)
    }
 }

 const cancelOrder=async(req,res,next)=>
 {

    try {
        const { orderId } = req.body;
        const userId= req.session.user || (req.user && req.user._id);
        const wallet=await Wallet.findOne({userId:userId})
        let uniqueId;

        

        // Find the order by ID
        const orderData = await Order.findById(orderId).populate("orderedItems.product");

        if (!orderData) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // If the order is being canceled, add the ordered quantity back to the product stock

           
                const product =await Product.findById({_id:orderData.orderedItems[0].product._id})
                if (product) {
                    product.quantity += orderData.totalQuantity;
                    await product.save();
                }
              if(orderData.cartId)
              {
               uniqueId=orderData.cartId
              }
              else
              {
               uniqueId=orderData.uniqueId;
              }
                if(wallet)
                    {
                        const payment={
                            amount:orderData.finalAmount,
                            paymentFlow:true,
                            description:"order refund",
                            status:'credited',
                            orderId:uniqueId,
                            transactionId:transactionIdGenerator.generateTransactionId()
                        }
                        wallet.balance+=orderData.finalAmount;
                        wallet.paymentHistory.push(payment)
                        await wallet.save()
                    }
                    else
                    {
                    const payment={
                        amount:orderData.finalAmount,
                        paymentFlow:true,
                        description:"order refund",
                        status:'credited',
                        orderId:uniqueId,
                        transactionId:transactionIdGenerator.generateTransactionId()
                    }
                    const newWallet=new Wallet({
                        userId:userId,
                        balance:orderData.finalAmount,
                        paymentHistory:payment,
                    })

                    const walletCreated=await newWallet.save()
                }

        // Update order status
        orderData.status ="cancelled";
        await orderData.save();

        return res.status(200).json({ success: true, message: "Order cancelled" });
    } catch (error) {
        
        next(error)
    }
 }

 const returnOrder=async(req,res,next)=>
 {
   
    try {
        const { orderId,reason} = req.body;

      

        // Find the order by ID
        const orderData = await Order.findById(orderId).populate("orderedItems.product");

        if (!orderData) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // If the order is being canceled, add the ordered quantity back to the product stock


        // Update order status
        orderData.status ="Return Request";
        orderData.returnReason=reason;
        await orderData.save();

        return res.status(200).json({ success: true, message: "Return request accepted" });
    } catch (error) {
        
        next(error)
    }

 }



 const addReview=async(req,res,next)=>
 {
  try {
    const userId= req.session.user || (req.user && req.user._id);
    const {rating,review,orderId}=req.body;

    const orderData=await Order.findById(orderId)
    if(!orderData)
    {
        return res.status(404).json({success:false,message:"order not found"})
    }
    const newReview=await new Review({
        userId,
        rating,
        review,
        productId:orderData.orderedItems[0].product,
        orderId

    })
    await newReview.save()

    return res.status(200).json({success:true,message:"review added"})

  } catch (error) {
   
    next(error)
    
  }
 }


 const editReview=async(req,res,next)=>
 {
    try {
        const {orderId,rating,review,id}=req.body;
        const orderData=await Order.findById(orderId)
        if(!orderData)
        {
            return res.status(404).json({success:false,message:"order not found"})
        }
        const reviewData=await Review.findById(id)
        reviewData.rating=rating;
        reviewData.review=review;
        await reviewData.save()

        return res.status(200).json({success:true,message:"review edited"})
    } catch (error) {
      next(error)
    }
 }
const userDetails=async(req,res,next)=>
{
    try {
        const userId= req.session.user || (req.user && req.user._id);
        const userData=await User.findById(userId)
        const defaultAddress = await Address.findOne(
            { userId, "address.default": true },
            { address: { $elemMatch: { default: true } } } // Fetch only the first matching address
          );
          
          const TotalOrder=await Order.countDocuments({userId})

          const totalAmountSpent = await Order.aggregate([
            {
              $match: { userId: new mongoose.Types.ObjectId(userId), paymentStatus: true }
            },
            {
              $group: {
                _id: "$userId",
                totalSpent: { $sum: "$finalAmount" }
              }
            }
          ]);
          let totalSpent = totalAmountSpent.length > 0 ? totalAmountSpent[0].totalSpent : 0;
          totalSpent=Math.ceil(totalSpent)

          const pendingOrders = await Order.countDocuments({
            userId,
            status: "processing",
          });
          
          const returnedOrders = await Order.countDocuments({
            userId,
            status: "Returned",
          });
          
        
          
          
      const latestOrder=await Order.find({userId}).limit(3)
                    
        return res.status(200).render("userDetails",
            {
                userData,
                defaultAddress,
                TotalOrder,
                totalSpent,
                pendingCount:pendingOrders?pendingOrders:0,
                returnCount:returnedOrders?returnedOrders:0,
                latestOrder
            }
        )
    } catch (error) {
      
        next(error)
        
    }
}

const editUserDetails=async(req,res,next)=>
{
    try {
        const userId= req.session.user || (req.user && req.user._id);
        const userData=await User.findById(userId)
    
        return res.status(200).render("editUserDetails",
            {
                userData
    })
    } catch (error) {
       
        next(error)
        
    }
}

const changeEmail=async(req,res,next)=>
{
    try {
        const userId= req.session.user || (req.user && req.user._id);
        const userData=await User.findById(userId)
      if(!userData)
      {
        throw new Error("user not found")
      }
        return res.status(200).render("updateEmail",{
            userData
        })
    } catch (error) {
      
        next(error)
        
    }
}

const changePassword=async(req,res,next)=>
    {
        try {
            const userId= req.session.user || (req.user && req.user._id);
            const userData=await User.findById(userId)
          if(!userData)
          {
            throw new Error("user not found")
          }
            return res.status(200).render("changePassword",{
                userData
            })
        } catch (error) {
         
            next(error)
            
        }
    }
    

    const loadOrders=async(req,res,next)=>
    {
        try {
            const userId= req.session.user || (req.user && req.user._id);
            const data=await User.findById(userId)
            const orders = await Order.find({ _id: { $in: data.orderHistory } })
            .populate("address") 
            .populate({
              path: "orderedItems.product", 
              model: "Product",
            }).sort({createdOn:-1})
            let ordersWithReadableId =[]
          if(orders!==null)
          {
          ordersWithReadableId = orders.map((order) => {
            if (order.orderId) {
              const hexString = order.orderId.replace(/-/g, "");
          
              order.readableOrderId = BigInt("0x" + hexString).toString();
            }
            return order;
          });
        }
        return res.status(200).render("orders",
            {
                orders: ordersWithReadableId ?  ordersWithReadableId :null,
                userData:data,
            }
        )
        } catch (error) {
            next(error)
        }
    }

const loadWallet=async(req,res,next)=>
{
    try {
        const userId= req.session.user || (req.user && req.user._id);
  
        // Fetch user details
        const data = await User.findOne({ _id: userId });

        const userWallet = await Wallet.findOne({ userId: userId }).lean();
  
  if (userWallet && userWallet.paymentHistory) {
      userWallet.paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
      
     return res.status(200).render("wallet",
        {
           wallet:userWallet,
           data 
        }
     )
    
    } catch (error) {
        next(error)
    }
}

const loadAddress = async (req, res, next) => {
    try {
      const userId = req.session.user || (req.user && req.user._id);
      if (!userId) {
        const error = new Error("User not authenticated");
        error.status = 401;
        return next(error);
      }
  
      const addressData = await Address.findOne({ userId: userId });
  
      return res.status(200).render("address", {
        addressData
      });
  
    } catch (error) {
      next(error); // Passes error to the error-handling middleware
    }
  };
  
module.exports=
{
    updateProfile,
    sendOtp,
    verifyOtp,
    addAddress,
    changeDefault,
    editAddress,
    deleteAddress,
    orderDetails,
    cancelOrder,
    returnOrder,
    addReview,
    editReview,
    userDetails,
    editUserDetails,
    changeEmail,
    changePassword,
    loadOrders,
    loadWallet,
    loadAddress
};