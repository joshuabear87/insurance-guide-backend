// controllers/bookController.js
import { Book } from '../models/bookModel.js';
import { v2 as cloudinaryV2 } from 'cloudinary';

// (optional) if you want to auto-fill from a PlanCodeRef:

// CREATE
export const createBook = async (req, res) => {
  try {
    const facilityName = req.user?.activeFacility;
    if (!facilityName || !req.user.facilityAccess.includes(facilityName)) {
      return res.status(403).json({ message: 'Unauthorized or missing facility access.' });
    }

    const body = { ...req.body };

    // ✅ Hard-set immutable facilityName from token
    body.facilityName = facilityName;

    // ✅ Optional convenience: if client sends planCodeRef, prefill related refs
    if (body.planCodeRef) {
      try {
        const pc = await PlanCode.findById(body.planCodeRef)
          .populate('payer portals contacts');
        if (pc) {
          // Fill refs only if not provided by the client
          if (!body.payerRef && pc.payer?._id) body.payerRef = pc.payer._id;
          if (!Array.isArray(body.portalLinks) || body.portalLinks.length === 0) {
            body.portalLinks = (pc.portals || []).map(p => p._id);
          }
          if (!Array.isArray(body.contactsRef) || body.contactsRef.length === 0) {
            body.contactsRef = (pc.contacts || []).map(c => c._id);
          }
          // Optional display helpers if client omitted:
          if (!body.payerName && pc.payerName) body.payerName = pc.payerName;
          if (!body.planName && pc.name) body.planName = pc.name;
          if (!body.payerId && pc.payerId) body.payerId = pc.payerId;
          if (!body.ipaPayerId && pc.ipaPayerId) body.ipaPayerId = pc.ipaPayerId;
        }
      } catch (e) {
        console.warn('⚠️ planCodeRef prefill skipped:', e?.message || e);
      }
    }

    const newBook = new Book({
      ...body,
      image: body.image || '',
      imagePublicId: body.imagePublicId || '',
      secondaryImage: body.secondaryImage || '',
      secondaryImagePublicId: body.secondaryImagePublicId || '',
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

    const populateHub = req.query.populate === 'hub';

    let qry = Book.find(filter);

    if (populateHub) {
      qry = qry
        .populate('payerRef')
        .populate('planCodeRef')
        .populate('portalLinks')
        .populate('contactsRef')
        .populate('contractedFacilities');
    }

    const books = await qry.exec();
    res.status(200).json({ count: books.length, data: books });
  } catch (err) {
    console.error('❌ getBooks error:', err);
    res.status(500).json({ message: err.message });
  }
};

// READ ONE
export const getBookById = async (req, res) => {
  try {
    const populateHub = req.query.populate === 'hub';
    let qry = Book.findById(req.params.id);

    if (populateHub) {
      qry = qry
        .populate('payerRef')
        .populate('planCodeRef')
        .populate('portalLinks')
        .populate('contactsRef')
        .populate('contractedFacilities');
    }

    const book = await qry.exec();
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

    // Never allow facilityName edits
    delete req.body.facilityName;

    // ✅ Expand allowed fields to include hub references
    const allowedFields = [
      'descriptiveName', 'prefixes', 'payerName', 'payerCode', 'planName', 'planCode',
      'financialClass', 'notes', 'authorizationNotes', 'ipaPayerId', 'payerId',
      'facilityAddress', 'providerAddress', 'portalLinks', 'phoneNumbers',
      'image', 'imagePublicId', 'secondaryImage', 'secondaryImagePublicId',
      'facilityContracts',

      // NEW hub-backed references:
      'payerRef', 'planCodeRef', 'contactsRef', 'contractedFacilities'
    ];

    for (const key of Object.keys(req.body)) {
      if (!allowedFields.includes(key)) delete req.body[key];
    }

    Object.assign(book, req.body);

    // Handle image removals
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
