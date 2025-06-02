import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PORT, mongoDBURL } from './config.js';
import booksRoute from './routes/booksRoute.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import requestUpdateRoute from './routes/requestUpdateRoute.js';
import facilityRoutes from './routes/facilityRoutes.js'
import sendEmail from './util/sendEmail.js';
import User from './models/userModel.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  'https://insurance-guide-frontend.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/facilities', facilityRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/books', booksRoute);
app.use('/admin', adminRoutes);
app.use('/request-update', requestUpdateRoute);

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
