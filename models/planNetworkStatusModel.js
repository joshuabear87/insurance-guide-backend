// models/planNetworkStatusModel.js
import mongoose from 'mongoose';

const PlanNetworkStatusSchema = new mongoose.Schema(
  {
    key:   { type: String, required: true, trim: true, lowercase: true, unique: true }, // e.g., 'in_network'
    label: { type: String, required: true, trim: true },                                 // e.g., 'In Network'
    notes: { type: String, default: '', trim: true },
    // optional UI niceties:
    color: { type: String, default: '', trim: true }, // e.g., '#3b82f6' or 'green'
  },
  { timestamps: true }
);

const PlanNetworkStatus = mongoose.model('PlanNetworkStatus', PlanNetworkStatusSchema);
export default PlanNetworkStatus;
