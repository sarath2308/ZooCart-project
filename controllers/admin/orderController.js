const Order=require("../../models/orderSchema")
const User=require("../../models/userSchema")
const Address=require("../../models/addressSchema")
const Wallet=require("../../models/walletSchema");
const { userAuth } = require("../../middlewares/auth");
const Product=require("../../models/productSchema")




const loadOrders = async (req, res,next) => {
    try {
        let orders = await Order.find().populate('orderedItems.product').populate('userId').sort({createdOn:-1}).lean()
        // Convert each Mongoose document to a plain object and add readableId
        orders = orders.map(order => {
              
            // No need to call order.toObject() since order is already a plain object
            if (order.orderId) {
              const hexString = order.orderId.replace(/-/g, ""); // Remove dashes
              order.readableId = BigInt("0x" + hexString).toString(); // Convert to number string
            }
            return order;
          });
        
        return res.render("adminOrders", { data: orders,currentPath:req.path });

    } catch (error) {    
        next(error)
    }
};
    
    const orderDetails=async(req,res,next)=>
        {
           try {
              
               const orderId=req.query.orderId;
               const orderData=await Order.findById({_id:orderId}).populate("orderedItems.product").populate("userId")
               const addressId=orderData.address;
               const userId=orderData.userId;
               const addressData=await Address.findOne({userId:userId})
               let deliveryAddress;
            
               if (addressData) {
                   deliveryAddress = addressData.address.find(addr => addr._id.toString() === addressId.toString());
                   console.log("Delivery Address:", deliveryAddress);
               }
               
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
               
            next(error)
           }
        }

        const changeStatus = async (req, res,next) => {
            try {
                const { orderId, status, cancelReason } = req.body;
        
                // Find the order by ID
                const orderData = await Order.findById(orderId);
                let pid=orderData.orderedItems[0].product;
                let product=await Product.findById({_id:pid})
                const userId=orderData.userId;
                const wallet=await Wallet.findOne({userId:userId})
        
                if (!orderData) {
                    return res.status(404).json({ success: false, message: "Order not found" });
                }
              async function addToWallet()
              {
                if(wallet)
                    {
                        const payment={
                            amount:orderData.finalAmount,
                            paymentFlow:true,
                            description:"order refund",
                            status:'credited',
                            orderId:orderData.cartId?orderData.cartId:orderData.uniqueId,
                        }
                        wallet.balance+=orderData.finalAmount;
                        wallet.paymentHistory.push(payment)
                        await wallet.save()
                    }
                    else
                    {
                    const payment={
                        amount:orderData.finalAmount,
                        paymentFlow:true,
                        description:"order refund",
                        status:'credited',
                        orderId:orderData.cartId?orderData.cartId:orderData.uniqueId,
                    }
                    const newWallet=new Wallet({
                        userId:userId,
                        balance:orderData.finalAmount,
                        paymentHistory:payment,
                    })

                    const walletCreated=await newWallet.save()
                }
              }
                // If the order is being canceled, add the ordered quantity back to the product stock
                if (status === "cancelled" ) {
                    orderData.cancelReason = cancelReason || "No reason provided";
        
                        if (product) {
                            product.quantity += orderData.totalQuantity;
                            await product.save();
                        }
                    if(orderData.paymentStatus===true)
                    {
                    addToWallet()
                    }
                }
                if(status ==='Returned')
                    {
                        
                        if (product) {
                            product.quantity += orderData.totalQuantity;
                            await product.save();
                        }
                        
                        addToWallet()
                    }
                    if(status==='delivered')
                    {
                        orderData.paymentStatus=true;
                    }
                
                // Update order status
                orderData.status = status;
                await orderData.save();
        
                return res.status(200).json({ success: true, message: "Order status updated successfully" });
            } catch (error) {
                next(error)
            }
        };
        




module.exports={
    loadOrders,
    orderDetails,
    changeStatus,
}