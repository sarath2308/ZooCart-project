const category=require("../../models/CategorySchema")
const Products=require("../../models/productSchema")




const ShowCategory=async(req,res,next)=>
    {
        try {
            const categoryData=await category.find({}).sort({ createdAt: -1 });
            return res.render("category",{categoryData,currentPath:req.path})
        } catch (error) {
        
           next(error)
            
        }
    }
    const addCategory = async (req, res,next) => {
       
    
        const { name, description } = req.body;
      
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
       
            next(error)
        }
    };
    
    const updateCategory=async(req,res)=>
    {
       
        
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
  
      next(error)
        
    }
    }

    const deleteCategory=async(req,res,next)=>
    {
        
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
    next(error)
        }
    }


    const listCategory=async(req,res,next)=>
    {
       
        
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
       next(error)
            
        }
    }


    const unlistCategory=async(req,res,next)=>
    {
       
        
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
        
         next(error)
            
        }
    }  

    const addOffer = async (req, res,next) => {
        try {
          const { id, amount } = req.body;
          const categoryfind = await category.findById(id); // Find the category by ID
          if (!categoryfind) {
            return res.status(401).json({ success: false, message: "Category not Found" });
          }
      
          const allproducts = await Products.find({ category: categoryfind._id });
      
          
      
          // Update the Category Offer
          await category.updateOne({ _id: id }, { $set: { CategoryOffer: amount } });
      
          // Update products based on the category offer
          for (const product of allproducts) {
            // Only reset product offer if it is lower than the category offer
            if (product.productOffer <= amount) {
              product.productOffer = 0;
              product.salePrice = product.salePrice-Math.floor(product.regularPrice*(amount/100));
            }
      
            await product.save();
          }
      
          return res.json({ success: true, message: "Successfully added category offer" });
        } catch (error) {
          
      next(error)
        }
      };
      
      const removeOffer = async (req, res,next) => {
        try {
          const { id } = req.body;
          const categoryfind = await category.findById(id);
      
          if (!categoryfind) {
            return res.status(401).json({ success: false, message: "Category not Found" });
          }

          const allproducts = await Products.find({ category: categoryfind._id });
      
          // Reset category offer
          await category.updateOne({ _id: id }, { $set: { CategoryOffer: 0 } });
      
          
          for (const product of allproducts) {
            // Only reset the sale price if the category offer was applied
            if (product.productOffer === 0) {
              product.salePrice = product.regularPrice;
            }
            await product.save();
          }
      
          return res.json({ success: true, message: "Successfully removed category offer" });
        } catch (error) {
          
         next(error)
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
    