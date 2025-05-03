import express from 'express';
import nodemailer from 'nodemailer';
import User from '../models/userModel.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  const { name, message } = req.body;

  try {
    const admins = await User.find({ role: 'admin' });
    const emails = admins.map((admin) => admin.email);

    if (emails.length === 0) {
      return res.status(404).json({ error: 'No administrators found.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails,
      subject: 'New Insurance Update Request',
      text: `From: ${name}\n\n${message}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully.' });
  } catch (err) {
    console.error('❌ Email error:', err);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

export default router;
