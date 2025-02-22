const Address=require("../../models/addressSchema")
const User=require("../../models/userSchema")
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
async function updateEmail(email, otp) {
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
            to: email, 
            subject: `Confirm Your Email Update with OTP: ${otp}`,
            html: `
                <p>Dear User,</p>
                <p>We received a request to update your email address. To complete the verification process, please enter the following One-Time Password (OTP):</p>
                <p style="font-size: 18px; font-weight: bold;">Your OTP: ${otp}</p>
                <p>This OTP will expire in 1 minute. If you did not request this change, please ignore this email.</p>
                <p>Thank you for using ZooCart.</p>
                <hr>
                <p>Best regards,<br>
                <strong>The ZooCart Team</strong><br>
                [Company Address]<br>
                9526847469<br>
                <a href="https://zoocart.com" style="color: #007bff; text-decoration: none;">zoocart.com</a></p>
            `,
        });
        

        // Check if the email was accepted by the recipient's server
        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
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

async function forgotEmail(email, otp) {
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
            to: email,
            subject: `Reset Your Password using this OTP: ${otp}`,
            text: `Hello User,\n\nWe received a request to reset your password. Please use the following One-Time Password (OTP) to reset your password:\n\nYour OTP is: ${otp}\n\nThis OTP will expire in 1 minute. If you did not request a password reset, please ignore this email.\n\nThank you for using ZooCart.\n\nBest regards,\nThe ZooCart Team\n[Company Address]\n9526847469\nzoocart.com`,
            html: `<p>Dear User,</p>
                   <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to reset your password:</p>
                   <p><strong>Your OTP is: ${otp}</strong></p>
                   <p>This OTP will expire in 1 minute. If you did not request a password reset, please ignore this email.</p>
                   <p>Thank you for using ZooCart.</p>
                   <p>Best regards,<br>The ZooCart Team<br>[Company Address]<br>9526847469<br>zoocart.com</p>`
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
        const id=req.session.user
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
    try {
        const {email}=req.body;
        const findUser=await User.findOne({email:email})
        if(findUser)
        {
            const Otp=generateOtp()
            const emailSent=sendVerificationEmail(email,Otp,findUser.name)
            if(emailSent)
            {
                console.log(Otp);
                
                req.session.userOtp=Otp;
                req.session.otpExpiry= Date.now() + 60 * 1000;
                res.json({success:true,message:"Otp sent"})
            }
            else
            {
                return res.json({success:false,message:"couldn't send Email please try after some time"})
            }
        }
        else
        {
            res.json({success:false,message:"Invalid User"})
        }
    } catch (error) {
       console.log("error occured while sending otp for changing the mail");
        
    }
}

const verifyOtp=async(req,res)=>
{
        try {
            console.log("Inside verify OTP");
    
            // Validate input
            const { otp,verify } = req.body;
            if (!otp || typeof otp !== 'string' || otp.length !== 6) {
                return res.status(400).json({ success: false, message: "Invalid OTP format" });
            }
    
            // Validate session data
            if (!req.session.otpExpiry || !req.session.userOtp || !req.session.user) {
                return res.status(400).json({ success: false, message: "Session expired or invalid" });
            }
            if (Date.now() > req.session.otpExpiry) {
                return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
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
             if(verify)
             {
                const email=req.session.newEmail;
                const updateUser=await User.updateOne({_id:req.session.user},{$set:{email:email}})
                if(updateUser.modifiedCount >0)
                {
                    return res.json({success:true,message:"email updated successfully"})
                }
             }
                // Respond with success
                return res.json({ success: true, message:"otp verification successs" });
            } else {
                // Invalid OTP
                return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
            return res.status(500).json({ success: false, message: "An error occurred. Please try again later." });
        }
    };
    // const resendOtp = async (req, res) => {
    //     try {
    //         if (!req.session.user) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: "User data or email not found in session. Please log in again."
    //             });
    //         }

    //         const  email= req.session.userData;
    //         console.log(`Resending OTP to email: ${email}`);
    
    //         const newOtp = generateOtp();
    //         req.session.userOtp = newOtp;
    
    //         const resendMail = await forgotEmail(email, newOtp);
            
    //         if (resendMail) {
    //             console.log(`Resend OTP: ${newOtp}`);
    //             return res.status(200).json({ success: true, message: "OTP resent successfully." });
    //         } else {
    //             return res.status(500).json({ success: false, message: "Failed to send OTP." });
    //         }
    //     } catch (error) {
    //         console.error("Error resending OTP:", error);
    //         return res.status(500).json({ success: false, message: "Internal server error. Please try again." });
    //     }
    // };

const newEmailOtp=async(req,res)=>
{
    console.log("inside new Email Otp");
    
    try {
        const {email}=req.body;
        console.log(email);
        
        const findUser=await User.findOne({_id:req.session.user})
        if(findUser)
        {
            const Otp=generateOtp()
            const emailSent=updateEmail(email,Otp)
            if(emailSent)
            {
                console.log(Otp);
                
                req.session.userOtp=Otp;
                req.session.newEmail=email;
                req.session.otpExpiry= Date.now() + 60 * 1000;
                res.json({success:true,message:"Otp sent"})
            }
            else
            {
                return res.json({success:false,message:"couldn't send Email please try after some time"})
            }
        }
        else
        {
            res.json({success:false,message:"Invalid User"})
        }
    } catch (error) {
        console.log(error);
    }
}


const newPassword=async(req,res)=>
{
    try {
        const {password}=req.body;
        const userId=req.session.user;
        const findUser=await User.findOne({_id:userId})
        if(findUser)
        {
            const hashPassword=await bcrypt.hash(password,10)
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
        
        const userId = req.session.user; // Get user ID from the session
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

module.exports=
{
    updateProfile,
    addPhone,
    sendOtp,
    verifyOtp,
    newEmailOtp,
    newPassword,
    addAddress,
    changeDefault,
    editAddress,
    deleteAddress,
};