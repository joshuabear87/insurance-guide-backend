import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    primaryColor: {
      type: String, // e.g., "#003366" or "#A30D1D"
    },
    logoUrl: {
      type: String, // optional
    },
  },
  { timestamps: true }
);

const Facility = mongoose.model('Facility', facilitySchema);

export default Facility;
