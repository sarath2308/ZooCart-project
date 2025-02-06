const express=require('express')
const User=require("../../models/userSchema")
const loadUsers = async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false }).sort({CreatedOn:-1})
        return res.render("users", { users }); 
    } catch (error) {
        console.error("Error in showing all users:", error);
        return res.status(500).send("Internal Server Error"); 
    }
};
const blockUser =  async(req,res)=>
{
 try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
        return res.json({ success: false, message: 'User not found.' });
    }
    
    user.isBlocked = true;
    await user.save();
    return res.redirect('/admin/users')
} catch (error) {
    console.error(error);
    return res.json({ success: false, message: 'Error while blocking the user.' });
}
}
const unblockUser =  async(req,res)=>
    {
     try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.json({ success: false, message: 'User not found.' });
        }
        
        user.isBlocked = false;
        await user.save();
        return res.redirect('/admin/users')
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: 'Error while blocking the user.' });
    }
    }
const ShowCategory=async(req,res)=>
{
    try {
        return res.render("category")
    } catch (error) {
       console.log("Error occured while rendering the category page");
        
    }
}
module.exports = {
    loadUsers,
    blockUser,
    unblockUser,
    ShowCategory
};
