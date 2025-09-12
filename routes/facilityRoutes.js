// routes/facilityRoutes.js
import express from 'express';
import Facility from '../models/facilityModel.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// PUBLIC: List/search facilities
router.get('/', async (req, res) => {
  try {
    const { q = '' } = req.query;
    const filter = q ? { name: new RegExp(q, 'i') } : {};
    const facilities = await Facility.find(filter).sort({ name: 1 });
    res.json({ success: true, data: facilities });
  } catch (err) {
    console.error('❌ Failed to fetch facilities:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUBLIC: Get by name
router.get('/:name', async (req, res) => {
  try {
    const decodedName = decodeURIComponent(req.params.name);
    const facility = await Facility.findOne({ name: decodedName });
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json({ success: true, data: facility });
  } catch (err) {
    console.error('❌ Facility lookup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN ONLY: Create
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const created = await Facility.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('❌ Facility create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN ONLY: Update
router.patch('/:id', protect, isAdmin, async (req, res) => {
  try {
    const updated = await Facility.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Facility not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('❌ Facility update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN ONLY: Delete
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    await Facility.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Facility delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;


