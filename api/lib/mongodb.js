import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env.local') });

// Global variables to cache the client and database connection
let cachedClient = null;
let cachedDb = null;

/**
 * MongoDB Connection Utility for Serverless Environments
 * 
 * This utility handles MongoDB connections in a serverless environment.
 * It implements connection caching to prevent creating new connections on every function invocation,
 * which would quickly exhaust the database connection pool.
 * 
 * The utility exports a function getClientAndDb() that returns a connected client and database instance.
 * It handles:
 * 1. Checking for cached connections
 * 2. Creating new connections when needed
 * 3. Properly connecting to MongoDB
 * 4. Caching connections for reuse
 * 
 * Usage:
 * import { getClientAndDb } from '../lib/mongodb.js';
 * const { client, db } = await getClientAndDb();
 * const collection = db.collection('collectionName');
 * // Perform database operations
 */

export async function getClientAndDb() {
  // Check if we have a cached connection
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Get MongoDB URI from environment variables
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  // Create a new MongoClient instance
  const client = new MongoClient(MONGODB_URI, {
    // Connection options for better performance in serverless environments
    useUnifiedTopology: true,
    useNewUrlParser: true,
    // Connection pool settings
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  try {
    // Connect to MongoDB
    await client.connect();
    
    // Get the database name from the URI or use a default
    const dbName = new URL(MONGODB_URI).pathname.substring(1) || 'socialsync';
    const db = client.db(dbName);
    
    // Cache the client and database for future use
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
}

/**
 * Helper function to close the MongoDB connection
 * This should be called when the application is shutting down
 */
export async function closeConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}