  import { MongoClient } from 'mongodb';
  import dotenv from 'dotenv';

  // Load environment variables from .env.local
  // This will not override variables set by the Vercel platform in production.
  dotenv.config({ path: '.env.local' });

  // Use the local/dev variable if it exists, otherwise fall back to the one from the Vercel environment.
  const MONGODB_URI = process.env.DEV_MONGODB_URI || process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    // This error will now only trigger if no URI is found in .env.local or in the Vercel platform settings.
    throw new Error('Please define the MONGODB_URI or DEV_MONGODB_URI environment variable.');
  }

  // Global variable to hold the cached database instance
  let cachedDb = null;

  /**
   * Connect to the database and cache the connection
   */
  export async function getClientAndDb() {
    if (cachedDb) {
      return cachedDb;
    }

    // If no cached connection, create a new one
    const client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Select the database from the connection string
    const db = client.db();

    // Cache the database instance
    cachedDb = { client, db };

    return cachedDb;
  }