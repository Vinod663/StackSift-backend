import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const sendContactEmail = async (req: Request, res: Response) => {
    try {
        const { name, email, subject, message } = req.body;

        // 1. Configure the Transporter (Gmail Example)
        // NOTE: For Gmail, you need an "App Password" if 2FA is on.
        // Go to Google Account > Security > 2-Step Verification > App Passwords
        const transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: {
                user: process.env.MAIL_USER, // Your Gmail address
                pass: process.env.MAIL_PASS  // Your Gmail App Password
            }
        });

        // 2. Define Email Options
        const mailOptions = {
            // CHANGE: Put name AND email in the display name part
            // Format: "Vinod (vinod@user.com)" <system@gmail.com>
            from: `"${name} (${email}) - StackSift" <${process.env.MAIL_USER}>`, 
            
            replyTo: email, // This is crucial: Hitting "Reply" goes to the user
            to: process.env.MAIL_USER, 
            subject: `[StackSift Support] ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4F46E5;">New Support Request</h2>
                    <p><strong>From:</strong> ${name}</p>
                    <p><strong>User Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;" />
                    <p><strong>Message:</strong></p>
                    <p style="background-color: #f9fafb; padding: 15px; border-radius: 5px; border-left: 4px solid #4F46E5;">
                        ${message.replace(/\n/g, '<br>')}
                    </p>
                </div>
            `
        };

        // 3. Send Email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Email sent successfully!" });

    } catch (error) {
        console.error("Email Error:", error);
        res.status(500).json({ message: "Failed to send email", error });
    }
};