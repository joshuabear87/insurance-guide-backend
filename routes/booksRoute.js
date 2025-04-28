import express from 'express';
import { Book } from '../models/bookModel.js';
import { v2 as cloudinaryV2 } from 'cloudinary';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// CREATE insurance plan
router.post('/', protect, async (req, res) => {
  try {
    const {
      descriptiveName,
      prefix,
      payerName,
      payerCode,
      planName,
      planCode,
      financialClass,
      samcContracted,
      samfContracted,
      notes,
      authorizationNotes,
      ipaPayerId,
      payerId,
      facilityAddress,
      providerAddress,
      portalLinks,
      phoneNumbers,
      image,
      secondaryImage,
      imagePublicId,
      secondaryImagePublicId,
    } = req.body;

    const newBook = new Book({
      descriptiveName,
      prefix,
      payerName,
      payerCode,
      planName,
      planCode,
      financialClass,
      samcContracted,
      samfContracted,
      notes,
      authorizationNotes,
      ipaPayerId,
      payerId,
      facilityAddress,
      providerAddress,
      portalLinks,
      phoneNumbers,
      image: image || '',
      imagePublicId: imagePublicId || '',
      secondaryImage: secondaryImage || '',
      secondaryImagePublicId: secondaryImagePublicId || '',
    });

    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(500).json({ message: 'Error saving the insurance plan', error });
  }
});

// READ all insurance plans
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

// READ one insurance plan
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Insurance plan not found' });
    }
    res.status(200).json(book);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// UPDATE insurance plan
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const existingBook = await Book.findById(id);
    if (!existingBook) {
      return res.status(404).json({ message: 'Insurance plan not found' });
    }

    const {
      descriptiveName,
      prefix,
      payerName,
      payerCode,
      planName,
      planCode,
      financialClass,
      samcContracted,
      samfContracted,
      notes,
      authorizationNotes,
      ipaPayerId,
      payerId,
      facilityAddress,
      providerAddress,
      portalLinks,
      phoneNumbers,
      image,
      secondaryImage,
      imagePublicId,
      secondaryImagePublicId,
    } = req.body;

    // Handle image removal if necessary
    if (!image && existingBook.imagePublicId) {
      await cloudinaryV2.uploader.destroy(existingBook.imagePublicId.toString());
      existingBook.image = '';
      existingBook.imagePublicId = '';
    }
    if (!secondaryImage && existingBook.secondaryImagePublicId) {
      await cloudinaryV2.uploader.destroy(existingBook.secondaryImagePublicId.toString());
      existingBook.secondaryImage = '';
      existingBook.secondaryImagePublicId = '';
    }

    // Update fields
    existingBook.descriptiveName = descriptiveName;
    existingBook.prefix = prefix;
    existingBook.payerName = payerName;
    existingBook.payerCode = payerCode;
    existingBook.planName = planName;
    existingBook.planCode = planCode;
    existingBook.financialClass = financialClass;
    existingBook.samcContracted = samcContracted;
    existingBook.samfContracted = samfContracted;
    existingBook.notes = notes;
    existingBook.authorizationNotes = authorizationNotes;
    existingBook.ipaPayerId = ipaPayerId;
    existingBook.payerId = payerId;
    existingBook.facilityAddress = facilityAddress;
    existingBook.providerAddress = providerAddress;
    existingBook.portalLinks = portalLinks;
    existingBook.phoneNumbers = phoneNumbers;
    existingBook.image = image || existingBook.image;
    existingBook.imagePublicId = imagePublicId || existingBook.imagePublicId;
    existingBook.secondaryImage = secondaryImage || existingBook.secondaryImage;
    existingBook.secondaryImagePublicId = secondaryImagePublicId || existingBook.secondaryImagePublicId;

    const updatedBook = await existingBook.save();
    res.status(200).json({
      message: 'Insurance plan updated successfully',
      data: updatedBook,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// DELETE insurance plan
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Insurance plan not found' });
    }

    if (book.imagePublicId) {
      await cloudinaryV2.uploader.destroy(book.imagePublicId.toString());
    }
    if (book.secondaryImagePublicId) {
      await cloudinaryV2.uploader.destroy(book.secondaryImagePublicId.toString());
    }

    await book.deleteOne();

    res.status(200).json({
      message: 'Insurance plan deleted successfully',
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

export default router;
