const Wallet=require("../../models/walletSchema")
const User=require("../../models/userSchema")
const Order=require("../../models/orderSchema")

const loadWallet=async(req,res,next)=>
{
    try {
        async function getAllTransactions() {
            try {
                const transactions = await Wallet.aggregate([
                    { $unwind: "$paymentHistory" }, // Flatten paymentHistory array
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "user"
                        }
                    },
                    { $unwind: "$user" }, // Extract user details
                    {
                        $project: {
                            _id: 0,
                            transactionId: "$paymentHistory.transactionId",
                            orderId: "$paymentHistory.orderId",
                            amount: "$paymentHistory.amount",
                            date: "$paymentHistory.date",
                            status: "$paymentHistory.status",
                            description: "$paymentHistory.description",
                            paymentFlow: "$paymentHistory.paymentFlow",
                            user: { name: "$user.name", email: "$user.email" } // Only user details
                        }
                    },
                    { $sort: { date: -1 } } // Sort transactions by latest
                ]);
        
                return transactions;
            } catch (error) {
                throw error;
            }
        }
        
        return res.render("adminWallet",{
            transactions:await getAllTransactions(),
            currentPath:req.path
        })
        
    } catch (error) {
        
        next(error)
        
    }
}

const paymentDetails = async (req, res,next) => {
    try {
        const orderDataId = Number(req.query.orderId); 
        const amount=Number(req.query.amount)
        const status=req.query.status;
        let orders;

        if (isNaN(orderDataId)) {
            return res.redirect("/admin/pageerror");
        }
if(status==='debited')
{

     orders = await Order.find({
        $or: [
            { cartId: { $eq: orderDataId } }, 
            { uniqueId: { $eq: orderDataId } }
            
        ]
    }).populate("orderedItems.product").populate("userId");
}
else
{
     let data= await Order.find({
        $or: [
            { cartId: orderDataId }, 
            { uniqueId: orderDataId }
        ]
    }).populate("orderedItems.product").populate("userId");
    
    orders = data.filter(order => order.finalAmount === amount);
    
}
    
        if (orders.length === 0) {
            return res.render("paymentDetails", { orders: [], message: "No matching orders found" });
        }

        res.render("paymentDetails", { orders, message: null ,status});

    } catch (error) {
        next(error)
    }
};


module.exports={
    loadWallet,
    paymentDetails
}