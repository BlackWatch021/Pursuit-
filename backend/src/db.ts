import mongoose from 'mongoose';
import { config } from './config';

/**
 * Connects to MongoDB.
 * - If MONGODB_URI is set (e.g. MongoDB Atlas), connects to it (cloud sync).
 * - Otherwise spins up an in-memory MongoDB so the API runs locally with zero setup.
 *   NOTE: in-memory data is NOT persisted across restarts — for dev/demo only.
 */
export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  let uri = config.mongoUri;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri('pursuit');
    console.warn(
      '[db] No MONGODB_URI set — using an in-memory MongoDB (data is NOT persisted). ' +
        'Set MONGODB_URI in backend/.env for cloud sync via MongoDB Atlas.',
    );
  }

  await mongoose.connect(uri);
  console.log('[db] Connected to MongoDB');
}
