const Coupon=require("../../models/couponSchema")

const loadCoupon = async (req, res ,next) => {
    try {
        const coupons = await Coupon.find().sort({createdOn:-1})

        return res.render("coupon", { data: coupons,currentPath:req.path});
    } catch (error) {
       next(error)
    }
};

const addCoupon = async (req, res,next) => {


    try {
        // Extract data from request body
        const { couponCode, offerPrice, minimumPrice, startDate, expiryOn } = req.body;
        
       let code=couponCode.trim().toUpperCase();

        // Ensure offerPrice and minimumPrice are valid numbers
        if (isNaN(offerPrice) || isNaN(minimumPrice) || offerPrice <= 0 || minimumPrice <= 0) {
            return res.status(400).json({ success: false, message: "Invalid price values" });
        }

        // Parse dates as UTC
        const parsedStartDate = new Date(startDate + "T00:00:00Z");
        const parsedExpiryOn = new Date(expiryOn + "T00:00:00Z");


        // Ensure expiry date is after start date
        if (parsedExpiryOn <= parsedStartDate) {
            return res.status(400).json({ success: false, message: "Expiry date must be after the start date" });
        }

        // Check if the coupon already exists (case-insensitive)
        const couponExists = await Coupon.findOne({ code: { $regex: new RegExp("^" + code + "$", "i") } });

        if (couponExists) {
            return res.status(400).json({ success: false, message: "Coupon already exists" });
        }

        // Create new coupon object
        const newCoupon = new Coupon({
            code: code,
            offerPrice: parseFloat(offerPrice), // Ensure numeric type
            minimumPrice: parseFloat(minimumPrice), // Ensure numeric type
            createdOn: parsedStartDate,
            expiredOn: parsedExpiryOn,
        });

        // Save the new coupon
        await newCoupon.save();

       return res.status(200).json({success:true,message:"coupon created"})
    } catch (error) {
        next(error)
    }
};


const editCoupon=async(req,res,next)=>
{
    try {
        // Extract and validate input
        const { code,couponId, offerPrice, minimumPrice, startDate, expiryOn } = req.body;
       
        // Ensure required fields are provided
        if (!code || !offerPrice || !minimumPrice || !startDate || !expiryOn) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Ensure offerPrice and minimumPrice are valid numbers
        if (isNaN(offerPrice) || isNaN(minimumPrice) || offerPrice <= 0 || minimumPrice <= 0) {
            return res.status(400).json({ success: false, message: "Invalid price values" });
        }

        // Validate date format (YYYY-MM-DD)
        const isValidDate = (dateString) => {
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            return regex.test(dateString);
        };

        if (!isValidDate(startDate) || !isValidDate(expiryOn)) {
            return res.status(400).json({ success: false, message: "Invalid date format. Use YYYY-MM-DD" });
        }

        // Parse dates as UTC
        const parsedStartDate = new Date(startDate + "T00:00:00Z");
        const parsedExpiryOn = new Date(expiryOn + "T00:00:00Z");
        console.log(parsedStartDate,parsedExpiryOn);
        

        // Ensure expiry date is after start date
        if (parsedExpiryOn <= parsedStartDate) {
            return res.status(400).json({ success: false, message: "Expiry date must be after the start date" });
        }


        const findCoupon=await Coupon.findOne({_id:couponId})
        if(findCoupon)
        {

        // Prepare coupon data
       
            findCoupon.code= code;
            findCoupon.offerPrice=offerPrice;
            findCoupon.minimumPrice=minimumPrice;
            findCoupon.createdOn=parsedStartDate;
            findCoupon.expiredOn= parsedExpiryOn,
       

        // Save the coupon
        await findCoupon.save();

        return res.redirect("/admin/coupons");
        }
    } catch (error) {
        
        next(error)
    }
}

const listCoupon=async(req,res,next)=>
{
   
    
    try {
        const {cid}=req.body;
        const findCoupon=await Coupon.findById({_id:cid})
        if(findCoupon)
        {
            findCoupon.isList=true;
            await findCoupon.save()
            res.status(200).json({success:true,message:"coupon listed"})
        }
        else
        {
            res.status(400).json({success:false,message:"coupon not found"})
        }
    } catch (error) {
        
        next(error)
    }
}

const unlistCoupon=async(req,res,next)=>
{
    try {
        const {cid}=req.body;
        const findCoupon=await Coupon.findById({_id:cid})
        if(findCoupon)
        {
            findCoupon.isList=false;
            await findCoupon.save()
            res.status(200).json({success:true,message:"coupon unlisted"})
        }
        else
        {
            res.status(400).json({success:false,message:"coupon not found"})
        }
    } catch (error) {
       
        next(error)
    }
}
module.exports={
    loadCoupon,
    addCoupon,
    editCoupon,
    listCoupon,
    unlistCoupon,
}