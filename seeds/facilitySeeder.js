import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Facility from '../models/facilityModel.js';
import { mongoDBURL } from '../config.js';

dotenv.config();

const facilities = [
  {
    name: 'Saint Agnes Medical Center',
    primaryColor: '#005b7f',
    logoUrl: '/logos/samc.png',
  },
  {
    name: 'Saint Alphonsus Health System',
    primaryColor: '#A30D1D',
    logoUrl: '/logos/sa.png',
  },
  {
    name: 'St. Luke’s Health Partners', 
    primaryColor: '#347a2a',
    logoUrl: '/logos/stlukes.png',
  },
];


const seedFacilities = async () => {
  try {
    await mongoose.connect(mongoDBURL);
    await Facility.deleteMany();
    await Facility.insertMany(facilities);
    console.log('✅ Facilities seeded!');
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding facilities:', err);
    process.exit(1);
  }
};

seedFacilities();
