const category=require("../../models/CategorySchema")
const Products=require("../../models/productSchema")




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
    const listCategory=async(req,res)=>
    {
        console.log("req arrived at listing category");
        
        const {id}=req.body;
        try {
            const check=await category.findOne({id,isListed:true})
            if(check)
            {
                res.status(401).json({message:"Already Listed!"})
            }
            else
            {
                const List=await category.updateOne({_id:id},{$set:{isListed:true}})
                if(List.modifiedCount>0)
                {
                    res.status(200).json({success:true,message:"Listed successfully"})
                }
                else
                {
                    res.status(401).json({message:"Sothing went wrong!.can't List this category"})
                }
            }
        } catch (error) {
          console.log("Error occured while listing category");
          res.json({message:"Internal Server Error"})
            
        }
    }
    const unlistCategory=async(req,res)=>
    {
        console.log("req arrived at unlisting category");
        
        const {id}=req.body;
        try {
            const check=await category.findOne({id,isListed:false})
            if(check)
            {
                res.status(401).json({message:"Already unlisted!"})
            }
            else
            {
                const List=await category.updateOne({_id:id},{$set:{isListed:false}})
                if(List.modifiedCount>0)
                {
                    res.status(200).json({success:true,message:"unlisted successfully"})
                }
                else
                {
                    res.status(401).json({message:"Somthing went wrong!.can't unlist this category"})
                }
            }
        } catch (error) {
          console.log("Error occured while unlisting category");
          res.json({message:"Internal Server Error"})
            
        }
    }  
    const addOffer = async (req, res) => {
        try {
          const { id, amount } = req.body;
          const categoryfind = await category.findById(id); // Find the category by ID
          if (!categoryfind) {
            return res.status(401).json({ success: false, message: "Category not Found" });
          }
      
          const allproducts = await Products.find({ category: categoryfind._id });
      
          // Check if any product in this category already has a higher offer
          const hasProductOffer = await Products.exists({
            category: categoryfind._id,
            productOffer: { $gt: amount },
          });
      
          if (hasProductOffer) {
            return res.json({
              success: false,
              message: "Products in this Category already have higher offers",
            });
          }
      
          // Update the Category Offer
          await category.updateOne({ _id: id }, { $set: { CategoryOffer: amount } });
      
          // Update products based on the category offer
          for (const product of allproducts) {
            // Only reset product offer if it is lower than the category offer
            if (product.productOffer <= amount) {
              product.productOffer = 0;
              product.salePrice = product.regularPrice;
            }
      
            await product.save();
          }
      
          return res.json({ success: true, message: "Successfully added category offer" });
        } catch (error) {
          console.log("Error while adding category offer", error);
          res.status(500).json({ success: false, message: "Internal Server Error" });
        }
      };
      
      const removeOffer = async (req, res) => {
        try {
          const { id } = req.body;
          const categoryfind = await category.findById(id);
      
          if (!categoryfind) {
            return res.status(401).json({ success: false, message: "Category not Found" });
          }
      
          const allproducts = await Products.find({ category: categoryfind._id });
      
          // Reset category offer
          await category.updateOne({ _id: id }, { $set: { CategoryOffer: 0 } });
      
          // Leave the individual product offers intact
          for (const product of allproducts) {
            // Only reset the sale price if the category offer was applied
            if (product.productOffer === categoryfind.CategoryOffer) {
              product.salePrice = product.regularPrice;
            }
            await product.save();
          }
      
          return res.json({ success: true, message: "Successfully removed category offer" });
        } catch (error) {
          console.log("Error while removing category offer", error);
          res.status(500).json({ success: false, message: "Internal Server Error" });
        }
      };
      
    module.exports={
        ShowCategory,
        addCategory,
        updateCategory,
        deleteCategory,
        listCategory,
        unlistCategory,
        addOffer,
         removeOffer,
    }
    