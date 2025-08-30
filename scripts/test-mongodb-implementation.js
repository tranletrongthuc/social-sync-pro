#!/usr/bin/env node

/**
 * Test MongoDB Implementation Script
 * 
 * This script tests that the MongoDB implementation is working correctly
 * by performing basic operations on a test collection.
 * 
 * Usage:
 * 1. Set your MongoDB connection string in environment variable:
 *    - MONGODB_URI=your_mongodb_connection_string
 * 
 * 2. Run the script:
 *    node scripts/test-mongodb-implementation.js
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

async function testImplementation() {
  let client;
  
  try {
    console.log('Testing MongoDB implementation...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db();
    
    // Test collection operations
    const testCollection = db.collection('test_collection');
    
    // Test document insertion
    const testDocument = {
      name: 'Test Document',
      value: 42,
      createdAt: new Date(),
      tags: ['test', 'mongodb', 'implementation']
    };
    
    const insertResult = await testCollection.insertOne(testDocument);
    console.log('✓ Inserted test document:', insertResult.insertedId);
    
    // Test document retrieval
    const retrievedDocument = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✓ Retrieved test document:', retrievedDocument.name, retrievedDocument.value);
    
    // Test document update
    const updateResult = await testCollection.updateOne(
      { _id: insertResult.insertedId },
      { $set: { value: 100, updatedAt: new Date() } }
    );
    console.log('✓ Updated test document:', updateResult.modifiedCount, 'document(s) modified');
    
    // Test document deletion
    const deleteResult = await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✓ Deleted test document:', deleteResult.deletedCount, 'document(s) deleted');
    
    // Test index creation
    await testCollection.createIndex({ name: 1 });
    console.log('✓ Created index on name field');
    
    // Test aggregation pipeline
    const pipeline = [
      { $match: { value: { $gte: 0 } } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ];
    
    const aggregationResult = await testCollection.aggregate(pipeline).toArray();
    console.log('✓ Aggregation pipeline executed successfully');
    
    console.log('\n✓ MongoDB implementation test completed successfully!');
  } catch (error) {
    console.error('✗ MongoDB implementation test failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('✓ Disconnected from MongoDB');
    }
  }
}

// Run test if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testImplementation();
}

export default testImplementation;