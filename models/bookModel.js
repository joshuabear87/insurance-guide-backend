// models/bookModel.js
import mongoose from 'mongoose';

/** Embedded structured address (kept from your current model) */
const addressSchema = new mongoose.Schema(
  {
    street:  { type: String, default: '' },
    street2: { type: String, default: '' },
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    zip:     { type: String, default: '' },
  },
  { _id: false }
);

/** Embedded facility contract lines (kept from your current model) */
const contractSchema = new mongoose.Schema(
  {
    facilityName: {
      type: String,
      required: true,
      trim: true,
    },
    contractStatus: {
      type: String,
      required: true,
      enum: ['Contracted', 'Not Contracted', 'Must Call', 'See Notes'],
    },
  },
  { _id: false }
);

/**
 * Insurance Plan ("Book") schema
 * - Keeps all of your original fields
 * - Adds Central Hub references with *distinct names* to avoid collisions:
 *   - payerRef:     ref('Payer')
 *   - planCodeRef:  ref('PlanCode')
 *   - contactsRef:  ref('Contact')[]
 *   - portalLinks:  ref('PortalLink')[]  (already existed; used as the portal reference list)
 *   - contractedFacilities: ref('Facility')[]
 */
const bookSchema = new mongoose.Schema(
  {
    /** Immutable facility name per your rule */
    facilityName: { type: String, required: true, trim: true, immutable: true },

// models/bookModel.js (add this near other top-level fields)
facilityRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },

    /** Images */
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    secondaryImage: { type: String, default: '' },
    secondaryImagePublicId: { type: String, default: '' },

    /** Core identification */
    descriptiveName: { type: String, required: true, trim: true },
    payerName: { type: String, required: true, trim: true }, // display helper
    planName:  { type: String, required: true, trim: true }, // display helper

    /** Legacy numeric codes (kept for compatibility) */
    payerCode: {
      type: Number,
      required: true,
      min: [0, 'Payer Code must be a positive number'],
    },
    planCode: {
      type: Number,
      required: true,
      min: [0, 'Plan Code must be a positive number'],
    },

    /** Financials & notes */
    financialClass: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    authorizationNotes: { type: String, default: '' },

    /** RTE/IPA IDs (text) */
    ipaPayerId: { type: String, default: '' },
    payerId:    { type: String, default: '' },

    /** Embedded addresses (kept) */
    facilityAddress: { type: addressSchema, default: () => ({}) },
    providerAddress: { type: addressSchema, default: () => ({}) },

    /**
     * Central Hub references (NEW)
     * Use these to link live, reusable data.
     * Keeping names distinct to avoid collisions with your existing fields.
     */
    payerRef:     { type: mongoose.Schema.Types.ObjectId, ref: 'Payer' },
    planCodeRef:  { type: mongoose.Schema.Types.ObjectId, ref: 'PlanCode' },

    // You already use this as a portal reference list; leaving the name as-is:
    portalLinks:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'PortalLink' }],

    // Centralized phones/emails/faxes (Contact)
    contactsRef:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],

    // Optional: reference Facilities directly (alongside your facilityContracts array)
    contractedFacilities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Facility' }],

    /** Legacy freeform phone numbers (kept) */
    phoneNumbers: [
      {
        title:  { type: String, required: true, trim: true },
        number: { type: String, required: true, trim: true },
        _id: false,
      },
    ],

    /** Blue Card prefixes (kept) */
    prefixes: [
      {
        value: {
          type: String,
          validate: {
            validator: (v) => /^[A-Z0-9]{3}$/i.test(v),
            message: (props) => `${props.value} is not a valid 3-character prefix!`,
          },
          default: '',
        },
        _id: false,
      },
    ],

    /** Multi-facility contract lines (kept) */
    facilityContracts: [contractSchema],
  },
  { timestamps: true }
);

/** Helpful indexes for query performance */
bookSchema.index({ facilityName: 1, descriptiveName: 1 });
bookSchema.index({ payerCode: 1, planCode: 1 });
bookSchema.index({ 'prefixes.value': 1 });
bookSchema.index({ payerRef: 1, planCodeRef: 1 });
bookSchema.index({ 'contractedFacilities': 1 });
bookSchema.index({ facilityRef: 1, payerRef: 1, planCodeRef: 1 });


const Book = mongoose.model('InsuranceEntry', bookSchema);
export { Book };
