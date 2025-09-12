// models/payerContractModel.js
import mongoose from 'mongoose';

export const FINANCIAL_CLASSES = ['Commercial', 'Medi-Cal', 'Medicare', 'Other'];
export const CONTRACT_STATUSES = ['Contracted', 'Not Contracted', 'Out of Network', 'Termed', 'Pending'];

const PhoneSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'General', trim: true },
    number: { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true },
  },
  { _id: true } // keep per-row ObjectIds for easy edits/deletes client-side
);

const PortalSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true }, // e.g., "Eligibility portal"
    url: { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true },
  },
  { _id: true }
);

const PayerContractSchema = new mongoose.Schema(
  {
    payerName:       { type: String, required: true, trim: true },
    payerName_lc:    { type: String, required: true, index: true },

    facilityName:    { type: String, required: true, trim: true },
    facilityName_lc: { type: String, required: true, index: true },

    financialClass:  { type: String, enum: FINANCIAL_CLASSES, required: true },
    status:          { type: String, enum: CONTRACT_STATUSES, required: true },

    notes:           { type: String, default: '' },

    effectiveStart:  { type: Date, default: null },
    effectiveEnd:    { type: Date, default: null },

    // NEW
    phones:  { type: [PhoneSchema], default: [] },
    portals: { type: [PortalSchema], default: [] },
  },
  { timestamps: true }
);

// Uniqueness: prevent duplicates per (payer, facility, financialClass)
PayerContractSchema.index(
  { payerName_lc: 1, facilityName_lc: 1, financialClass: 1 },
  { unique: true }
);

// Normalize names + basic date validation
PayerContractSchema.pre('validate', function (next) {
  if (this.payerName)    this.payerName_lc    = this.payerName.trim().toLowerCase();
  if (this.facilityName) this.facilityName_lc = this.facilityName.trim().toLowerCase();

  if (this.effectiveStart && this.effectiveEnd && this.effectiveEnd < this.effectiveStart) {
    return next(new Error('effectiveEnd must be on/after effectiveStart'));
  }
  return next();
});

const PayerContract = mongoose.model('PayerContract', PayerContractSchema);
export default PayerContract;
