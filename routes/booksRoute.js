import express from 'express';
import { Book } from '../models/bookModel.js';

const router = express.Router();

// Route for Save a New Book
router.post('/', async (req, res) => {
    try {
        if  (
            !req.body.title ||
            !req.body.author ||
            !req.body.publishYear
            ) {
                return res.status(400).send({
                    message: 'Send all required fields: title, author, publishYear',
                });
            }
        const newBook = {
            title: req.body.title,
            author: req.body.author,
            publishYear: req.body.publishYear,
        };

        const book = await Book.create(newBook);
    
        return res.status(201).send(book);
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message })
    }
});

// Route to get all books from the database
router.get('/', async (req, res) => {
    try {
        const books = await Book.find({});

        return res.status(200).json({
            count: books.length,
            data: books
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message })
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const book = await Book.findById(id);

        return res.status(200).json(book);
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message })
    }
});

// Route to update a book
router.put('/:id', async (req, res) => {
    try {
        if (
            !req.body.title ||
            !req.body.author ||
            !req.body.publishYear
        ) {
            return res.status(400).json({
                message: 'Send all required fields: title, author, publishYear',
            });
        }

        const { id } = req.params;

        const result = await Book.findByIdAndUpdate(id, req.body, { new: true });

        if (!result) {
            return res.status(404).json({ message: 'Book not found!'});
        }

        return res.status(200).json({ message: 'Book updated successfully!', data: result });

    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await Book.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'Book not found!'});
        }

        return res.status(200).json({ message: 'Book deleted successfully!', data: result });

    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

export default router;