// models/planPolicyModel.js
import mongoose from 'mongoose';

export const NETWORK_STATUSES = ['In Network', 'Out of Network'];

const PhoneSchema = new mongoose.Schema(
  { label: { type: String, default: 'General', trim: true },
    number:{ type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true } },
  { _id: true }
);

const PortalSchema = new mongoose.Schema(
  { label: { type: String, required: true, trim: true },
    url:   { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true } },
  { _id: true }
);

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Mailing', trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '', trim: true },
    city:  { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip:   { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true },
  },
  { _id: true }
);

const ServiceLocationPolicySchema = new mongoose.Schema(
  {
    locationName: { type: String, required: true, trim: true },
    decision:     { type: String, enum: ['Accept', 'Refer'], required: true },
    notes:        { type: String, default: '', trim: true },
  },
  { _id: true }
);

const PlanPolicySchema = new mongoose.Schema(
  {
    planName:     { type: String, required: true, trim: true },
    planName_lc:  { type: String, required: true, index: true },

    facilityName:    { type: String, required: true, trim: true },
    facilityName_lc: { type: String, required: true, index: true },

    networkStatus: { type: String, enum: NETWORK_STATUSES, required: true },

    notes: { type: String, default: '', trim: true },

    phones:   { type: [PhoneSchema],   default: [] },
    portals:  { type: [PortalSchema],  default: [] },
    addresses:{ type: [AddressSchema], default: [] },

    serviceLocationPolicies: { type: [ServiceLocationPolicySchema], default: [] },
  },
  { timestamps: true }
);

// One policy per (plan, facility)
PlanPolicySchema.index({ planName_lc: 1, facilityName_lc: 1 }, { unique: true });

PlanPolicySchema.pre('validate', function (next) {
  if (this.planName)     this.planName_lc     = this.planName.trim().toLowerCase();
  if (this.facilityName) this.facilityName_lc = this.facilityName.trim().toLowerCase();
  next();
});

const PlanPolicy = mongoose.model('PlanPolicy', PlanPolicySchema);
export default PlanPolicy;
