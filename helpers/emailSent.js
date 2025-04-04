const nodemailer=require("nodemailer")
require("dotenv").config()

async function sendVerificationEmail(email, otp, name) {
    console.log("Sending verification email to:", email, "with OTP:", otp); // Log input
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false, // Use STARTTLS on port 587
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        // Verify transporter configuration
        await transporter.verify();
        console.log("Transporter is ready");

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: `Verify Your Account using this OTP: ${otp}`,
            text: `Hello, ${name}, we received a request to verify your identity with a One-Time Password (OTP). Please use the following OTP to complete the verification process: ${otp}`,
            html: `<p>Dear ${name},</p><p>We received a request to verify your identity with a One-Time Password (OTP). Please use the following OTP to complete the verification process:</p><p><strong>Your OTP is: ${otp}</strong></p><p>This OTP will expire in 1 minute, so please enter it promptly. If you did not request this OTP, please ignore this email.</p><p>Thank you for using ZooCart.</p><p>Best regards,<br>The ZooCart Team<br>[Company Address]<br>9526847469<br>zoocart.com</p>`
        });

        console.log("Email sent successfully:", info.response);
        return info.accepted.length > 0;
    } catch (error) {
        console.error("Email sending error:", error);
        if (error.response) {
            console.error("SMTP response:", error.response);
        } else if (error.code) {
            console.error("Error code:", error.code);
        }
        return false;
    }
}
module.exports=
{
    sendVerificationEmail,
}
