import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { PORT, mongoDBURL } from './config.js';
import booksRoute from './routes/booksRoute.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cookieParser from 'cookie-parser';
import User from './models/userModel.js';
import sendPdfRoutes from './routes/sendPdfRoutes.js'
import requestUpdateRoute from './routes/requestUpdateRoute.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/request-update', requestUpdateRoute);
app.use('/send-pdf', sendPdfRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/books', booksRoute);

// Manual test route for email functionality
app.get('/send-test-email', async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin', isApproved: true });
    const toList = admins.map(admin => admin.email);

    for (const email of toList) {
      await sendEmail({
        to: email,
        subject: 'HokenHub SMTP Test Email',
        html: '<p>This is a test email to all admins.</p>',
      });
    }

    res.send(`✅ Test email sent to: ${toList.join(', ')}`);
  } catch (err) {
    console.error('❌ Test failed:', err);
    res.status(500).send('❌ Email send failed');
  }
});
// MongoDB connection and server start
mongoose.connect(mongoDBURL)
  .then(() => {
    console.log('✅ App connected to database');
    const port = process.env.PORT || PORT;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 App is listening on port: ${port}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err);
  });
