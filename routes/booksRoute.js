// routes/booksRoute.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
} from '../controllers/bookController.js';

const router = express.Router();

// CREATE insurance plan
router.post('/', protect, createBook);

// READ all insurance plans (with optional ?facility= query)
router.get('/', getBooks);

// READ single plan
router.get('/:id', protect, getBookById);

// UPDATE insurance plan
router.put('/:id', protect, updateBook);

// DELETE insurance plan
router.delete('/:id', protect, deleteBook);

export default router;
