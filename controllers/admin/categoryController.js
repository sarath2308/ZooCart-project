const category=require("../../models/CategorySchema")





const ShowCategory=async(req,res)=>
    {
        try {
            const categoryData=await category.find({}).sort({ createdAt: -1 });
            return res.render("category",{categoryData})
        } catch (error) {
           console.log("Error occured while rendering the category page");
           res.redirect("/pageerror")
            
        }
    }
    const addCategory = async (req, res) => {
        console.log("Request received for adding a category");
    
        const { name, description } = req.body;
        console.log(name, description);
        try {
            // Check for duplicate category using case-insensitive regex
            const checkDuplicate = await category.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') }
              });
    
            if (checkDuplicate) {
                return res.json({ success: false, message: "Category already exists" });
            }
    
            const newCategory = new category({
                name: name,
                discription: description
            });
    
            await newCategory.save();
    
            return res.status(201).json({ success: true,id:newCategory._id, message: "Category added successfully" });
        } catch (error) {
            console.error("Error adding category:", error);
            return res.json({ success: false, message: "Internal Server Error" });
        }
    };
    
    const updateCategory=async(req,res)=>
    {
        console.log("req reached update");
        
        const {id,name,discription}=req.body;

        try{
            const check= await category.findOne({name,discription})
            if(check)
            {
               return res.json({success:false,message:"Category exists Chose Anther name"})
            }
            const find=await category.findByIdAndUpdate(id,{
                name:name,
                discription:discription,
            },{new:true});
        if(find)
        {
            return res.json({success:true,message:"updated"})
        }
    }
    catch(error)
    {
        console.log("error occured while updating category");
      res.status(401).json({ success: false, message: "Internal Server Error" });
        
    }
    }
    const deleteCategory=async(req,res)=>
    {
        console.log("delete function Working");
        
        const {id}=req.body;
        try
        {
            const action = await category.deleteOne({ _id: id });
             if (action.deletedCount > 0) {
             res.json({ success: true, message: "Deleted successfully" });
              } else {
           res.status(404).json({ success: false, message: "Category not found" });
               }

        }
        catch(error)
        {
       console.log("Error Ocuured while deleting Category");
       res.status(403).json({message:"Internal Server Error"})
        }
    }
    
    module.exports={
        ShowCategory,
        addCategory,
        updateCategory,
        deleteCategory
    }