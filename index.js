import express from 'express';
import { PORT, mongoDBURL } from "./config.js";
import mongoose from 'mongoose';
import booksRoute from './routes/booksRoute.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// To fix issues with relative paths in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());

// Serve static files if you have a build directory (only if needed)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, "../frontend/dist"))); // Make sure this is correct for your project structure
}

// Routes
app.use('/books', booksRoute);

// Fallback route for single-page apps (React)
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));  // Make sure your build folder is correct here
});

// MongoDB Connection and App Start
mongoose
    .connect(mongoDBURL)
    .then(() => {
        const port = process.env.PORT || PORT; // Use the dynamic port from Render
        console.log('App connected to database');
        app.listen(port, '0.0.0.0', () => {
            console.log(`App is listening on port: ${port}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });