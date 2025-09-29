import { MongoClient, ObjectId } from 'mongodb';
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

// ========== UTILITY FUNCTIONS ==========

function createIdFilter(id, fieldName = '_id') {
  if (ObjectId.isValid(id)) {
    return { [fieldName]: new ObjectId(id) };
  } else {
    return { [fieldName === '_id' ? 'id' : fieldName]: id };
  }
}

// ========== TEMPLATE FUNCTIONS ==========

class CRUDTemplate {
  constructor(collectionName, transformFn = null) {
    this.collectionName = collectionName;
    this.transformFn = transformFn || ((record) => ({ ...record, id: record._id.toString() }));
  }

  async create(db, document, generateId = true) {
    const collection = db.collection(this.collectionName);
    
    if (generateId) {
      const objectId = new ObjectId();
      const fullDocument = {
        ...document,
        _id: objectId,
        id: objectId.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await collection.insertOne(fullDocument);
      return { id: objectId.toString(), document: fullDocument };
    } else {
      await collection.insertOne({ ...document, createdAt: new Date(), updatedAt: new Date() });
      return { id: document._id?.toString(), document };
    }
  }

  async update(db, id, document) {
    const collection = db.collection(this.collectionName);
    const result = await collection.updateOne(
      createIdFilter(id),
      { $set: { ...document, updatedAt: new Date() } },
      { upsert: true }
    );
    return result;
  }

  async findOne(db, filter) {
    const collection = db.collection(this.collectionName);
    const record = await collection.findOne(filter);
    return record ? this.transformFn(record) : null;
  }

  getCollection(db) {
    return db.collection(this.collectionName);
  }
}

const brandsTemplate = new CRUDTemplate('brands');
const adminSettingsTemplate = new CRUDTemplate('adminSettings');
const mediaPlanPostsTemplate = new CRUDTemplate('mediaPlanPosts');

export async function createOrUpdateBrand(db, assets, brandId) {
    const brandDocument = {
      name: assets.brandFoundation?.brandName || '',
      mission: assets.brandFoundation?.mission || '',
      usp: assets.brandFoundation?.usp || '',
      targetAudience: assets.brandFoundation?.targetAudience || '',
      personality: assets.brandFoundation?.personality || '',
      values: assets.brandFoundation?.values || [],
      keyMessaging: assets.brandFoundation?.keyMessaging || [],
      coreMediaAssets: assets.coreMediaAssets || { logoConcepts: [], colorPalette: [], fontRecommendations: [] },
      unifiedProfileAssets: assets.unifiedProfileAssets || {},
      settings: assets.settings || {},
      // Include modelUsed if available
      modelUsed: assets.modelUsed
    };

    if (brandId) {
      await brandsTemplate.update(db, brandId, brandDocument);
      return { brandId };
    } else {
      const adminSettings = await adminSettingsTemplate.findOne(db, {});
      const newBrandSettings = adminSettings ? {
        language: adminSettings.language,
        totalPostsPerMonth: adminSettings.totalPostsPerMonth,
        mediaPromptSuffix: adminSettings.mediaPromptSuffix,
        affiliateContentKit: adminSettings.affiliateContentKit,
        textGenerationModel: adminSettings.textGenerationModel,
        imageGenerationModel: adminSettings.imageGenerationModel,
        contentPillars: adminSettings.contentPillars || [],
        prompts: { rules: { imagePrompt: [], postCaption: [], shortVideoScript: [], longVideoScript: [] } }
      } : {};

      brandDocument.settings = newBrandSettings;
      const { id } = await brandsTemplate.create(db, brandDocument);
      return { brandId: id };
    }
}

export async function savePersonas(db, personas) {
    const collection = db.collection('personas');
    const personasWithIds = personas.map(p => {
        const objectId = new ObjectId();
        return {
            ...p,
            _id: objectId,
            id: objectId.toString(),
        };
    });
    const result = await collection.insertMany(personasWithIds);
    return result.insertedIds;
}

export async function updateMediaPlanPost(db, postId, updates) {
    const mediaPlanPostsCollection = mediaPlanPostsTemplate.getCollection(db);
    const filter = createIdFilter(postId);

    const updatePayload = { ...updates };
    delete updatePayload.id;

    updatePayload.updatedAt = new Date();

    const updateOperation = { $set: updatePayload };

    const result = await mediaPlanPostsCollection.updateOne(filter, updateOperation);

    if (result.matchedCount === 0) {
      console.warn(`--- updateMediaPlanPost did not find a document to update for id: ${postId} ---`);
    }
    
    return { success: true, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
}

export async function syncAssetMedia(db, brandId, assets) {
    const brand = await brandsTemplate.findOne(db, { _id: new ObjectId(brandId) });
    if (!brand) {
      throw new Error('Brand not found');
    }

    const brandUpdates = {
      'coreMediaAssets': assets.coreMediaAssets,
      'unifiedProfileAssets': assets.unifiedProfileAssets
    };
    
    await brandsTemplate.getCollection(db).updateOne(
      { _id: new ObjectId(brandId) },
      { $set: brandUpdates },
      { upsert: true }
    );
    
    return { success: true };
}