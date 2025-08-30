#!/usr/bin/env node

/**
 * Migration Status Checker Script
 * 
 * This script checks the status of your migration from Airtable to MongoDB.
 * 
 * Usage:
 * 1. Set your MongoDB connection string in environment variable:
 *    - MONGODB_URI=your_mongodb_connection_string
 * 
 * 2. Run the script:
 *    node scripts/check-migration-status.js
 */

import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
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

// Expected collections in SocialSync Pro
const EXPECTED_COLLECTIONS = [
  'brands',
  'brandValues',
  'keyMessages',
  'logoConcepts',
  'mediaPlanGroups',
  'mediaPlanPosts',
  'affiliateProducts',
  'personas',
  'trends',
  'ideas',
  'socialAccounts',
  'aiServices',
  'aiModels',
  'adminSettings',
  'brandSettings'
];

async function checkMigrationStatus() {
  let client;
  
  try {
    console.log('Checking migration status...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db();
    
    // Check if exported data exists
    const exportDir = path.join(import.meta.dirname, '..', 'exports');
    let exportExists = false;
    let exportedFiles = [];
    
    try {
      exportedFiles = await fs.readdir(exportDir);
      exportExists = exportedFiles.length > 0;
      console.log(`✓ Export directory exists with ${exportedFiles.length} files`);
    } catch (error) {
      console.log('⚠ Export directory does not exist or is empty');
    }
    
    // Check MongoDB collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`
MongoDB Collections Status:`);
    let migratedCollections = 0;
    
    for (const expectedCollection of EXPECTED_COLLECTIONS) {
      if (collectionNames.includes(expectedCollection)) {
        const count = await db.collection(expectedCollection).countDocuments();
        console.log(`  ✓ ${expectedCollection}: ${count} documents`);
        if (count > 0) migratedCollections++;
      } else {
        console.log(`  ✗ ${expectedCollection}: Collection missing`);
      }
    }
    
    // Determine overall status
    console.log(`
Migration Status Summary:`);
    
    if (migratedCollections === EXPECTED_COLLECTIONS.length) {
      console.log(`  ✓ All collections have been migrated`);
      console.log(`  ✓ Migration appears to be COMPLETE`);
    } else if (migratedCollections > 0) {
      console.log(`  ⚠ ${migratedCollections}/${EXPECTED_COLLECTIONS.length} collections have data`);
      console.log(`  ⚠ Migration appears to be PARTIALLY COMPLETE`);
    } else {
      console.log(`  ✗ No migrated collections found`);
      console.log(`  ✗ Migration has NOT BEEN STARTED`);
    }
    
    if (exportExists) {
      console.log(`  ✓ Export data is available (${exportedFiles.length} files)`);
    } else {
      console.log(`  ⚠ No export data found`);
    }
    
    // Recommendations
    console.log(`
Recommendations:`);
    
    if (migratedCollections === 0 && !exportExists) {
      console.log(`  1. Run 'npm run migrate:dry-run' to export your Airtable data`);
      console.log(`  2. Run 'npm run migrate' to perform a full migration`);
    } else if (migratedCollections === 0 && exportExists) {
      console.log(`  1. Run 'npm run migrate' to import your exported data to MongoDB`);
    } else if (migratedCollections > 0 && migratedCollections < EXPECTED_COLLECTIONS.length) {
      console.log(`  1. Check for migration errors in the console output`);
      console.log(`  2. Run 'npm run migrate' again to complete the migration`);
    } else if (migratedCollections === EXPECTED_COLLECTIONS.length) {
      console.log(`  1. Your migration is complete!`);
      console.log(`  2. Update your application to use MongoDB`);
    }
    
  } catch (error) {
    console.error('✗ Migration status check failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('✓ Disconnected from MongoDB');
    }
  }
}

// Run check if script is executed directly
const scriptPath = fileURLToPath(import.meta.url);
const argv1Path = process.argv[1];

// Normalize paths for comparison
const normalizedScriptPath = scriptPath.replace(/\\\\/g, '/');
const normalizedArgv1Path = argv1Path.replace(/\\\\/g, '/');

const isDirectExecution = normalizedScriptPath === normalizedArgv1Path;

if (isDirectExecution) {
  checkMigrationStatus();
}

export default checkMigrationStatus;