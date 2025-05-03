import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';

dotenv.config(); // Loads the .env file

const MONGO_URI = process.env.MONGO_URI;

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const email = 'admin@example.com';
    const password = 'SuperSecurePassword123';

    let user = await User.findOne({ email });

    if (user) {
      user.password = await bcrypt.hash(password, 10);
      user.isApproved = true;
      user.status = 'approved';
      user.role = 'admin';
      user.facilityName = user.facilityName || 'Default Admin Org';
      await user.save();
      console.log('✅ Admin user restored');
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        username: 'Super Admin',
        email,
        password: hashedPassword,
        role: 'admin',
        isApproved: true,
        status: 'approved',
        facilityName: 'Default Admin Org',
      });
      console.log('✅ Admin user created');
    }

    process.exit();
  } catch (err) {
    console.error('❌ Failed to restore admin:', err);
    process.exit(1);
  }
};

createSuperAdmin();
