import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb() {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000
  });
}
