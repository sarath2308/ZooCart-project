const User=require("../../models/userSchema")
const Order=require("../../models/orderSchema")
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const PDFDocument = require("pdfkit");


const filterOrder=async(req,res)=>
{
    console.log("req in filter order");
    
    try {
        let { startDate, endDate, search, currentPage, limit } = req.query;
        let page=currentPage || 1;
        page=parseInt(page)
        limit=parseInt(limit)

        const skip=((page-1)*limit)
        let query = {};
       console.log("start date"+ startDate);
       console.log("endDate"+endDate);
       console.log("search"+search);
       
       
       
        if (startDate) query.createdOn = { $gte: new Date(startDate) };
        if (endDate) query.createdOn = { ...query.createdOn, $lte: new Date(endDate) };
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: "i" } },
                { customerName: { $regex: search, $options: "i" }},
                { status: { $regex: search, $options: "i" }}
            ];
        }
        const totalOrders = await Order.countDocuments(query);
        console.log(totalOrders);
        
        let filteredOrders = await Order.find(query).populate('userId').sort({createdOn:-1}).skip(skip).limit(limit); // Limit results per page
        res.status(200).json({
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: page,
            orders: filteredOrders
        });
    } catch (error) {
        console.log(error);
        
        res.status(500).json({ message: "Error fetching data", error });
    }
}

const downloadExcel = async (req, res) => {
    try {
      const { startDate, endDate, search } = req.query;
  
      
      let query = {};
      if (startDate) query.createdOn = { $gte: new Date(startDate) };
      if (endDate) query.createdOn = { ...query.createdOn, $lte: new Date(endDate) };
      if (search) {
        query.$or = [
          { orderId: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
        ];
      }
  
    
      const orders = await Order.find(query)
        .populate("userId") 
        .sort({ createdOn: -1 });
  
      // Create a new Excel workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales report");
  
      // Add header row
      worksheet.addRow(["No", "Order ID", "Date", "Customer", "Status", "Total Amount", "Payment Method"]);
  
      // Add data rows
      orders.forEach((order, index) => {
        worksheet.addRow([
          index + 1, // Serial number
          order.orderId, // Order ID
          new Date(order.createdOn).toLocaleDateString(), // Date (YYYY-MM-DD)
          order.userId?.name || "Guest", // Customer name or "Guest"
          order.status, // Order status
          order.finalAmount.toFixed(2), // Total amount (formatted to 2 decimal places)
          order.paymentMethod, // Payment method
        ]);
      });
  
      const uploadDir = path.join(__dirname, "../public/uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log("Uploads directory created:", uploadDir);
      }
  
      // Define a unique file path
      const timestamp = Date.now();
      const filePath = path.join(uploadDir, `orders_${timestamp}.xlsx`);
  
      // Write workbook to file
      await workbook.xlsx.writeFile(filePath);
      console.log("Excel file created:", filePath);
  
      // Send the file for download
      res.download(filePath, `Orders_${timestamp}.xlsx`, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          return res.status(500).send("Error downloading file");
        }
  
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting file:", unlinkErr);
          } else {
            console.log("File deleted:", filePath);
          }
        });
      });
    } catch (error) {
      console.error("Error generating Excel:", error);
      res.status(500).send("Error generating Excel");
    }
  };

  const downloadPdf=async(req,res)=>
  {
    try {
      const { startDate, endDate, search } = req.query;
      let query = {};
      if (startDate) query.createdOn = { $gte: new Date(startDate) };
      if (endDate) query.createdOn = { ...query.createdOn, $lte: new Date(endDate) };
      if (search) {
        query.$or = [
          { orderId: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
        ];
      }
  
    
      const orders = await Order.find(query)
        .populate("userId") 
        .sort({ createdOn: -1 });
  
        // Create PDF document
        const doc = new PDFDocument();
        res.setHeader("Content-Disposition", "attachment; filename=Orders.pdf");
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        doc.fontSize(16).text("Sales Report", { align: "center" });
        doc.moveDown();

        orders.forEach((order,i) => {
            doc.text(`No: ${i+1}`);
            doc.text(`Order ID: ${order.orderId}`);
            doc.text(`Date: ${order.createdOn.toISOString().split("T")[0]}`);
            doc.text(`Customer : ${order.userId.name}`);
            doc.text(`Status: ${order.status}`);
            doc.text(`Total Amount: ₹${order.finalAmount}`);
            doc.text(`Total Amount: ₹${order.paymentMethod}`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Error generating PDF");
    }
};

module.exports={
    filterOrder,
    downloadExcel,
    downloadPdf,
}