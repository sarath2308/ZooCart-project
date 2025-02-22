const Banner=require("../../models/bannerSchema")
const path=require("path");
const fs=require('fs');


const loadBannerPage=async(req,res)=>
{
    try {
        const banners=await Banner.find({})
        return res.render("banners",
            {
                data:banners,
            }
        )
    } catch (error) {
        console.log("error occured while laoding the banner page"+error);
        return res.redirect("/admin/pageerror")
        
    }
}
module.exports={
    loadBannerPage,
}