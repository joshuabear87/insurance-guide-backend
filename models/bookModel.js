import mongoose from 'mongoose';

const bookSchema = mongoose.Schema(
  {
    prefix: { type: String, default: '' },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    secondaryImage: { type: String, default: '' },
    secondaryImagePublicId: { type: String, default: '' },
    descriptiveName: { type: String, required: true },
    payerName: { type: String, required: true },
    payerCode: { type: Number, required: true },
    planName: { type: String, required: true },
    planCode: { type: Number, required: true },
    financialClass: { type: String, required: true },
    samcContracted: { type: String, required: true },
    samfContracted: { type: String, required: true },
    notes: { type: String, default: '' },
    authorizationNotes: { type: String, default: '' },
    ipaPayerId: { type: String, default: '' },    // Changed to String
    payerId: { type: String, default: '' },        // Changed to String
    facilityAddress: { type: String, default: '' },
    providerAddress: { type: String, default: '' },
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
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model('InsuranceEntry', bookSchema);
export { Book };
