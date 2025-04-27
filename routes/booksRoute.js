import express from 'express';
import { Book } from '../models/bookModel.js';
import { imageUpload, cloudinaryUpload } from '../middleware/upload.js';
import { v2 as cloudinaryV2 } from 'cloudinary';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
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
      image,
      secondaryImage,
      imagePublicId,
      secondaryImagePublicId,
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
      image: image || '',
      imagePublicId: imagePublicId || '',
      secondaryImage: secondaryImage || '',
      secondaryImagePublicId: secondaryImagePublicId || '',
    });

    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(500).json({ message: 'Error saving the book', error });
  }
});

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

router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const existingBook = await Book.findById(id);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

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
      image,
      secondaryImage,
      imagePublicId,
      secondaryImagePublicId,
    } = req.body;

    if (!image && existingBook.imagePublicId) {
      await cloudinaryV2.uploader.destroy(existingBook.imagePublicId);
      existingBook.image = '';
      existingBook.imagePublicId = '';
    }

    if (!secondaryImage && existingBook.secondaryImagePublicId) {
      await cloudinaryV2.uploader.destroy(existingBook.secondaryImagePublicId);
      existingBook.secondaryImage = '';
      existingBook.secondaryImagePublicId = '';
    }

    existingBook.descriptiveName = descriptiveName;
    existingBook.payerName = payerName;
    existingBook.payerCode = payerCode;
    existingBook.planName = planName;
    existingBook.planCode = planCode;
    existingBook.financialClass = financialClass;
    existingBook.samcContracted = samcContracted;
    existingBook.samfContracted = samfContracted;
    existingBook.notes = notes;
    existingBook.image = image || existingBook.image;
    existingBook.imagePublicId = imagePublicId || existingBook.imagePublicId;
    existingBook.secondaryImage = secondaryImage || existingBook.secondaryImage;
    existingBook.secondaryImagePublicId = secondaryImagePublicId || existingBook.secondaryImagePublicId;

    const updatedBook = await existingBook.save();

    res.status(200).json({
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

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
