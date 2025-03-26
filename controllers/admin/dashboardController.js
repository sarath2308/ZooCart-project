const User=require("../../models/userSchema")
const Order=require("../../models/orderSchema")
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const PdfPrinter = require("pdfmake");




const filterOrder = async (req, res) => {
  console.log("req in filter order");

  try {
      let { startDate, endDate, currentPage, limit } = req.query;
      let page = currentPage || 1;
      page = parseInt(page);
      limit = parseInt(limit);

      const skip = (page - 1) * limit;
      let query = {
          status: { $in: ['delivered'] }
      };

      console.log("start date:", startDate);
      console.log("end date:", endDate);

      // Check if startDate and endDate are the same
      if (startDate && endDate && startDate === endDate) {
          const startOfDay = new Date(startDate);
          startOfDay.setHours(0, 0, 0, 0); // Start of the day (00:00:00.000)

          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999); // End of the day (23:59:59.999)

          query.createdOn = {
              $gte: startOfDay,
              $lte: endOfDay
          };
      } else {
          // Handle separate startDate and endDate
          if (startDate) query.createdOn = { $gte: new Date(startDate) };
          if (endDate) {
            
            const endOfDay = new Date(endDate);
          
            endOfDay.setHours(23, 59, 59, 999);
           
            query.createdOn = { ...query.createdOn, $lte: endOfDay };
        }
    }

      const totalOrders = await Order.countDocuments(query);
      console.log("Total Orders:", totalOrders);

      let filteredOrders = await Order.find(query)
          .populate('userId')
          .sort({ createdOn: -1 })
          .skip(skip)
          .limit(limit); // Limit results per page

      res.status(200).json({
          totalOrders,
          totalPages: Math.ceil(totalOrders / limit),
          currentPage: page,
          orders: filteredOrders
      });
  } catch (error) {
      console.log("Error:", error);
      res.status(500).json({ message: "Error fetching data", error });
  }
};

const downloadExcel = async (req, res) => {
    try {
      const { startDate, endDate} = req.query;
      let query = {
        status: { $in: ['delivered'] }
    };


    // Check if startDate and endDate are the same
    if (startDate && endDate && startDate === endDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0); // Start of the day (00:00:00.000)

        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999); // End of the day (23:59:59.999)

        query.createdOn = {
            $gte: startOfDay,
            $lte: endOfDay
        };
    } else {
        // Handle separate startDate and endDate
        if (startDate) query.createdOn = { $gte: new Date(startDate) };
        if (endDate) {
          
          const endOfDay = new Date(endDate);
        
          endOfDay.setHours(23, 59, 59, 999);
         
          query.createdOn = { ...query.createdOn, $lte: endOfDay };
      }
  }
      
      const orders = await Order.find(query)
        .populate("userId") 
        .sort({ createdOn: -1 });
  
      // Create a new Excel workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales report");
  
      // Add header row
      worksheet.addRow(["No", "Order ID", "Date", "Customer", "Status","discount","Coupon discount", "Total Amount", "Payment Method","Payment status"]);
  
      // Add data rows
      orders.forEach((order, index) => {
        worksheet.addRow([
          index + 1, // Serial number
          order.orderId, // Order ID
          new Date(order.createdOn).toLocaleDateString(), // Date (YYYY-MM-DD)
          order.userId?.name || "Guest", // Customer name or "Guest"
          order.status,
          order.discount,
          order.couponApplied, // Order status
          order.finalAmount.toFixed(2), // Total amount (formatted to 2 decimal places)
          order.paymentMethod,
          order.paymentStatus?'paid':'pending', // Payment method
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



  


  const downloadPdf = async (req, res) => {
      try {
          const { startDate, endDate } = req.query;
  
          let query = { status: "delivered" };
  
          if (startDate && endDate && startDate === endDate) {
              const startOfDay = new Date(startDate);
              startOfDay.setHours(0, 0, 0, 0);
              const endOfDay = new Date(endDate);
              endOfDay.setHours(23, 59, 59, 999);
              query.createdOn = { $gte: startOfDay, $lte: endOfDay };
          } else {
              if (startDate) query.createdOn = { $gte: new Date(startDate) };
              if (endDate) {
                  const endOfDay = new Date(endDate);
                  endOfDay.setHours(23, 59, 59, 999);
                  query.createdOn = { ...query.createdOn, $lte: endOfDay };
              }
          }
  
          const orders = await Order.find(query).populate("userId").sort({ createdOn: -1 });
  
          const fonts = {
              Roboto: {
                  normal: "Helvetica", // Use built-in font
                  bold: "Helvetica-Bold", // Use built-in bold font
                  italics: "Helvetica-Oblique",
                  bolditalics: "Helvetica-BoldOblique"
              }
          };
  
          const printer = new PdfPrinter(fonts);
  
          const tableHeaders = [
              { text: "No", bold: true },
              { text: "Order ID", bold: true },
              { text: "Date", bold: true },
              { text: "Customer", bold: true },
              { text: "Status", bold: true },
              { text: "Amount", bold: true },
              { text: "Payment Method", bold: true }
          ];
  
          const tableBody = orders.map((order, i) => {
              let paymentStatus = order.paymentStatus
                  ? "Paid"
                  : order.paymentMethod === "online payment"
                  ? "Payment Unsuccessful"
                  : "Pending";
  
              return [
                  i + 1,
                  order.orderId,
                  order.createdOn.toISOString().split("T")[0],
                  order.userId.name,
                  order.status,
                  `₹${order.finalAmount}`,
                  order.paymentMethod
              ];
          });
  
          const docDefinition = {
              content: [
                  { text: "Sales Report", style: "header" },
                  {
                      table: {
                          headerRows: 1,
                          widths: ["auto", "*", "auto", "*", "auto", "auto", "auto"],
                          body: [tableHeaders, ...tableBody]
                      }
                  }
              ],
              styles: {
                  header: {
                      fontSize: 18,
                      bold: true,
                      alignment: "center",
                      margin: [0, 0, 0, 10]
                  }
              }
          };
  
          const pdfDoc = printer.createPdfKitDocument(docDefinition);
          res.setHeader("Content-Disposition", "attachment; filename=Orders.pdf");
          res.setHeader("Content-Type", "application/pdf");
          pdfDoc.pipe(res);
          pdfDoc.end();
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