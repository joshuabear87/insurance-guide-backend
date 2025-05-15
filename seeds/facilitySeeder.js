import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Facility from '../models/facilityModel.js';
import { mongoDBURL } from '../config.js';

dotenv.config();

const facilities = [
  {
    name: 'Saint Agnes Medical Center',
    description: 'Fresno-based hospital',
    primaryColor: '#005b7f',
  },
  {
    name: 'Saint Alphonsus Health System',
    description: 'Idaho-based network',
    primaryColor: '#A30D1D', 
  },
];

const seedFacilities = async () => {
  try {
    await mongoose.connect(mongoDBURL);
    await Facility.deleteMany(); // Clear out any old entries
    await Facility.insertMany(facilities);
    console.log('✅ Facilities seeded!');
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding facilities:', err);
    process.exit(1);
  }
};

seedFacilities();
