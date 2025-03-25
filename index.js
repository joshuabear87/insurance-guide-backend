import express from 'express';
import { PORT, mongoDBURL } from './config.js';
import mongoose from 'mongoose';
import cors from 'cors';
import booksRoute from './routes/booksRoute.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/books', booksRoute);

mongoose
  .connect(mongoDBURL)
  .then(() => {
    const port = process.env.PORT || PORT;
    console.log('App connected to database');
    app.listen(port, '0.0.0.0', () => {
      console.log(`App is listening on port: ${port}`);
    });
  })
  .catch((err) => {
    console.log('Failed to connect to MongoDB:', err);
  });
