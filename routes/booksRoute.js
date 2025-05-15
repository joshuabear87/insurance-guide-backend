import express from 'express';
import { Book } from '../models/bookModel.js';
import { v2 as cloudinaryV2 } from 'cloudinary';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// CREATE insurance plan
router.post('/', protect, async (req, res) => {
  try {
    const facilityName = req.user?.activeFacility;
    if (!facilityName || !req.user.facilityAccess.includes(facilityName)) {
      return res.status(403).json({ message: 'Unauthorized or missing facility access.' });
    }

    const {
      descriptiveName, prefixes, payerName, payerCode, planName, planCode,
      financialClass, notes, authorizationNotes, ipaPayerId, payerId, 
      facilityAddress, providerAddress, portalLinks, phoneNumbers, image,
      secondaryImage, imagePublicId, secondaryImagePublicId, facilityContracts
    } = req.body;

    const newBook = new Book({
      facilityName,
      descriptiveName,
      prefixes,
      payerName,
      payerCode,
      planName,
      planCode,
      financialClass,
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
      facilityContracts, // Include the new facilityContracts field
    });

    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    console.error('❌ POST /books error:', error);
    res.status(500).json({ message: 'Error saving the insurance plan', error });
  }
});

// READ all insurance plans
router.get('/', async (req, res) => {
  try {
    const facility = req.query.facility;
    const filter = facility ? { facilityName: facility } : {};
    const books = await Book.find(filter);
    res.status(200).json({ count: books.length, data: books });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// READ one insurance plan
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: 'Insurance plan not found' });

    const userFacility = req.user.activeFacility;
    if (book.facilityName !== userFacility) {
      return res.status(403).json({ message: 'Unauthorized: Cannot view plans for another facility.' });
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
    if (!existingBook) return res.status(404).json({ message: 'Insurance plan not found' });

    const userFacility = req.user.activeFacility;
    if (existingBook.facilityName !== userFacility) {
      return res.status(403).json({ message: 'Unauthorized: Cannot edit plans for another facility.' });
    }

    delete req.body.facilityName; // 🔒 Prevent facility switching

    Object.assign(existingBook, req.body);

    if (!req.body.image && existingBook.imagePublicId) {
      try {
        await cloudinaryV2.uploader.destroy(existingBook.imagePublicId.toString());
        existingBook.image = '';
        existingBook.imagePublicId = '';
      } catch (err) {
        console.error('❌ Cloudinary front image delete failed:', err.message);
      }
    }

    if (!req.body.secondaryImage && existingBook.secondaryImagePublicId) {
      try {
        await cloudinaryV2.uploader.destroy(existingBook.secondaryImagePublicId.toString());
        existingBook.secondaryImage = '';
        existingBook.secondaryImagePublicId = '';
      } catch (err) {
        console.error('❌ Cloudinary back image delete failed:', err.message);
      }
    }

    const updated = await existingBook.save();
    res.status(200).json({ message: 'Insurance plan updated successfully', data: updated });
  } catch (err) {
    console.error('❌ PUT /books/:id failed:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE insurance plan
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: 'Insurance plan not found' });

    const userFacility = req.user.activeFacility;
    if (book.facilityName !== userFacility) {
      return res.status(403).json({ message: 'Unauthorized: Cannot delete plans for another facility.' });
    }

    if (book.imagePublicId) {
      try {
        await cloudinaryV2.uploader.destroy(book.imagePublicId);
      } catch (err) {
        console.error('❌ Error deleting front image:', err.message);
      }
    }

    if (book.secondaryImagePublicId) {
      try {
        await cloudinaryV2.uploader.destroy(book.secondaryImagePublicId);
      } catch (err) {
        console.error('❌ Error deleting back image:', err.message);
      }
    }

    await book.deleteOne();
    res.status(200).json({ message: 'Insurance plan deleted successfully' });
  } catch (err) {
    console.error('❌ DELETE /books/:id failed:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
