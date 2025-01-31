const express=require("express")
const app=express()
const loadHomePage=async(req,res)=>
{
    try{
        return res.render('home')
    }
    catch(err)
    {
        console.log("couldn't load home page");
        res.status(500).send("Server Error")
    }
}
const pageNotFound=async(req,res)=>
{
    try{
        return res.render("page-not-found")
    }
    catch(err)
    {
       console.log("could not load page not found ");
       res.status(500).send("Server Error")
       
    }
}
module.exports={
    loadHomePage,
    pageNotFound
}