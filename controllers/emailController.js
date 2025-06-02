import User from '../models/userModel.js';
import { transporter } from '../util/sendEmail.js'; 

export const sendBroadcastEmail = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const { subject, message } = req.body;
    const file = req.file;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const users = await User.find({ isApproved: true });
    const recipients = users.map(user => user.email).filter(Boolean);

    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No approved users to send to.' });
    }

    const mailOptions = {
      from: `"HokenHub" <${process.env.EMAIL_USERNAME}>`,
      to: recipients,
      subject,
      html: `<p>${message}</p>`,
      attachments: file
        ? [{
            filename: file.originalname,
            content: file.buffer,
          }]
        : [],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Broadcast email sent to all users.' });
  } catch (err) {
    console.error('❌ sendBroadcastEmail error:', err);
    res.status(500).json({ message: 'Failed to send broadcast email.' });
  }
};
