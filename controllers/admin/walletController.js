const Wallet=require("../../models/walletSchema")
const User=require("../../models/userSchema")
const Order=require("../../models/orderSchema")

const loadWallet=async(req,res)=>
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
                console.error("Error fetching transactions:", error);
                throw error;
            }
        }
        
        return res.render("wallet",{
            transactions:await getAllTransactions()
        })
        
    } catch (error) {
        console.log("error occured while loading the wallet"+error);
        return res.redirect("/admin/pageerror")
        
    }
}

const paymentDetails = async (req, res) => {
    try {
        const orderDataId = Number(req.query.orderId); 
        const amount=Number(req.query.amount)
        const status=req.query.status;
        let orders;

        if (isNaN(orderDataId)) {
            console.error("Invalid orderId:", req.query.orderId);
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
      console.log("orders in in payment details"+orders);
      console.log(orders);
      
      
        if (orders.length === 0) {
            return res.render("paymentDetails", { orders: [], message: "No matching orders found" });
        }

        res.render("paymentDetails", { orders, message: null ,status});

    } catch (error) {
        console.error("Error occurred in payment details:", error);
        return res.redirect("/admin/pageerror");
    }
};


module.exports={
    loadWallet,
    paymentDetails
}