import express from 'express';
import { Book } from '../models/bookModel.js';
import { imageUpload, cloudinaryUpload } from '../middleware/upload.js';
import { v2 as cloudinaryV2 } from 'cloudinary';
import { protect } from '../middleware/authMiddleware.js';


const router = express.Router();

// CREATE NEW BOOK (With Cloudinary Upload)
router.post('/', protect, imageUpload, cloudinaryUpload, async (req, res) => {
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
    image: req.fileUrls?.[0] || '',
    imagePublicId: req.filePublicIds?.[0] || '',
    secondaryImage: req.fileUrls?.[1] || '',
    secondaryImagePublicId: req.filePublicIds?.[1] || '',
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

// UPDATE BOOK (Replace Image if New One Provided)
router.put('/:id', protect, imageUpload, cloudinaryUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const existingBook = await Book.findById(id);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // If new images uploaded, delete old ones from Cloudinary
    if (req.fileUrls?.[0] && existingBook.imagePublicId) {
      await cloudinaryV2.uploader.destroy(existingBook.imagePublicId);
    }
    if (req.fileUrls?.[1] && existingBook.secondaryImagePublicId) {
      await cloudinaryV2.uploader.destroy(existingBook.secondaryImagePublicId);
    }

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      {
        ...req.body,
        image: req.fileUrls?.[0] || existingBook.image,
        imagePublicId: req.filePublicIds?.[0] || existingBook.imagePublicId,
        secondaryImage: req.fileUrls?.[1] || existingBook.secondaryImage,
        secondaryImagePublicId: req.filePublicIds?.[1] || existingBook.secondaryImagePublicId,
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

// DELETE A BOOK (Also Deletes Cloudinary Images)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Delete Cloudinary images
    if (book.imagePublicId) {
      await cloudinaryV2.uploader.destroy(book.imagePublicId);
    }
    if (book.secondaryImagePublicId) {
      await cloudinaryV2.uploader.destroy(book.secondaryImagePublicId);
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
