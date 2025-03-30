const express=require('express')
const User=require("../../models/userSchema")

const loadUsers = async (req, res,next) => {
    try {
        const users = await User.find({ isAdmin: false }).sort({CreatedOn:-1})
        return res.render("users", { users,currentPath:req.path }); 
    } catch (error) {

        next(error)
    }
};
const blockUser =  async(req,res,next)=>
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
    
    next(error)
}
}
const unblockUser =  async(req,res,next)=>
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
        
        next(error)
    }
    }
const ShowCategory=async(req,res,next)=>
{
    try {
        return res.render("category")
    } catch (error) {
        next(error)
        
    }
}
module.exports = {
    loadUsers,
    blockUser,
    unblockUser,
    ShowCategory
};
