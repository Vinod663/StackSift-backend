import { Request, Response } from 'express';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendContactEmail = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', 
      to: 'vinodfernando048@gmail.com', 
      replyTo: email, // <--- CHANGED THIS (was reply_to)
      subject: `[StackSift Support] ${subject}`,
      html: `
        <h3>New Support Request</h3>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>User Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(500).json({ message: "Failed to send email", error });
    }

    res.status(200).json({ message: "Email sent successfully!" });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};