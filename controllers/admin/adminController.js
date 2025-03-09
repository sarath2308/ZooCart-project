const express=require("express")
const app=express()
const User=require("../../models/userSchema")
const Order=require("../../models/orderSchema")
const mongoose=require('mongoose')
const bcrypt=require("bcrypt")


const pageerror=async(req,res)=>
{
   return res.render("pageerror");
}

const loginPage = async (req, res) => {
    try {
      if (req.session.admin) {
        return res.redirect('/admin');  // If session exists, redirect to admin page
      }
  
      console.log("Inside login");
      res.render('adminlogin', { message: '' });  // Render login page with an empty message
    } catch (error) {
      console.error("Error occurred: Can't render admin login", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
const login = async (req, res) => {
    console.log("inside post login");
    
    const { email, password } = req.body;
    console.log(email, password);
   
    try {
        // Await the result of the find query
        const findAdmin = await User.findOne({ email: email, isAdmin: true });

        if (findAdmin) {
            console.log("find admin true");
            
            const passwordCheck = await bcrypt.compare(password, findAdmin.password);
            if (passwordCheck) {
                console.log("password check true");
                
                req.session.admin = findAdmin._id;
                return res.redirect('/admin');
            } else {
                return res.status(401).render("adminlogin", { message: "Incorrect Password" });
            }
        } else {
            return res.status(401).render("adminlogin", { message: "Incorrect Email" });
        }
    } catch (error) {
        console.log("Error occurred while validating Admin login");
        console.error(error);
        return res.status(500).render("adminlogin", { message: "An error occurred, please try again later." });
    }
};

const loadDashboard=async(req,res)=>
{
    try {
    console.log("inside dashboard");
      const orderData=await Order.find().populate("userId").sort({createdOn:-1}).limit(10)
      const Users=await User.countDocuments();
        const totalOrders = await Order.countDocuments();
        const cancelledOrders = await Order.countDocuments({ status: "cancelled" });
        const returnedOrders = await Order.countDocuments({ status: "Returned" });
        const totalReturns = await Order.countDocuments({ status: { $in: ["Return Request", "Returned"] } });
        //pagination setup
        let page =  1;
        const limit = 10;
        const totalPages = Math.ceil(totalOrders / limit);



        const totalRefund = await Order.aggregate([
            { $match: { status: "Returned" } },
            { $group: { _id: null, totalRefund: { $sum: "$finalAmount" } } }
        ]);
        console.log(totalRefund);
        
        const totalRevenue = await Order.aggregate([
            { 
                $match: { 
                    status: { $nin: ["cancelled", "Returned"] } // Exclude cancelled and returned orders
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    totalRevenue: { $sum: "$finalAmount" } // Sum finalAmount for valid orders
                } 
            }
        ]);
        
        console.log("Total Revenue:", totalRevenue[0]?.totalRevenue || 0);
        const formattedRevenue = (totalRevenue[0]?.totalRevenue || 0).toLocaleString("en-IN");
console.log("Total Revenue:", formattedRevenue);

const totalOnlineRevenue = await Order.aggregate([
    { 
        $match: { 
            status: { $nin: ["cancelled", "Returned"] }, // Exclude cancelled and returned orders
            paymentMethod: { $in: ["wallet", "online payment"] } // Only wallet or online payments
        } 
    },
    { 
        $group: { 
            _id: null, 
            totalAmount: { $sum: "$finalAmount" } // Sum up finalAmount for matching orders
        } 
    }
]);
console.log(totalOnlineRevenue);

const salesData = await Order.aggregate([
    {
        $match: {
            status: { $nin: ["cancelled", "Returned"] } // Exclude cancelled/returned orders
        }
    },
    {
        $group: {
            _id: { $month: "$createdOn" }, // Group by month (1 = Jan, 2 = Feb, etc.)
            totalSales: { $sum: "$finalAmount" } // Sum finalAmount for each month
        }
    },
    { $sort: { "_id": 1 } } // Sort by month order
]);

const monthlyOrderCount = await Order.aggregate([
    {
        $group: {
            _id: { $month: "$createdOn" }, // Group by month (1 = Jan, 2 = Feb, etc.)
            totalOrders: { $count: {} } // Count orders per month
        }
    },
    { $sort: { "_id": 1 } } // Sort by month order
]);

// Initialize an array with 12 months, defaulting to 0 orders
const ordersArray = Array(12).fill(0);

// Populate the array with actual data from MongoDB
monthlyOrderCount.forEach(({ _id, totalOrders }) => {
    ordersArray[_id - 1] = totalOrders; // _id is month (1 = Jan), so adjust index
});

console.log(ordersArray);

// Convert data to array with missing months filled as 0
const monthlySales = new Array(12).fill(0); // Initialize with 0 for all months
salesData.forEach(({ _id, totalSales }) => {
    monthlySales[_id - 1] = totalSales; // Assign sales to corresponding month index
});
console.log(monthlySales);


    
    
    
            res.render("dashboard",
                {
                  orders:orderData,
                  userCount:Users,
                  totalOrders,
                  cancelledOrders,
                  returnedOrders,
                  totalRevenue:formattedRevenue,
                  totalRefund:totalRefund[0].totalRefund,
                  onlineRevenue:totalOnlineRevenue[0].totalAmount,
                  monthlySales,
                  ordersArray,
                  currentPage:page,
                  totalPages


                }
            )

    }
    catch (error) {
    res.redirect("/pageerror");
}
}
const logout=async(req,res)=>
{
    req.session.destroy((err)=>
    {
        if(err)
        {
            console.log("couldn't destroy the admin session");
        }
        else{
            return res.redirect("/admin/login")
        }
    })
}
const demoAdmin = async (req, res) => {
    try {
        const email = "zoocartofficial@gmail.com";
        const admin = await User.findOne({ email: email,isAdmin:true}); // Use findOne instead of find

        if (admin) {
            req.session.admin = admin._id; // Store user ID in session
            return res.redirect("/admin");
        } else {
            console.log("Error: addmin not found for demo login.");
            res.status(404).send("admin not found");
        }
    } catch (error) {
        console.log("Error occurred while using demo admin:", error);
        res.status(500).send("Internal Server Error");
    }
};
module.exports={
    loginPage,
    login,
    loadDashboard,
    pageerror,
    logout,
    demoAdmin
}