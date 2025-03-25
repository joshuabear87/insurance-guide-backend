import express from 'express';
import { PORT, mongoDBURL } from "./config.js";
import mongoose from 'mongoose';
import { Book } from './models/bookModel.js';
import booksRoute from './routes/booksRoute.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
// const path = require('path');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

app.use(express.json());

app.use(cors());

// app.use(cors({
    //     origin: 'http://localhost:3000',
    //     methods: ['GET', 'POST', 'PUT', 'DELETE'],
    //     allowedHeaders: ['Content-Type'],
    // }));

app.use('/books', booksRoute);
    
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get('/*', (req, res) => {
    // console.log(req)
    // return res.status(234).send('Welcome To MERN Stack Tutorial')
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"))
});
    

mongoose
    .connect(mongoDBURL)
    .then(() => {
        console.log('App connected to database');
        app.listen(PORT, () => {
            console.log(`App is listening to port: ${PORT}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });