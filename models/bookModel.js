import mongoose from 'mongoose';

const bookSchema = mongoose.Schema(
    {
      image: {
        type: String,
        default: '',
      },
      imagePublicId: {
        type: String,
        default: '',
      },
      secondaryImage: { 
        type: String, 
        default: '' },
      secondaryImagePublicId: { 
        type: String, 
        default: '' },
      descriptiveName: {
        type: String,
        required: true,
      },
      payerName: {
        type: String,
        required: true,
      },
      payerCode: {
        type: Number,
        required: true,
      },
      planName: {
        type: String,
        required: true,
      },
      planCode: {
        type: Number,
        required: true,
      },
      financialClass: {
        type: String,
        required: true,
        enum: ['Medi-Cal', 'Medicare', 'Commercial'],
      },
      samcContracted: {
        type: String,
        required: true,
      },
      samfContracted: {
        type: String,
        required: true,
      },
      notes: {
        type: String,
        default: '',
      },
    },
    {
      timestamps: true,
    }
  );

const Book = mongoose.model('InsuranceEntry', bookSchema);
export { Book };