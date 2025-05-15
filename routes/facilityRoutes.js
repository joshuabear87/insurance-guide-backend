import express from 'express';
import Facility from '../models/facilityModel.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.json(facilities);
  } catch (err) {
    console.error('❌ Failed to fetch facilities:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:name', async (req, res) => {
  try {
    const decodedName = decodeURIComponent(req.params.name);
    const facility = await Facility.findOne({ name: decodedName });
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json(facility);
  } catch (err) {
    console.error('❌ Facility lookup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;

