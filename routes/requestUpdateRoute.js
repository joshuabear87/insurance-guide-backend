import express from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import User from '../models/userModel.js';

dotenv.config();
const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, position, message } = req.body;

  try {
    const admins = await User.find({ role: 'admin', isApproved: true });
    const adminEmails = admins.map(admin => admin.email);

    if (!adminEmails.length) {
      return res.status(404).json({ error: 'No admin recipients found.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"HokenHub Notifications" <${process.env.EMAIL_USERNAME}>`,
      to: adminEmails,
      subject: `📥 New Update Request from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Position: ${position}
        
        Message:
        ${message}
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Request submitted successfully.' });
  } catch (err) {
    console.error('❌ Error sending request email:', err);
    res.status(500).json({ error: 'Failed to send request email.' });
  }
});

export default router;
