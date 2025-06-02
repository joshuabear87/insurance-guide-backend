// routes/facilityRoutes.js
import express from 'express';
import Facility from '../models/facilityModel.js';

const router = express.Router();

// GET all facilities
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.json({ success: true, data: facilities });
  } catch (err) {
    console.error('❌ Failed to fetch facilities:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET facility by name
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

// (Future) POST: Create new facility — Admin only
// router.post('/', protect, admin, async (req, res) => {
//   try {
//     const { name, theme, primaryColor, logoUrl } = req.body;
//     if (!name) return res.status(400).json({ message: 'Facility name is required' });

//     const existing = await Facility.findOne({ name });
//     if (existing) {
//       return res.status(400).json({ message: 'Facility already exists' });
//     }

//     const facility = new Facility({
//       name,
//       theme: theme || 'default',
//       primaryColor: primaryColor || '#007BFF',
//       logoUrl: logoUrl || '',
//     });

//     const saved = await facility.save();
//     res.status(201).json({ message: 'Facility created successfully', data: saved });
//   } catch (err) {
//     console.error('❌ Facility creation error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

export default router;

