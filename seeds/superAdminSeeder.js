import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';

dotenv.config(); // Load .env

const MONGO_URI = process.env.MONGO_URI;

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const email = 'admin@example.com';
    const password = 'SuperSecurePassword123';
    const defaultFacility = 'Saint Agnes Medical Center';

    let user = await User.findOne({ email });

    if (user) {
      user.password = await bcrypt.hash(password, 10);
      user.isApproved = true;
      user.status = 'approved';
      user.role = 'admin';
      user.requestedFacility = user.requestedFacility || [defaultFacility];
      user.facilityAccess = user.facilityAccess || [defaultFacility, 'Saint Alphonsus Health System'];
      user.phoneNumber = user.phoneNumber || '1234567890';
      user.npi = user.npi || '1234567890';
      user.firstName = user.firstName || 'Admin';  // Set firstName if missing
      user.lastName = user.lastName || 'Super';  // Set lastName if missing
      await user.save();
      console.log('✅ Super Admin restored and updated');
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        firstName: 'Admin',  // Set firstName
        lastName: 'Super',   // Set lastName
        email,
        password: hashedPassword,
        requestedFacility: [defaultFacility],
        facilityAccess: [defaultFacility, 'Saint Alphonsus Health System'],
        phoneNumber: '1234567890',
        npi: '1234567890',
        role: 'admin',
        isApproved: true,
        status: 'approved',
      });
      console.log('✅ Super Admin created');
    }

    process.exit();
  } catch (err) {
    console.error('❌ Failed to restore admin:', err);
    process.exit(1);
  }
};

createSuperAdmin();
