import express from 'express';
import { PORT, mongoDBURL } from './config.js';
import mongoose from 'mongoose';
import cors from 'cors';
import booksRoute from './routes/booksRoute.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/auth', authRoutes);
app.use('/books', booksRoute);

mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log('App connected to database');

    mongoose.connection.on('connected', () => {
      console.log(`✅ Connected to MongoDB database: ${mongoose.connection.client.s.options.dbName}`);
    });

    const port = process.env.PORT || PORT;
    app.listen(port, '0.0.0.0', () => {
      console.log(`App is listening on port: ${port}`);
    });
  })
  .catch((err) => {
    console.log('Failed to connect to MongoDB:', err);
  });
