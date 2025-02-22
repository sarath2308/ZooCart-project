const Coupon=require("../../models/couponSchema")

const loadCoupon = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({createdOn:-1})

        return res.render("coupon", { data: coupons });
    } catch (error) {
        console.log("Error occurred while loading the coupon management", error);
    }
};

const addCoupon = async (req, res) => {
    try {
        // Extract and validate input
        const { code, offerPrice, minimumPrice, startDate, expiryOn } = req.body;
        console.log(code, offerPrice, minimumPrice, startDate, expiryOn);

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

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code: code });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: "Coupon code already exists" });
        }

        // Prepare coupon data
        const newCoupon = new Coupon({
            code: code,
            offerPrice: offerPrice,
            minimumPrice: minimumPrice,
            createdOn: parsedStartDate,
            expiredOn: parsedExpiryOn,
        });

        // Save the coupon
        await newCoupon.save();

        return res.redirect("/admin/coupons");
    } catch (error) {
        console.error("Error occurred while adding coupon:", error);
        res.redirect("/admin/pageerror");
    }
};

const editCoupon=async(req,res)=>
{
    try {
        // Extract and validate input
        const { code,couponId, offerPrice, minimumPrice, startDate, expiryOn } = req.body;
        console.log(code, offerPrice, minimumPrice, startDate, expiryOn);
       console.log("coupon id for edit:"+couponId);
       
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
        console.error("Error occurred while adding coupon:", error);
        res.redirect("/admin/pageerror");
    }
}

const listCoupon=async(req,res)=>
{
    console.log("req arrived at coupon listing");
    
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
        console.log("errror occured while listing");
        res.redirect("/admin/pageerror")
    }
}

const unlistCoupon=async(req,res)=>
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
        console.log("errror occured while unlisting coupon"+error);
        res.redirect("/admin/pageerror")
    }
}
module.exports={
    loadCoupon,
    addCoupon,
    editCoupon,
    listCoupon,
    unlistCoupon,
}