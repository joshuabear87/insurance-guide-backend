import express from 'express';
import User from '../models/userModel.js';
import { transporter } from '../util/sendEmail.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, position, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }

  try {
    const admins = await User.find({ role: 'admin', isApproved: true });
    const adminEmails = admins.map(admin => admin.email);

    if (!adminEmails.length) {
      return res.status(404).json({ message: 'No admin recipients found.' });
    }

    const mailOptions = {
      from: `"HokenHub Notifications" <${process.env.EMAIL_USERNAME}>`,
      to: adminEmails,
      subject: `📥 New Update Request from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Position: ${position || 'N/A'}

Message:
${message}
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Request submitted successfully.' });
  } catch (err) {
    console.error('❌ Error sending request email:', err);
    res.status(500).json({ message: 'Failed to send request email.' });
  }
});

export default router;
