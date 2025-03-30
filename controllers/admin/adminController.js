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

const loginPage = async (req, res,next) => {
    try {
      if (req.session.admin) {
        return res.redirect('/admin');  // If session exists, redirect to admin page
      }
  
      res.render('adminlogin', { message: '' });  // Render login page with an empty message
    } catch (error) {
      next(error)
    }
  };
  
const login = async (req, res,next) => {
    
    const { email, password } = req.body;
    console.log(email, password);
   
    try {
        // Await the result of the find query
        const findAdmin = await User.findOne({ email: email, isAdmin: true });

        if (findAdmin) {
            
            
            const passwordCheck = await bcrypt.compare(password, findAdmin.password);
            if (passwordCheck) {
               
                
                req.session.admin = findAdmin._id;
                return res.redirect('/admin');
            } else {
                return res.status(401).render("adminlogin", { message: "Incorrect Password" });
            }
        } else {
            return res.status(401).render("adminlogin", { message: "Incorrect Email" });
        }
    } catch (error) {
      
       next(error)
    }
};

const loadDashboard=async(req,res,next)=>
{
 
    try {
   
    const orderData = await Order.find({
      status: { $in: ["delivered"] }, // Filter by status
      paymentStatus: true // Filter by paymentStatus
  })
  .populate("userId") // Populate userId
  .sort({ createdOn: -1 }) // Sort by createdOn in descending order
  .limit(10); // Limit to 10 orders
      const Users=await User.countDocuments();
        const totalOrders =await Order.countDocuments();
        const totalSales=await Order.find({status:{$in:['delivered']}}).countDocuments()
        const cancelledOrders = await Order.countDocuments({ status: "cancelled" });
        const returnedOrders = await Order.countDocuments({ status: "Returned" });
        const totalReturns = await Order.countDocuments({ status: { $in: ["Return Request", "Returned"] } });
        //pagination setup
        let page =  1;
        const limit = 10;
        const totalPages = Math.ceil(totalSales / limit);
      

        const totalRefund = await Order.aggregate([
            {
              $match: {
                status: { $in: ["Returned", "cancelled"] } // Match documents with status "Returned" or "Cancelled"
              }
            },
            {
              $group: {
                _id: null, // Group all documents into a single group
                totalRefund: { $sum: "$finalAmount" } // Sum the `finalAmount` field
              }
            }
          ]);
          
        
        const totalRevenue = await Order.aggregate([
            {
              $match: {
                // Exclude cancelled and returned orders
                status: { $in: ["delivered"] },
                // Ensure paymentStatus is true
                paymentStatus: true,
              }
            },
            {
              $group: {
                _id: null, // Group all documents into a single group
                totalRevenue: { $sum: { $ifNull: ["$finalAmount", 0] } } // Sum `finalAmount`, treating missing fields as 0
              }
            }
          ]);
          

        
        const formattedRevenue = (totalRevenue[0]?.totalRevenue || 0).toLocaleString("en-IN");

const totalOnlineRevenue = await Order.aggregate([
    { 
        $match: { 
            status: { $in: ["delivered"] }, // Exclude cancelled and returned orders
            paymentMethod: { $in: ["wallet", "online payment"] },
            paymentStatus:true,
        } 
    },
    { 
        $group: { 
            _id: null, 
            totalAmount: { $sum: "$finalAmount" } // Sum up finalAmount for matching orders
        } 
    }
]);


const salesData = await Order.aggregate([
    {
        $match: {
            status: { $in: ["delivered","Returned","Return Request"] } // Exclude cancelled/returned orders
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

const ordersArray = Array(12).fill(0);

// Populate the array with actual data from MongoDB
monthlyOrderCount.forEach(({ _id, totalOrders }) => {
    ordersArray[_id - 1] = totalOrders; // _id is month (1 = Jan), so adjust index
});


// Convert data to array with missing months filled as 0
const monthlySales = new Array(12).fill(0); // Initialize with 0 for all months
salesData.forEach(({ _id, totalSales }) => {
    monthlySales[_id - 1] = totalSales; // Assign sales to corresponding month index
});


//most ordred product 
const getTopTwoOrderedProducts = async () => {

    const result = await Order.aggregate([
      { $unwind: "$orderedItems" }, // Unwind orderedItems array
      {
        $group: {
          _id: "$orderedItems.product", // Group by product ID
          totalOrders: { $sum: 1 }, // Count occurrences (orders containing the product)
          totalQuantity: { $sum: "$orderedItems.quantity" } // Sum total ordered quantity
        }
      },
      { $sort: { totalQuantity: -1 } }, // Sort by totalQuantity (highest first)
      { $limit: 2 }, // Get top 2 products
      {
        $lookup: {
          from: "products", // Join with Products collection
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" }, // Extract product details object
      {
        $project: {
          _id: "$productDetails._id",
          productName: "$productDetails.productName",
          price: "$productDetails.salePrice",
          category: "$productDetails.category",
          productImage: "$productDetails.productImage", // Include product image
          totalOrders: 1, // Include order count
          totalQuantity: 1 // Include total quantity
        }
      }
    ]);

    return result;
  
};

    
    
    
            res.render("dashboard",
                {
                  orders:orderData,
                  userCount:Users,
                  totalOrders,
                  cancelledOrders,
                  returnedOrders,
                  totalRevenue:formattedRevenue,
                  totalRefund:totalRefund.length>0?totalRefund[0].totalRefund:0,
                  onlineRevenue:totalOnlineRevenue.length>0?totalOnlineRevenue[0].totalAmount:0,
                  monthlySales,
                  ordersArray,
                  currentPage:page,
                  totalPages,
                  totalSales,
                  topTwo: await getTopTwoOrderedProducts(),
                  currentPath:req.path

                }
            )

    }catch (error) {
        
    next(error)
}
}
const logout=async(req,res)=>
{
    req.session.destroy((err)=>
    {  
            return res.redirect("/admin/login")
    })
}

module.exports={
    loginPage,
    login,
    loadDashboard,
    pageerror,
    logout,
}