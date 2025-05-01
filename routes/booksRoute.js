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
      prefixes,
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
      prefixes,
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
    console.log('[PUT] Updating plan ID:', id);
    console.log('[PUT] Request body:', req.body);

    const existingBook = await Book.findById(id);
    if (!existingBook) {
      return res.status(404).json({ message: 'Insurance plan not found' });
    }

    const {
      descriptiveName,
      prefixes,
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

    if (!image || image.trim() === '') {
      if (existingBook.imagePublicId) {
        try {
          await cloudinaryV2.uploader.destroy(existingBook.imagePublicId.toString());
          console.log('✅ Front image deleted from Cloudinary');
        } catch (err) {
          console.error('❌ Cloudinary front image delete failed:', err.message);
        }
      }
      existingBook.image = '';
      existingBook.imagePublicId = '';
    }

    if (!secondaryImage || secondaryImage.trim() === '') {
      if (existingBook.secondaryImagePublicId) {
        try {
          await cloudinaryV2.uploader.destroy(existingBook.secondaryImagePublicId.toString());
          console.log('✅ Back image deleted from Cloudinary');
        } catch (err) {
          console.error('❌ Cloudinary back image delete failed:', err.message);
        }
      }
      existingBook.secondaryImage = '';
      existingBook.secondaryImagePublicId = '';
    }

    existingBook.descriptiveName = descriptiveName;
    existingBook.prefixes = prefixes;
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

    const updated = await existingBook.save();

    console.log('✅ Insurance plan updated:', updated._id);
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
    if (!book) {
      return res.status(404).json({ message: 'Insurance plan not found' });
    }

    // ✅ Attempt to delete front image
    if (book.imagePublicId) {
      try {
        await cloudinaryV2.uploader.destroy(book.imagePublicId);
        console.log('✅ Front image deleted from Cloudinary');
      } catch (err) {
        console.error('❌ Error deleting front image:', err.message);
      }
    }

    // ✅ Attempt to delete back image
    if (book.secondaryImagePublicId) {
      try {
        await cloudinaryV2.uploader.destroy(book.secondaryImagePublicId);
        console.log('✅ Back image deleted from Cloudinary');
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
