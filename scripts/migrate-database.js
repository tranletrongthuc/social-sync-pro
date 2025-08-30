#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script migrates data to MongoDB without changing the application code.
 * It preserves the same data structure and relationships while converting to MongoDB format.
 * 
 * Usage:
 * 1. Set your MongoDB connection string in environment variable:
 *    - MONGODB_URI=your_mongodb_connection_string
 * 
 * 2. Run the script:
 *    node scripts/migrate-database.js
 *    
 *    For dry run (export only):
 *    node scripts/migrate-airtable-to-mongodb.js --dry-run
 */

import fs from 'fs/promises';
import path from 'path';
import { MongoClient } from 'mongodb';
import Airtable from 'airtable';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

// Configuration
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
const DRY_RUN = process.argv.includes('--dry-run');

// Validate configuration
if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
  console.error('Error: Please set AIRTABLE_PAT and AIRTABLE_BASE_ID environment variables');
  console.error('You can set them in .env.local file or as environment variables');
  process.exit(1);
}

if (!DRY_RUN && (!MONGODB_URI || (MONGODB_URI.includes('<') && MONGODB_URI.includes('>')))) {
  console.error('Error: Please set a valid MONGODB_URI environment variable');
  console.error('You can set it in .env.local file or as an environment variable');
  console.error('Make sure to replace placeholder values (< >) with actual credentials');
  process.exit(1);
}

// Initialize Airtable
const airtable = new Airtable({ apiKey: AIRTABLE_PAT });
const base = airtable.base(AIRTABLE_BASE_ID);

// MongoDB collections mapping (Airtable table names to MongoDB collection names)
const COLLECTION_MAPPING = {
  'Brands': 'brands',
  'Brand_Values': 'brandValues',
  'Key_Messages': 'keyMessages',
  'Logo_Concepts': 'logoConcepts',
  'Media_Plans': 'mediaPlanGroups',
  'Posts': 'mediaPlanPosts',
  'Affiliate_Products': 'affiliateProducts',
  'Personas': 'personas',
  'Trends': 'trends',
  'Ideas': 'ideas',
  'Social_Accounts': 'socialAccounts',
  'AI_Services': 'aiServices',
  'AI_Models': 'aiModels',
  'Admin_Settings': 'adminSettings',
  'Brand_Settings': 'brandSettings'
};

// Field mappings for special transformations
const FIELD_MAPPINGS = {
  'Brands': {
    'brand_id': 'brandId',
    'name': 'name',
    'mission': 'mission',
    'usp': 'usp',
    'target_audience': 'targetAudience',
    'personality': 'personality',
    'color_palette_json': 'colorPaletteJson',
    'font_recs_json': 'fontRecsJson',
    'unified_profile_json': 'unifiedProfileJson',
    'logo_url': 'logoUrl'
  },
  'Brand_Values': {
    'brand': 'brandId', // This will be transformed to reference the brand record ID
    'text': 'text'
  },
  'Key_Messages': {
    'brand': 'brandId', // This will be transformed to reference the brand record ID
    'text': 'text'
  },
  'Logo_Concepts': {
    'brand': 'brandId', // This will be transformed to reference the brand record ID
    'logo_id': 'logoId',
    'style': 'style',
    'prompt': 'prompt',
    'image_key': 'imageKey',
    'image_url': 'imageUrl'
  },
  'Media_Plans': {
    'brand': 'brandId', // This will be transformed to reference the brand record ID
    'plan_id': 'planId',
    'name': 'name',
    'prompt': 'prompt',
    'source': 'source',
    'product_images_json': 'productImagesJson',
    'persona': 'personaId' // This will be transformed to reference the persona record ID
  },
  'Posts': {
    'media_plan': 'mediaPlanId', // This will be transformed to reference the media plan record ID
    'post_id': 'postId',
    'title': 'title',
    'week': 'week',
    'theme': 'theme',
    'platform': 'platform',
    'content_type': 'contentType',
    'content': 'content',
    'description': 'description',
    'hashtags': 'hashtags',
    'cta': 'cta',
    'media_prompt': 'mediaPrompt',
    'script': 'script',
    'image_key': 'imageKey',
    'image_url': 'imageUrl',
    'video_key': 'videoKey',
    'video_url': 'videoUrl',
    'media_order': 'mediaOrder',
    'source_urls': 'sourceUrls',
    'scheduled_at': 'scheduledAt',
    'published_at': 'publishedAt',
    'published_url': 'publishedUrl',
    'auto_comment': 'autoComment',
    'status': 'status',
    'is_pillar': 'isPillar',
    'brand': 'brandId', // This will be transformed to reference the brand record ID
    'promoted_products': 'promotedProductIds' // This will be transformed to reference product record IDs
  },
  'Affiliate_Products': {
    'brand': 'brandId', // This will be transformed to reference the brand record ID
    'link_id': 'linkId',
    'product_id': 'productId',
    'product_name': 'productName',
    'price': 'price',
    'sales_volume': 'salesVolume',
    'provider_name': 'providerName',
    'commission_rate': 'commissionRate',
    'commission_value': 'commissionValue',
    'product_link': 'productLink',
    'promotion_link': 'promotionLink',
    'product_avatar': 'productAvatar',
    'product_description': 'productDescription',
    'features': 'features',
    'use_cases': 'useCases',
    'customer_reviews': 'customerReviews',
    'product_rating': 'productRating',
    'product_image_links': 'productImageLinks'
  },
  'Personas': {
    'brand': 'brandId', // This will be transformed to reference the brand record ID
    'persona_id': 'personaId',
    'nick_name': 'nickName',
    'main_style': 'mainStyle',
    'activity_field': 'activityField',
    'outfit_description': 'outfitDescription',
    'avatar_image_key': 'avatarImageKey',
    'avatar_image_url': 'avatarImageUrl'
  },
  'Trends': {
    'brand': 'brandId', // This will be transformed to reference the brand record ID
    'trend_id': 'trendId',
    'industry': 'industry',
    'topic': 'topic',
    'keywords': 'keywords',
    'links_json': 'linksJson',
    'notes': 'notes',
    'analysis': 'analysis',
    'created_at': 'createdAt'
  },
  'Ideas': {
    'trend': 'trendId', // This will be transformed to reference the trend record ID
    'idea_id': 'ideaId',
    'title': 'title',
    'description': 'description',
    'target_audience': 'targetAudience',
    'product_id': 'productId'
  },
  'Social_Accounts': {
    'persona': 'personaId', // This will be transformed to reference the persona record ID
    'account_id': 'accountId',
    'platform': 'platform',
    'credentials_json': 'credentialsJson'
  },
  'AI_Services': {
    'service_id': 'serviceId',
    'name': 'name',
    'description': 'description'
  },
  'AI_Models': {
    'service': 'serviceId', // This will be transformed to reference the service record ID
    'model_id': 'modelId',
    'name': 'name',
    'provider': 'provider',
    'capabilities': 'capabilities'
  },
  'Admin_Settings': {
    'setting_id': 'settingId',
    'language': 'language',
    'total_posts_per_month': 'totalPostsPerMonth',
    'media_prompt_suffix': 'mediaPromptSuffix',
    'affiliate_content_kit': 'affiliateContentKit',
    'text_generation_model': 'textGenerationModel',
    'image_generation_model': 'imageGenerationModel',
    'text_model_fallback_order_json': 'textModelFallbackOrderJson',
    'vision_models_json': 'visionModelsJson'
  },
  'Brand_Settings': {
    'brand': 'brandId', // This will be transformed to reference the brand record ID
    'language': 'language',
    'total_posts_per_month': 'totalPostsPerMonth',
    'media_prompt_suffix': 'mediaPromptSuffix',
    'affiliate_content_kit': 'affiliateContentKit',
    'text_generation_model': 'textGenerationModel',
    'image_generation_model': 'imageGenerationModel',
    'text_model_fallback_order_json': 'textModelFallbackOrderJson',
    'vision_models_json': 'visionModelsJson'
  }
};

/**
 * Fetch all records from an Airtable table
 */
async function fetchAirtableRecords(tableName) {
  console.log(`Fetching records from Airtable table: ${tableName}`);
  const records = [];
  
  return new Promise((resolve, reject) => {
    base(tableName).select({
      // You can add view or filter options here if needed
    }).eachPage(function page(pageRecords, fetchNextPage) {
      // This function will get called for each page of records
      records.push(...pageRecords.map(record => ({
        id: record.id,
        fields: record.fields
      })));
      
      // To fetch the next page of records, call fetchNextPage.
      // If there are more records, `page` will get called again.
      // If there are no more records, `done` will get called.
      fetchNextPage();
    }, function done(err) {
      if (err) {
        console.error(`Error fetching records from ${tableName}:`, err);
        reject(err);
      } else {
        console.log(`Fetched ${records.length} records from ${tableName}`);
        resolve(records);
      }
    });
  });
}

/**
 * Transform Airtable records to MongoDB documents
 */
function transformRecords(records, tableName) {
  console.log(`Transforming ${records.length} records from ${tableName}`);
  
  return records.map(record => {
    const transformed = {
      _id: record.id, // Preserve Airtable record ID
      ...transformFields(record.fields, tableName)
    };
    
    // Add timestamps
    transformed.createdAt = new Date();
    transformed.updatedAt = new Date();
    
    return transformed;
  });
}

/**
 * Transform field names and values
 */
function transformFields(fields, tableName) {
  const transformed = {};
  const fieldMapping = FIELD_MAPPINGS[tableName] || {};
  
  for (const [airtableField, value] of Object.entries(fields)) {
    const mappedFieldName = fieldMapping[airtableField] || airtableField;
    
    // Handle special field transformations
    if (airtableField === 'brand' && Array.isArray(value)) {
      // Brand field is a linked record, extract the record ID
      transformed[mappedFieldName] = value[0]; // Take the first linked record ID
    } else if (airtableField === 'persona' && Array.isArray(value)) {
      // Persona field is a linked record, extract the record ID
      transformed[mappedFieldName] = value[0]; // Take the first linked record ID
    } else if (airtableField === 'media_plan' && Array.isArray(value)) {
      // Media plan field is a linked record, extract the record ID
      transformed[mappedFieldName] = value[0]; // Take the first linked record ID
    } else if (airtableField === 'trend' && Array.isArray(value)) {
      // Trend field is a linked record, extract the record ID
      transformed[mappedFieldName] = value[0]; // Take the first linked record ID
    } else if (airtableField === 'service' && Array.isArray(value)) {
      // Service field is a linked record, extract the record ID
      transformed[mappedFieldName] = value[0]; // Take the first linked record ID
    } else if (airtableField === 'promoted_products' && Array.isArray(value)) {
      // Promoted products field is an array of linked records, extract the record IDs
      transformed[mappedFieldName] = value; // Keep the array of record IDs
    } else {
      // Direct field mapping
      transformed[mappedFieldName] = value;
    }
  }
  
  return transformed;
}

/**
 * Insert documents into MongoDB collection
 */
async function insertDocuments(collection, documents) {
  if (documents.length === 0) {
    console.log(`No documents to insert into ${collection.collectionName}`);
    return;
  }
  
  console.log(`Inserting ${documents.length} documents into ${collection.collectionName}`);
  
  try {
    // Insert documents in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await collection.insertMany(batch);
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(documents.length/batchSize)} into ${collection.collectionName}`);
    }
    
    console.log(`Successfully inserted ${documents.length} documents into ${collection.collectionName}`);
  } catch (error) {
    console.error(`Error inserting documents into ${collection.collectionName}:`, error);
    throw error;
  }
}

/**
 * Export Airtable data to JSON files
 */
async function exportAirtableData() {
  console.log('Starting Airtable data export...');
  
  const exportDir = path.join(import.meta.dirname, '..', 'exports');
  await fs.mkdir(exportDir, { recursive: true });
  
  const exportData = {};
  
  // Fetch data from all tables
  for (const [tableName, collectionName] of Object.entries(COLLECTION_MAPPING)) {
    try {
      const records = await fetchAirtableRecords(tableName);
      exportData[collectionName] = records;
      
      // Save to individual JSON files
      const filePath = path.join(exportDir, `${collectionName}.json`);
      await fs.writeFile(filePath, JSON.stringify(records, null, 2));
      console.log(`Exported ${records.length} records to ${filePath}`);
    } catch (error) {
      console.error(`Failed to export ${tableName}:`, error);
    }
  }
  
  // Save all data to a single file
  const allDataFilePath = path.join(exportDir, 'airtable-export.json');
  await fs.writeFile(allDataFilePath, JSON.stringify(exportData, null, 2));
  console.log(`Exported all data to ${allDataFilePath}`);
  
  return exportData;
}

/**
 * Transform and import data to MongoDB
 */
async function importDataToMongoDB(airtableData) {
  if (DRY_RUN) {
    console.log('Skipping MongoDB import in dry-run mode');
    return;
  }
  
  console.log('Starting data import to MongoDB...');
  
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Transform and import data for each collection
    for (const [tableName, collectionName] of Object.entries(COLLECTION_MAPPING)) {
      const airtableRecords = airtableData[collectionName];
      
      if (!airtableRecords || airtableRecords.length === 0) {
        console.log(`No records found for ${collectionName}, skipping...`);
        continue;
      }
      
      // Transform records
      const mongoDocuments = transformRecords(airtableRecords, tableName);
      
      // Get or create collection
      const collection = db.collection(collectionName);
      
      // Insert documents
      await insertDocuments(collection, mongoDocuments);
    }
    
    console.log('Data import to MongoDB completed successfully!');
  } catch (error) {
    console.error('Error importing data to MongoDB:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log(`Starting Airtable to MongoDB migration (${DRY_RUN ? 'DRY RUN' : 'FULL MIGRATION'})...`);
  
  try {
    // Step 1: Export data from Airtable
    const airtableData = await exportAirtableData();
    
    // Step 2: Import data to MongoDB
    await importDataToMongoDB(airtableData);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if script is executed directly
const scriptPath = fileURLToPath(import.meta.url);
const argv1Path = process.argv[1];

// Normalize paths for comparison
const normalizedScriptPath = scriptPath.replace(/\\/g, '/');
const normalizedArgv1Path = argv1Path.replace(/\\/g, '/');

const isDirectExecution = normalizedScriptPath === normalizedArgv1Path;

if (isDirectExecution) {
  migrate();
}

export {
  fetchAirtableRecords,
  transformRecords,
  importDataToMongoDB,
  migrate
};