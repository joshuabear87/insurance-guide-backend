import { Book } from '../models/bookModel.js';
import { v2 as cloudinaryV2 } from 'cloudinary';

// CREATE
export const createBook = async (req, res) => {
  try {
    const facilityName = req.user?.activeFacility;
    if (!facilityName || !req.user.facilityAccess.includes(facilityName)) {
      return res.status(403).json({ message: 'Unauthorized or missing facility access.' });
    }

    const newBook = new Book({
      facilityName,
      ...req.body,
      image: req.body.image || '',
      imagePublicId: req.body.imagePublicId || '',
      secondaryImage: req.body.secondaryImage || '',
      secondaryImagePublicId: req.body.secondaryImagePublicId || '',
    });

    const savedBook = await newBook.save();
    res.status(201).json({ message: 'Insurance plan created', data: savedBook });
  } catch (error) {
    console.error('❌ createBook error:', error);
    res.status(500).json({ message: 'Error saving insurance plan', error });
  }
};

// READ ALL
export const getBooks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.facility) filter.facilityName = req.query.facility;
    if (req.query.planName) filter.planName = new RegExp(req.query.planName, 'i');

    const books = await Book.find(filter);
    res.status(200).json({ count: books.length, data: books });
  } catch (err) {
    console.error('❌ getBooks error:', err);
    res.status(500).json({ message: err.message });
  }
};

// READ ONE
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Insurance plan not found' });

    const userFacility = req.user.activeFacility;
    if (book.facilityName !== userFacility) {
      console.log('🧾 Book facility:', book.facilityName);
console.log('👤 User active facility:', req.user.activeFacility);
      return res.status(403).json({ message: 'Unauthorized to access this plan' });
    }

    res.status(200).json({ data: book });
  } catch (err) {
    console.error('❌ getBookById error:', err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
export const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Insurance plan not found' });

    const userFacility = req.user.activeFacility;
    if (book.facilityName !== userFacility) {
      return res.status(403).json({ message: 'Unauthorized to update this plan' });
    }

    delete req.body.facilityName;

    const allowedFields = [
      'descriptiveName', 'prefixes', 'payerName', 'payerCode', 'planName', 'planCode',
      'financialClass', 'notes', 'authorizationNotes', 'ipaPayerId', 'payerId',
      'facilityAddress', 'providerAddress', 'portalLinks', 'phoneNumbers',
      'image', 'imagePublicId', 'secondaryImage', 'secondaryImagePublicId',
      'facilityContracts'
    ];

    for (const key of Object.keys(req.body)) {
      if (!allowedFields.includes(key)) delete req.body[key];
    }

    Object.assign(book, req.body);

    if (!req.body.image && book.imagePublicId) {
      try {
        await cloudinaryV2.uploader.destroy(book.imagePublicId.toString());
        book.image = '';
        book.imagePublicId = '';
      } catch (err) {
        console.error('❌ Cloudinary front image delete failed:', err.message);
      }
    }

    if (!req.body.secondaryImage && book.secondaryImagePublicId) {
      try {
        await cloudinaryV2.uploader.destroy(book.secondaryImagePublicId.toString());
        book.secondaryImage = '';
        book.secondaryImagePublicId = '';
      } catch (err) {
        console.error('❌ Cloudinary back image delete failed:', err.message);
      }
    }

    const updated = await book.save();
    res.status(200).json({ message: 'Insurance plan updated', data: updated });
  } catch (err) {
    console.error('❌ updateBook error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Insurance plan not found' });

    const userFacility = req.user.activeFacility;
    if (book.facilityName !== userFacility) {
      return res.status(403).json({ message: 'Unauthorized to delete this plan' });
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
    res.status(200).json({ message: 'Insurance plan deleted' });
  } catch (err) {
    console.error('❌ deleteBook error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
