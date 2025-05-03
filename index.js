import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { PORT, mongoDBURL } from './config.js';
import booksRoute from './routes/booksRoute.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cookieParser from 'cookie-parser';
import requestUpdateRoutes from './routes/requestUpdateRoutes.js';



dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/request-update', requestUpdateRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes); 
app.use('/books', booksRoute);

mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log('✅ App connected to database');
    const port = process.env.PORT || PORT;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 App is listening on port: ${port}`);
    });
  })
  .catch((err) => {
    console.log('❌ Failed to connect to MongoDB:', err);
  });
