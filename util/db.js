// util/db.js (ESM)
import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  // accept MONGO_URI (yours) or MONGODB_URI (common default)
  const uri = process.env.MONGO_URI ?? process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI/MONGODB_URI is not set');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  isConnected = true;
  return mongoose.connection;
}

export { mongoose };
