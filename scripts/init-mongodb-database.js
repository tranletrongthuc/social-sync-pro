#!/usr/bin/env node

/**
 * Initialize MongoDB Database Script
 * 
 * This script initializes the MongoDB database with proper collections and indexes.
 * 
 * Usage:
 * 1. Set your MongoDB connection string in environment variable:
 *    - MONGODB_URI=your_mongodb_connection_string
 * 
 * 2. Run the script:
 *    node scripts/init-mongodb-database.js
 */

import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

// Validate configuration
if (!MONGODB_URI) {
  console.error('Error: Please set MONGODB_URI or DATABASE_URL environment variable');
  console.error('You can set it in .env.local file or as an environment variable');
  process.exit(1);
}

// Check if the MongoDB URI is a placeholder
if (MONGODB_URI.includes('<') && MONGODB_URI.includes('>')) {
  console.error('Error: Your MONGODB_URI contains placeholder values (< >)');
  console.error('Please replace the placeholder values in your MongoDB connection string');
  process.exit(1);
}

// Define collections and their indexes
const COLLECTIONS = [
  {
    name: 'brands',
    indexes: [
      { key: { brandId: 1 }, unique: true },
      { key: { name: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'brandValues',
    indexes: [
      { key: { brandId: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'keyMessages',
    indexes: [
      { key: { brandId: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'logoConcepts',
    indexes: [
      { key: { brandId: 1 } },
      { key: { logoId: 1 }, unique: true },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'mediaPlanGroups',
    indexes: [
      { key: { brandId: 1 } },
      { key: { planId: 1 }, unique: true },
      { key: { name: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'mediaPlanPosts',
    indexes: [
      { key: { mediaPlanId: 1 } },
      { key: { postId: 1 }, unique: true },
      { key: { brandId: 1 } },
      { key: { week: 1 } },
      { key: { scheduledAt: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'affiliateProducts',
    indexes: [
      { key: { brandId: 1 } },
      { key: { linkId: 1 }, unique: true },
      { key: { productId: 1 } },
      { key: { productName: 1 } },
      { key: { providerName: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'personas',
    indexes: [
      { key: { brandId: 1 } },
      { key: { personaId: 1 }, unique: true },
      { key: { nickName: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'trends',
    indexes: [
      { key: { brandId: 1 } },
      { key: { trendId: 1 }, unique: true },
      { key: { industry: 1 } },
      { key: { topic: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'ideas',
    indexes: [
      { key: { trendId: 1 } },
      { key: { ideaId: 1 }, unique: true },
      { key: { productId: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'socialAccounts',
    indexes: [
      { key: { personaId: 1 } },
      { key: { accountId: 1 }, unique: true },
      { key: { platform: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'aiServices',
    indexes: [
      { key: { serviceId: 1 }, unique: true },
      { key: { name: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'aiModels',
    indexes: [
      { key: { serviceId: 1 } },
      { key: { modelId: 1 }, unique: true },
      { key: { name: 1 } },
      { key: { provider: 1 } },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'adminSettings',
    indexes: [
      { key: { settingId: 1 }, unique: true },
      { key: { createdAt: -1 } }
    ]
  },
  {
    name: 'brandSettings',
    indexes: [
      { key: { brandId: 1 }, unique: true },
      { key: { createdAt: -1 } }
    ]
  }
];

async function initializeDatabase() {
  let client;
  
  try {
    console.log('Initializing MongoDB database...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db();
    
    // Create collections and indexes
    for (const collectionSpec of COLLECTIONS) {
      const { name, indexes } = collectionSpec;
      
      console.log(`\nSetting up collection: ${name}`);
      
      // Create collection if it doesn't exist
      try {
        await db.createCollection(name);
        console.log(`  ✓ Created collection ${name}`);
      } catch (error) {
        if (error.codeName === 'NamespaceExists') {
          console.log(`  ✓ Collection ${name} already exists`);
        } else {
          throw error;
        }
      }
      
      // Create indexes
      const collection = db.collection(name);
      for (const indexSpec of indexes) {
        try {
          await collection.createIndex(indexSpec.key, { ...indexSpec, background: true });
          console.log(`  ✓ Created index on ${Object.keys(indexSpec.key).join(', ')}`);
        } catch (error) {
          console.log(`  ⚠ Warning: Could not create index on ${Object.keys(indexSpec.key).join(', ')}: ${error.message}`);
        }
      }
    }
    
    console.log('\n✓ MongoDB database initialization completed successfully!');
  } catch (error) {
    console.error('✗ MongoDB database initialization failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('✓ Disconnected from MongoDB');
    }
  }
}

// Run initialization if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export default initializeDatabase;