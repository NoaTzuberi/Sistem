import mongoose from 'mongoose';
import { config } from './env';

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(config.databaseUrl);
  console.log('MongoDB connected');
}
