#!/usr/bin/env node

/**
 * Test MongoDB Connection Script
 * 
 * This script tests the connection to MongoDB using the connection URI.
 * 
 * Usage:
 * 1. Set your MongoDB connection string in environment variable:
 *    - MONGODB_URI=your_mongodb_connection_string
 * 
 * 2. Run the script:
 *    node scripts/test-mongodb-connection.js
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

console.log('Debug: Script started');
console.log('Debug: MONGODB_URI =', MONGODB_URI ? 'Set' : 'Not set');

// Validate configuration
if (!MONGODB_URI) {
  console.error('Error: Please set MONGODB_URI or DATABASE_URL environment variable');
  console.error('You can set it in .env.local file or as an environment variable');
  process.exit(1);
}

// Check if the MongoDB URI is a placeholder
if (MONGODB_URI.includes('<') && MONGODB_URI.includes('>')) {
  console.error('Error: Your MONGODB_URI contains placeholder values (< >)');
  console.error('Please replace the placeholder values in your MongoDB connection string:');
  console.error('- Replace <tk100mil_db_user> with your actual MongoDB username');
  console.error('- Replace <2SYS0fc5FjRZwBiN> with your actual MongoDB password');
  console.error('');
  console.error('Your current MONGODB_URI:');
  console.error(MONGODB_URI);
  process.exit(1);
}

console.log('Debug: About to check if script should run');

// Check if script is executed directly
const scriptPath = fileURLToPath(import.meta.url);
const argv1Path = process.argv[1];
console.log('Debug: scriptPath =', scriptPath);
console.log('Debug: argv1Path =', argv1Path);

// Normalize paths for comparison
const normalizedScriptPath = scriptPath.replace(/\\/g, '/');
const normalizedArgv1Path = argv1Path.replace(/\\/g, '/');

const isDirectExecution = normalizedScriptPath === normalizedArgv1Path;
console.log('Debug: isDirectExecution =', isDirectExecution);
console.log('Debug: normalizedScriptPath =', normalizedScriptPath);
console.log('Debug: normalizedArgv1Path =', normalizedArgv1Path);

async function testConnection() {
  let client;
  
  try {
    console.log('Testing MongoDB connection...');
    console.log(`Using MongoDB URI: ${MONGODB_URI.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)(@.*)/, '$1****:****$4')}`);
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✓ Connected to MongoDB successfully');
    
    // Get database info
    const db = client.db();
    const dbName = db.databaseName;
    console.log(`✓ Database name: ${dbName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`✓ Found ${collections.length} collections:`);
    collections.forEach((collection, index) => {
      console.log(`  ${index + 1}. ${collection.name}`);
    });
    
    console.log('\n✓ MongoDB connection test completed successfully!');
  } catch (error) {
    console.error('✗ MongoDB connection test failed:', error.message);
    console.error('');
    console.error('Troubleshooting tips:');
    console.error('1. Check that your MongoDB URI is correct');
    console.error('2. Ensure your IP address is whitelisted in MongoDB Atlas');
    console.error('3. Verify your username and password are correct');
    console.error('4. Make sure your MongoDB cluster is running');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('✓ Disconnected from MongoDB');
    }
  }
}

// Run test if script is executed directly
if (isDirectExecution) {
  console.log('Debug: Running test connection');
  testConnection();
} else {
  console.log('Debug: Script imported as module, not running test');
}

export default testConnection;