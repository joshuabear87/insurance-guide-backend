import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, default: '' },
    street2: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
  },
  { _id: false }
);

const contractSchema = new mongoose.Schema(
  {
    facilityName: {
      type: String,
      required: true,
    },
    contractStatus: {
      type: String,
      required: true,
      enum: ['Contracted', 'Not Contracted', 'Must Call', 'See Notes'],
    },
  },
  { _id: false } // Don't create an ID for each contract line
);

const bookSchema = mongoose.Schema(
  {
    facilityName: {
      type: String,
      required: true,
      enum: ['Saint Agnes Medical Center', 'Saint Alphonsus Health System'],
    },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    secondaryImage: { type: String, default: '' },
    secondaryImagePublicId: { type: String, default: '' },
    descriptiveName: { type: String, required: true },
    payerName: { type: String, required: true },
    planName: { type: String, required: true },
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
    financialClass: { type: String, required: true },
    notes: { type: String, default: '' },
    authorizationNotes: { type: String, default: '' },
    ipaPayerId: { type: String, default: '' },
    payerId: { type: String, default: '' },
    facilityAddress: { type: addressSchema, default: () => ({}) },
    providerAddress: { type: addressSchema, default: () => ({}) },
    portalLinks: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    phoneNumbers: [
      {
        title: { type: String, required: true },
        number: { type: String, required: true },
      },
    ],
    prefixes: [
      {
        value: {
          type: String,
          validate: {
            validator: function (v) {
              return /^[A-Z0-9]{3}$/i.test(v);
            },
            message: props => `${props.value} is not a valid 3-character prefix!`,
          },
          default: '',
        },
      },
    ],
    // New field to hold contract information for multiple facilities
    facilityContracts: [contractSchema],  // This will allow adding multiple contracts
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model('InsuranceEntry', bookSchema);
export { Book };
