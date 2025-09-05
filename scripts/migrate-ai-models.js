import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getClientAndDb } from '../api/lib/mongodb.js';
import { ObjectId } from 'mongodb';

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
  let client;
  try {
    const connection = await getClientAndDb();
    client = connection.client;
    const db = connection.db;

    console.log('Starting AI models migration...');

    const aiServicesCollection = db.collection('aiServices');
    const aiModelsCollection = db.collection('aiModels');
    const newAiModelsCollection = db.collection('aiModels');

    // 1. Read all services and models
    const allServices = await aiServicesCollection.find({}).toArray();
    const allModels = await aiModelsCollection.find({}).toArray();

    if (allModels.length === 0) {
      console.log('No models found in the "aiModels" collection. Nothing to migrate.');
      return;
    }
     if (allServices.length === 0) {
      console.log('No services found in the "aiServices" collection. Cannot map models to services.');
      return;
    }

    // Create a map for easy lookup
    const servicesMap = new Map(allServices.map(s => [s._id.toString(), s]));
    const newModels = [];

    // 2. Combine data into the new schema
    for (const model of allModels) {
      const service = servicesMap.get(model.serviceId);
      if (service) {
        newModels.push({
          _id: model._id, // Keep the same ID for consistency
          name: model.name,
          capabilities: model.capabilities || [],
          provider: model.provider,
          service: service.name, // Add the service name directly to the model
        });
      } else {
        console.warn(`- Model with name "${model.name}" has a serviceId "${model.serviceId}" that does not exist in the aiServices collection. It will be skipped.`);
      }
    }

    // 3. Insert into the new collection
    if (newModels.length > 0) {
      // We clear the collection first to ensure the migration can be re-run safely.
      await newAiModelsCollection.deleteMany({});
      const result = await newAiModelsCollection.insertMany(newModels);
      console.log(`\nSuccessfully inserted ${result.insertedCount} documents into the new "ai_models" collection.`);
      console.log('Migration completed successfully.');
      console.log('\nNext Steps:');
      console.log('1. Verify the data in the new "ai_models" collection in your MongoDB database.');
      console.log('2. Once verified, you can proceed with the code refactoring steps.');
      
    } else {
        console.log('No models were eligible for migration.');
    }

  } catch (error) {
    console.error('\n--- An error occurred during migration ---');
    console.error(error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

migrate();