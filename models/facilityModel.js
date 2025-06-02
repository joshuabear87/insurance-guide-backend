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
      type: String, 
    },
    logoUrl: {
      type: String, 
    },
  },
  { timestamps: true }
);

const Facility = mongoose.model('Facility', facilitySchema);

export default Facility;
