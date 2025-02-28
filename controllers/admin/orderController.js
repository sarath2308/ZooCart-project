const Order=require("../../models/orderSchema")
const User=require("../../models/userSchema")
const Address=require("../../models/addressSchema")




const loadOrders = async (req, res) => {
    try {
        let orders = await Order.find().populate('orderedItems.product').populate('userId')
        // Convert each Mongoose document to a plain object and add readableId
        orders = orders.map(order => {
            let orderObj = order.toObject(); // Convert Mongoose doc to plain object

            if (orderObj.orderId) { 
                const hexString = orderObj.orderId.replace(/-/g, ""); // Remove dashes
                orderObj.readableId = BigInt("0x" + hexString).toString(); // Convert to number
            }

            return orderObj;
        });

        console.log(orders); // Check if readableId is present

        return res.render("Orders", { data: orders });

    } catch (error) {
        console.log("Error occurred while loading orders:", error);
    }
};
    
    const orderDetails=async(req,res)=>
        {
           try {
               console.log("req arrived at order Details");
               const orderId=req.query.orderId;
               const orderData=await Order.findById({_id:orderId}).populate("orderedItems.product").populate("userId")
               const addressId=orderData.address;
               const userId=orderData.userId;
               const addressData=await Address.findOne({userId:userId})
               let deliveryAddress;
            
               if (!addressData) {
                   console.log("No address found for this user.");
               } else {
                   deliveryAddress = addressData.address.find(addr => addr._id.toString() === addressId.toString());
                   console.log("Delivery Address:", deliveryAddress);
               }
               
               
               console.log(orderData);
               if(!orderData)
               {
                   return res.status(401).json({success:false,message:"error occured"
                   })
               }
               let readableOrderId ;
               if (orderData && orderData.orderId) {  // Ensure orderData and orderId exist
                   const hexString = orderData.orderId.replace(/-/g, ""); // Remove dashes
                    readableOrderId = BigInt("0x" + hexString).toString(); // Convert to number
               }
               
       
               return res.status(200).render("orderData",
                   {
                       data:orderData,
                       readableId:readableOrderId,
                       deliveryAddress,
                   }
               )
               
           } catch (error) {
               console.log("error occured while rendering orderDetails"+error);
               
               return res.redirect("/admin/pageerror")
           }
        }

        const changeStatus = async (req, res) => {
            try {
                const { orderId, status, cancelReason } = req.body;
        
                console.log("Request received to update order status");
        
                // Find the order by ID
                const orderData = await Order.findById(orderId).populate("orderedItems.product");
        
                if (!orderData) {
                    return res.status(404).json({ success: false, message: "Order not found" });
                }
        
                // If the order is being canceled, add the ordered quantity back to the product stock
                if (status === "cancelled") {
                    orderData.cancelReason = cancelReason || "No reason provided";
        
                    for (let item of orderData.orderedItems) {
                        const product = item.product;
                        if (product) {
                            product.quantity += item.quantity;
                            await product.save();
                        }
                    }
                }
        
                // Update order status
                orderData.status = status;
                await orderData.save();
        
                return res.status(200).json({ success: true, message: "Order status updated successfully" });
            } catch (error) {
                console.error("Error occurred while changing the status:", error);
                return res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        




module.exports={
    loadOrders,
    orderDetails,
    changeStatus,
}