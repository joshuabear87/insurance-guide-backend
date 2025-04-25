import express from 'express';
import { Book } from '../models/bookModel.js';
import { upload, cloudinaryUpload } from '../middleware/upload.js'; // <-- include cloudinaryUpload
import { v2 as cloudinaryV2 } from 'cloudinary';

const router = express.Router();

// CREATE NEW BOOK (Including Cloudinary Image Upload)
router.post('/', upload.single('image'), cloudinaryUpload, async (req, res) => {
  const {
    descriptiveName,
    payerName,
    payerCode,
    planName,
    planCode,
    financialClass,
    samcContracted,
    samfContracted,
    notes,
  } = req.body;

  const newBook = new Book({
    descriptiveName,
    payerName,
    payerCode,
    planName,
    planCode,
    financialClass,
    samcContracted,
    samfContracted,
    notes,
    image: req.fileUrl || '',
    imagePublicId: req.filePublicId || '',
  });

  try {
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(500).json({ message: 'Error saving the book', error });
  }
});

// GET ALL BOOKS
router.get('/', async (req, res) => {
  try {
    const books = await Book.find({});
    res.status(200).json({
      count: books.length,
      data: books,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// GET SINGLE BOOK
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// UPDATE A BOOK (Replace Image if new one provided)
router.put('/:id', upload.single('image'), cloudinaryUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const existingBook = await Book.findById(id);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // If a new image is uploaded, delete the old one from Cloudinary
    if (req.fileUrl && existingBook.imagePublicId) {
      await cloudinaryV2.uploader.destroy(existingBook.imagePublicId);
    }

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      {
        ...req.body,
        image: req.fileUrl || existingBook.image,
        imagePublicId: req.filePublicId || existingBook.imagePublicId,
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// DELETE A BOOK (And delete image from Cloudinary if present)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Delete image from Cloudinary if present
    if (book.imagePublicId) {
      await cloudinaryV2.uploader.destroy(book.imagePublicId);
    }

    await Book.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Book deleted successfully',
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

export default router;
