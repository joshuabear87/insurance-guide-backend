import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    requestedFacility: {
      type: [String],
      enum: ['Saint Agnes Medical Center', 'Saint Alphonsus Health System'],
      required: true,
    },
    facilityAccess: {
      type: [String],
      enum: ['Saint Agnes Medical Center', 'Saint Alphonsus Health System'],
      default: [],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    department: { type: String }, // optional
    npi: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^\d{10}$/.test(v),
        message: 'NPI must be a valid 10-digit number',
      },
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isApproved: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
