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



function generateOtp()
{
    return Math.floor(100000+Math.random()*900000).toString();
}

async function sendVerificationEmail(email, otp,name) {
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
            text: `hello,${name}We received a request to change your email with a One-Time Password (OTP). Please use the following OTP to complete the verification process,`,
            html:`<p>Dear ${name},</p>
               <p>We received a request to verify your identity with a One-Time Password (OTP). Please use the following OTP to complete the verification process:</p>
               <p><strong>Your OTP is: ${otp}</strong></p>
               <p>This OTP will expire in 1 minute, so please enter it promptly. If you did not request this OTP, please ignore this email.</p>
               <p>Thank you for using ZooCart.</p>
               <p>Best regards,<br>The ZooCart Team<br>[Company Address]<br>9526847469<br>zoocart.com</p>`,
        });

        // Check if the email was accepted by the recipient's server
        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

const updateProfile=async(req,res)=>
{
    try {
        const id=req.session.user;
        const {name,email,phone}=req.body;
        const user=await User.findOne({_id:id});
       if(user)
       {
        const updateUser= await User.updateOne({_id:id},{$set:{name:name,phone:phone}})
        if(updateUser.modifiedCount >0)
        {
            res.json({success:true,message:"updated"})
        }
        else
        {
            res.json({success:false,message:"could not update"})
        }
       }
       else
       {
        res.json({success:false,message:"user Not found"})
       }
      
    } catch (error) {
        console.log("error occured while updating user"+error);
        
    }
}

const addPhone=async(req,res)=>
{
    try {
        const {phone}=req.body;
        const id=req.session.user ||req.user._id;
        const findUser=await User.findOne({_id:id})
        if(findUser)
        {
            findUser.phone=phone;
            await findUser.save();
            return res.status(201).json({success:true,message:"phone Number added"})
        }
        else
        {
            return res.status(401).json({success:false,message:"We could not find Your details"})
        }
    } catch (error) {
        console.log("error occured while adding phone"+error);
       return res.redirect("/page-not-found") 
       
    }
}


const sendOtp=async(req,res)=>
{
    console.log("req inside sendOtp");
    
    try {
        const userId = req.session.user || (req.user && req.user._id);
        const userData=await User.findById({_id:userId})
        const {email}=req.body;
        const otpType=req.params.otpType;
            const Otp=generateOtp()
            if(otpType==='existingEmail')
                {
                    if(userData)
                    {
                        proceed(email,Otp,userData.name)
                    }
                }
                else if(otpType ==='newEmail')
                {
                    proceed(email,Otp,"User")   
                }
                else
                {
                    proceed(email,Otp,userData.name)
                }
                function proceed(email,Otp,name)
                {
                    const emailSent=sendVerificationEmail(email,Otp,name)
                    if(emailSent)
                    {
                        console.log("Otp:"+Otp);
                        
                        req.session.userOtp=Otp;
                        req.session.otpExpiry= Date.now() + 60 * 1000;
                        return res.status(200).json({success:true,message:"Otp sent"})
                    }
                    else
                    {
                        return res.json({success:false,message:"couldn't send Email please try after some time"})
                    }
                }
        } catch (error) {
       console.log("error occured while sending "+error);
        
    }
}

const verifyOtp=async(req,res)=>
{
        try {
            console.log("Inside verify OTP");
            const otpType=req.params.otpType;
            // Validate input
            const { otp} = req.body;
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
            // Log session and received OTP for debugging
            console.log("Session OTP:", req.session.userOtp);
            console.log("Received OTP:", otp);
            console.log("Session OTP Type:", typeof req.session.userOtp);
            console.log("Received OTP Type:", typeof otp);
    
            // Trim and normalize OTP
            const receivedOtp = otp.trim();
            const sessionOtp = req.session.userOtp.trim();
    
            // Verify OTP
            if (receivedOtp === sessionOtp) {
               
                delete req.session.userOtp;
                  if(otpType==='existingEmail')
                  {
                      return res.status(200).json({success:"true",message:"otp verification success"})
                  }
                  else if(otpType ==='newEmail')
                  {
                        return res.status(200).json({success:true,message:"new Email verification success"})
                  }
                  else
                  {
                         return res.status(200).json({success:true,message:"otp for new password verification success"})
                  }
            } else {
                // Invalid OTP
                return res.status(403).json({ success: false, message: "Invalid OTP. Please try again." });
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
            return res.status(500).json({ success: false, message: "An error occurred. Please try again later." });
        }
    };
    const updateEmail = async (req, res) => {
        try {
          // Get the userId from either session or Passport's req.user
          const userId = req.session.user || (req.user && req.user._id);
          const { newEmail } = req.body;
          
          if (!newEmail) {
            return res.status(400).json({ success: false, message: "New email is required." });
          }
          
          // Update the user's email
          const result = await User.findByIdAndUpdate(
            userId,
            { $set: { email: newEmail } },
            { new: true }  // Return the updated document
          );
          
          // Check if update was successful
          if (result) {
            return res.status(200).json({ success: true, message: "Email updated successfully." });
          } else {
            return res.status(400).json({ success: false, message: "Email not updated." });
          }
        } catch (error) {
          console.error("Error occurred while updating email:", error);
          return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
      };
      
      
    const resendOtp = async (req, res) => {
        console.log("inside resend otp");
        const {email}=req.body;
        console.log("email:"+email);
        try {

            const userId = req.session.user || (req.user && req.user._id);
            const userData=await User.findById({_id:userId})
            
                const Otp=generateOtp()
                
                        const emailSent=sendVerificationEmail(email,Otp,userData.name)
                        if(emailSent)
                        {
                            console.log("Otp:"+Otp);
                            console.log(email);
                            
                            
                            req.session.userOtp=Otp;
                            req.session.otpExpiry= Date.now() + 60 * 1000;
                            return res.status(200).json({success:true,message:"Otp sent"})
                        }
                        else
                        {
                            return res.json({success:false,message:"couldn't send Email please try after some time"})
                        }
                    }
               catch (error) {
            console.error("Error resending OTP:", error);
            return res.status(500).json({ success: false, message: "Internal server error. Please try again." });
        }
    };



const newPassword=async(req,res)=>
{
    try {
        const {newPassword}=req.body;
        const userId = req.session.user || (req.user && req.user._id);
        const findUser=await User.findOne({_id:userId})
        if(findUser)
        {
            const hashPassword=await bcrypt.hash(newPassword,10)
            const updatePassword=await User.updateOne({_id:userId},{$set:{password:hashPassword}})
            if(updatePassword.modifiedCount>0)
            {
                res.json({success:true,message:"pasword changed"})
            }
            else
            {
                res.staus(400).json({success:false,message:"pasword change unsuccess"})
            }
        }
        else
        {
            res.status(400).json({success:false,message:"user not found in the session"})
        }

    } catch (error) {
        console.log("errror occured while updating  Password"+error);
        
    }
}

const addAddress = async (req, res) => {
    try {
        console.log("req arrived at add address");
        
        const userId = req.session.user || req.user._id; // Get user ID from the session
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
        console.log("Error occurred while adding address: " + error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



const changeDefault = async (req, res) => {
    console.log("Inside change default");

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
        console.error("Error while updating default address:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const editAddress = async (req, res) => {
    console.log("inside edit address");
    
    try {
        const userId = req.session.user; // Get user ID from session
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
        console.error("Error while updating address:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};





const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.user; // Get user ID from session
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
        console.error("Error deleting address:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
 const orderDetails=async(req,res)=>
 {
    try {
        console.log("req arrived at order Details");
        
        const userId= req.session.user || (req.user && req.user._id);
        const userData=await User.findById({_id:userId})
        const orderId=req.query.orderId;
        const orderData=await Order.findById({_id:orderId}).populate("orderedItems.product")
        const addressId=orderData.address;
        const addressData=await Address.findOne({userId:userId})
        let deliveryAddress;
     
        if (!addressData) {
            console.log("No address found for this user.");
        } else {
            deliveryAddress = addressData.address.find(addr => addr._id.toString() === addressId.toString());
            console.log("Delivery Address:", deliveryAddress);
        }
        
        
        console.log(orderData);
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
            }
        )
        
    } catch (error) {
        console.log("error occured while rendering orderDetails"+error);
        
        return res.redirect("/page-not-found")
    }
 }

 const cancelOrder=async(req,res)=>
 {

    try {
        const { orderId } = req.body;

        console.log("Request received to update order status");

        // Find the order by ID
        const orderData = await Order.findById(orderId).populate("orderedItems.product");

        if (!orderData) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // If the order is being canceled, add the ordered quantity back to the product stock

            for (let item of orderData.orderedItems) {
                const product = item.product;
                if (product) {
                    product.quantity += item.quantity;
                    await product.save();
                }
            }

        // Update order status
        orderData.status ="cancelled";
        await orderData.save();

        return res.status(200).json({ success: true, message: "Order cancelled" });
    } catch (error) {
        console.error("Error occurred while changing the status:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
 }

 const returnOrder=async(req,res)=>
 {
   
    try {
        const { orderId,reason} = req.body;

        console.log("Request received to return Ordrer");

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
        console.error("Error occurred while changing the status:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }

 }
module.exports=
{
    updateProfile,
    addPhone,
    sendOtp,
    verifyOtp,
    newPassword,
    addAddress,
    changeDefault,
    editAddress,
    deleteAddress,
    updateEmail,
    orderDetails,
    cancelOrder,
    resendOtp,
    returnOrder,
};