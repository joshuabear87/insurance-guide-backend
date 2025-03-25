import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT, mongoDBURL } from './config.js';
import mongoose from 'mongoose';
import cors from 'cors';
import booksRoute from './routes/booksRoute.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse JSON
app.use(express.json());
app.use(cors());

// API routes
app.use('/books', booksRoute);

// Serve static files if in production mode
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/dist')));
  
  // Catch-all handler to serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
  });
}

mongoose
  .connect(mongoDBURL)
  .then(() => {
    const port = process.env.PORT || PORT;
    console.log('App connected to database');
    app.listen(port, '0.0.0.0', () => {
      console.log(`App is listening to port: ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
