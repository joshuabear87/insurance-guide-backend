import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import { mongoDBURL } from '../config.js'; // Update if your config file is named differently

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(mongoDBURL);

    const email = 'admin@example.com'; // Set your superadmin email
    const password = 'SuperSecurePassword123'; // Set your superadmin password

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log('✅ Super Admin already exists');
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      const superAdmin = await User.create({
        username: 'Super Admin',
        email: email,
        password: hashedPassword,
        role: 'admin',
        isApproved: true,
      });

      console.log('🚀 Super Admin created successfully:', superAdmin.email);
    }

    process.exit();
  } catch (error) {
    console.error('Error creating Super Admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
