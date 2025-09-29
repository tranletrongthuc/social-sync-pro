import { getClientAndDb } from '../server_lib/mongodb.js';
import { allowCors } from '../server_lib/cors.js';
import { ObjectId } from 'mongodb';
import { defaultPrompts } from '../server_lib/defaultPrompts.js';

// ========== UTILITY FUNCTIONS ==========

const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj);

function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

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

  async delete(db, id, additionalFilter = {}) {
    const collection = db.collection(this.collectionName);
    const filter = { ...createIdFilter(id), ...additionalFilter };
    const result = await collection.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async findByBrand(db, brandId) {
    const collection = db.collection(this.collectionName);
    const records = await collection.find({ brandId }).toArray();
    return records.map(this.transformFn);
  }

  async findOne(db, filter) {
    const collection = db.collection(this.collectionName);
    const record = await collection.findOne(filter);
    return record ? this.transformFn(record) : null;
  }

  async findAll(db, filter = {}) {
    const collection = db.collection(this.collectionName);
    const records = await collection.find(filter).toArray();
    return records.map(this.transformFn);
  }

  async bulkWrite(db, operations) {
    const collection = db.collection(this.collectionName);
    return await collection.bulkWrite(operations);
  }

  getCollection(db) {
    return db.collection(this.collectionName);
  }
}

async function saveEntityTemplate(db, collectionName, entity, brandId = null, additionalFields = {}) {
  const collection = db.collection(collectionName);
  
  const document = {
    ...entity,
    ...additionalFields,
    ...(brandId && { brandId }),
    updatedAt: new Date()
  };

  if (entity.id && ObjectId.isValid(entity.id)) {
    await collection.updateOne(
      createIdFilter(entity.id),
      { $set: document },
      { upsert: true }
    );
    return entity.id;
  } else {
    const objectId = new ObjectId();
    const fullDocument = {
      ...document,
      _id: objectId,
      id: objectId.toString(),
      createdAt: new Date()
    };
    await collection.insertOne(fullDocument);
    return objectId.toString();
  }
}

async function bulkSaveTemplate(db, collectionName, entities, brandId, transformFn = null) {
  const collection = db.collection(collectionName);
  const operations = [];
  const newEntities = [];

  for (const entity of entities) {
    let document = {
      ...entity,
      brandId,
      updatedAt: new Date()
    };

    if (transformFn) {
      document = transformFn(document);
    }

    if (entity.id && ObjectId.isValid(entity.id)) {
      operations.push({
        updateOne: {
          filter: createIdFilter(entity.id),
          update: { $set: document }
        }
      });
    } else {
      const objectId = new ObjectId();
      const fullDocument = {
        ...document,
        _id: objectId,
        id: objectId.toString(),
        createdAt: new Date()
      };
      newEntities.push(fullDocument);
      operations.push({
        insertOne: { document: fullDocument }
      });
    }
  }

  if (operations.length > 0) {
    await collection.bulkWrite(operations);
  }

  return newEntities;
}

function createHandler(action, handlerFn) {
  return async (request, response, db) => {
    console.log(`--- Received request for /api/mongodb/${action} ---`);
    try {
      const data = request.method === 'GET' ? request.query : request.body;
      const result = await handlerFn(data, db);
      response.status(200).json(result);
      console.log(`--- ${action} completed ---`);
    } catch (error) {
      console.error(`--- CRASH in /api/mongodb/${action} ---`);
      console.error('Error object:', error);
      throw error;
    }
  };
}

function paginateArray(array, page = 1, limit = 30) {
  const offset = (page - 1) * limit;
  const paginatedItems = array.slice(offset, offset + limit);
  
  return {
    items: paginatedItems,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(array.length / limit),
      totalItems: array.length,
      hasNextPage: offset + limit < array.length,
      hasPrevPage: page > 1
    }
  };
}

// ========== COLLECTION TEMPLATES ==========

const affiliateProductsTemplate = new CRUDTemplate('affiliateProducts', (record) => ({
  id: record._id.toString(),
  productId: record.productId,
  productName: record.productName,
  price: record.price,
  salesVolume: record.salesVolume,
  providerName: record.providerName,
  commissionRate: record.commissionRate,
  commissionValue: record.commissionValue,
  productLink: record.productLink,
  promotionLink: record.promotionLink,
  product_description: record.productDescription,
  features: record.features || [],
  use_cases: record.useCases || [],
  customer_reviews: record.customerReviews,
  product_rating: record.productRating,
  product_avatar: record.productAvatar,
  product_image_links: record.productImageLinks || []
}));

const personasTemplate = new CRUDTemplate('personas', (record) => ({ ...record, id: record._id?.toString(), modelUsed: record.modelUsed }));
const trendsTemplate = new CRUDTemplate('trends', (record) => ({ ...record, id: record._id?.toString(), modelUsed: record.modelUsed }));
const ideasTemplate = new CRUDTemplate('ideas', (record) => ({ ...record, id: record._id?.toString(), modelUsed: record.modelUsed }));
const aiModelsTemplate = new CRUDTemplate('aiModels');
const brandsTemplate = new CRUDTemplate('brands');
const mediaPlanGroupsTemplate = new CRUDTemplate('mediaPlanGroups', (record) => ({ ...record, id: record._id?.toString(), modelUsed: record.modelUsed }));
const mediaPlanPostsTemplate = new CRUDTemplate('mediaPlanPosts', (record) => ({ ...record, id: record._id?.toString(), modelUsed: record.modelUsed }));
const adminSettingsTemplate = new CRUDTemplate('adminSettings');

// ========== INITIAL SETTINGS ==========

const initialSettings = {
  language: "English",
  totalPostsPerMonth: 30,
  mediaPromptSuffix: "",
  affiliateContentKit: "",
  textGenerationModel: "gemini-1.5-pro-latest",
  imageGenerationModel: "dall-e-3",
  textModelFallbackOrder: [],
  visionModels: [],
  contentPillars: [],
  prompts: defaultPrompts,
};

// ========== ALL HANDLER DEFINITIONS ==========

const handlers = {
  'delete-affiliate-link': createHandler('delete-affiliate-link', async ({ linkId }) => {
    if (!linkId) {
      throw new Error('Missing linkId');
    }
    const { db } = await getClientAndDb();
    const success = await affiliateProductsTemplate.delete(db, linkId);
    return { success };
  }),

  'delete-ai-model': createHandler('delete-ai-model', async ({ modelId }) => {
    const { db } = await getClientAndDb();
    const success = await aiModelsTemplate.delete(db, modelId);
    return { success };
  }),

  'delete-persona': createHandler('delete-persona', async ({ personaId, brandId }) => {
    const { db } = await getClientAndDb();
    const success = await personasTemplate.delete(db, personaId, { brandId });
    return { success };
  }),

  'delete-trend': createHandler('delete-trend', async ({ trendId, brandId }) => {
    const { db } = await getClientAndDb();
    
    const success = await trendsTemplate.delete(db, trendId, { brandId });
    await ideasTemplate.getCollection(db).deleteMany({ trendId });

    return { success };
  }),

  'fetch-affiliate-links': createHandler('fetch-affiliate-links', async ({ brandId }) => {
    const { db } = await getClientAndDb();
    const affiliateLinks = await affiliateProductsTemplate.findByBrand(db, brandId);
    return { affiliateLinks };
  }),

  'fetch-settings': createHandler('fetch-settings', async ({ brandId }) => {
    const { db } = await getClientAndDb();
    const brand = await brandsTemplate.findOne(db, { _id: new ObjectId(brandId) });
    return brand?.settings || {};
  }),

  'load-personas': createHandler('load-personas', async ({ brandId }) => {
    if (!brandId) {
      throw new Error('Missing brandId');
    }
    const { db } = await getClientAndDb();
    const personas = await personasTemplate.findByBrand(db, brandId);
    
    // Add modelUsed to each persona
    const personasWithModel = personas.map(persona => ({
      ...persona,
      modelUsed: persona.modelUsed
    }));
    
    return { personas: personasWithModel };
  }),

'load-strategy-hub': createHandler('load-strategy-hub', async ({ brandId }) => {
    if (!brandId) {
      throw new Error('Missing brandId');
    }
    const { db } = await getClientAndDb();
    
    // 1. Fetch all trends and ideas for the brand in parallel.
    const [trends, allIdeas] = await Promise.all([
      trendsTemplate.findByBrand(db, brandId),
      ideasTemplate.findAll(db, { brandId })
    ]);

    // 2. Create a map to count ideas per trend.
    const ideaCountMap = new Map();
    for (const idea of allIdeas) {
      if (idea.trendId) {
        ideaCountMap.set(idea.trendId, (ideaCountMap.get(idea.trendId) || 0) + 1);
      }
    }

    // 3. Map over trends and add the ideaCount.
    const trendsWithCounts = trends.map(trend => ({
      ...trend,
      ideaCount: ideaCountMap.get(trend.id) || 0
    }));

    return { trends: trendsWithCounts };
  }),

  'load-ideas-for-trend': createHandler('load-ideas-for-trend', async ({ trendId }) => {
    const { db } = await getClientAndDb();
    const ideas = await ideasTemplate.findAll(db, { trendId });
    
    // Add modelUsed to each idea
    const ideasWithModel = ideas.map(idea => ({
      ...idea,
      modelUsed: idea.modelUsed
    }));
    
    return { ideas: ideasWithModel };
  }),

  'load-trend': createHandler('load-trend', async ({ trendId, brandId }) => {
    const { db } = await getClientAndDb();
    const trend = await trendsTemplate.findOne(db, { _id: new ObjectId(trendId), brandId });
    if (!trend) {
      throw new Error('Trend not found');
    }
    return { trend: { ...trend, modelUsed: trend.modelUsed } };
  }),

  'load-affiliate-vault': createHandler('load-affiliate-vault', async ({ brandId }) => {
    if (!brandId) {
      throw new Error('Missing brandId');
    }
    const { db } = await getClientAndDb();
    const affiliateLinks = await affiliateProductsTemplate.findByBrand(db, brandId);
    return { affiliateLinks };
  }),

  'save-affiliate-links': createHandler('save-affiliate-links', async ({ links, brandId }) => {
    const { db } = await getClientAndDb();
    const newLinks = await bulkSaveTemplate(db, 'affiliateProducts', links, brandId);
    return { success: true, links: newLinks };
  }),

  'save-persona': createHandler('save-persona', async ({ persona, brandId }) => {
    const { db } = await getClientAndDb();
    const personaDocument = {
      ...persona,
      modelUsed: persona.modelUsed  // Preserve modelUsed if provided
    };
    const id = await saveEntityTemplate(db, 'personas', personaDocument, brandId);
    return { id };
  }),

  'save-trend': createHandler('save-trend', async ({ trend, brandId }) => {
    const { db } = await getClientAndDb();
    const trendDocument = {
      industry: trend.industry,
      topic: trend.topic,
      keywords: trend.keywords || [],
      links: trend.links || [],
      notes: trend.notes,
      analysis: trend.analysis,
      createdAt: trend.createdAt,
      searchVolume: trend.searchVolume,
      competitionLevel: trend.competitionLevel,
      peakTimeFrame: trend.peakTimeFrame,
      geographicDistribution: trend.geographicDistribution,
      relatedQueries: trend.relatedQueries,
      trendingScore: trend.trendingScore,
      sourceUrls: trend.sourceUrls,
      category: trend.category,
      sentiment: trend.sentiment,
      predictedLifespan: trend.predictedLifespan,
      modelUsed: trend.modelUsed  // Preserve modelUsed if provided
    };
    
    const id = await saveEntityTemplate(db, 'trends', { ...trendDocument, id: trend.id }, brandId);
    return { id };
  }),

  'save-trends': createHandler('save-trends', async ({ trends, brandId }) => {
    const { db } = await getClientAndDb();
    const savedTrends = await bulkSaveTemplate(db, 'trends', trends, brandId);
    return { trends: savedTrends };
  }),

  'save-ideas': createHandler('save-ideas', async ({ ideas, brandId }) => {
    const { db } = await getClientAndDb();
    // Add modelUsed to each idea if not already present
    const ideasWithModel = ideas.map(idea => ({
      ...idea,
      modelUsed: idea.modelUsed  // Preserve modelUsed if provided
    }));
    const newIdeas = await bulkSaveTemplate(db, 'ideas', ideasWithModel, brandId);
    return { success: true, ideas: newIdeas };
  }),

  'save-ai-model': createHandler('save-ai-model', async ({ model }) => {
    const { db } = await getClientAndDb();
    const modelDocument = {
      name: model.name,
      provider: model.provider,
      capabilities: model.capabilities || [],
      service: model.service
    };
    
    const id = await saveEntityTemplate(db, 'aiModels', { ...modelDocument, id: model.id });
    return { id };
  }),

  'save-settings': createHandler('save-settings', async ({ settings, brandId }) => {
    const { db } = await getClientAndDb();
    const slimSettings = {
      language: settings.language,
      totalPostsPerMonth: settings.totalPostsPerMonth,
      mediaPromptSuffix: settings.mediaPromptSuffix,
      affiliateContentKit: settings.affiliateContentKit,
      textGenerationModel: settings.textGenerationModel,
      imageGenerationModel: settings.imageGenerationModel,
      textModelFallbackOrder: settings.textModelFallbackOrder,
      visionModels: settings.visionModels,
      contentPillars: settings.contentPillars,
      prompts: {
        rules: settings.prompts?.rules || {}
      }
    };
    
    await brandsTemplate.update(db, brandId, { settings: slimSettings });
    return { success: true };
  }),

  'save-admin-defaults': createHandler('save-admin-defaults', async (settings) => {
    const { db } = await getClientAndDb();
    const settingsToSave = {
      ...settings,
      prompts: deepMerge(defaultPrompts, settings.prompts || {})
    };
    
    const collection = adminSettingsTemplate.getCollection(db);
    await collection.updateOne(
      {},
      { $set: { ...settingsToSave, updatedAt: new Date() } },
      { upsert: true }
    );
    
    return { success: true };
  }),

  'bulk-patch-posts': createHandler('bulk-patch-posts', async ({ updates }) => {
    const { db } = await getClientAndDb();
    const bulkOperations = updates.map(update => ({
      updateOne: {
        filter: createIdFilter(update.postId),
        update: { $set: update.fields }
      }
    }));
    
    const result = await mediaPlanPostsTemplate.bulkWrite(db, bulkOperations);
    return { success: true, modifiedCount: result.modifiedCount };
  }),

  'bulk-update-post-schedules': createHandler('bulk-update-post-schedules', async ({ updates }) => {
    const { db } = await getClientAndDb();
    const bulkOperations = updates.map(update => ({
      updateOne: {
        filter: createIdFilter(update.postId),
        update: { 
          $set: { 
            scheduledAt: update.scheduledAt,
            status: update.status
          }
        }
      }
    }));
    
    const result = await mediaPlanPostsTemplate.bulkWrite(db, bulkOperations);
    return { success: true, modifiedCount: result.modifiedCount };
  }),

  'check-credentials': createHandler('check-credentials', async () => {
    const { MONGODB_URI } = process.env;
    if (!MONGODB_URI) {
      throw new Error('Missing MONGODB_URI in environment variables');
    }
    
    const { db } = await getClientAndDb();
    const collections = await db.listCollections().toArray();
    return { success: true, collections: collections.map(c => c.name) };
  }),

  'ensure-tables': createHandler('ensure-tables', async () => {
    return { success: true };
  }),

  'check-product-exists': createHandler('check-product-exists', async ({ productId }) => {
    const { db } = await getClientAndDb();
    const productRecord = await affiliateProductsTemplate.findOne(db, { productId });
    return { exists: !!productRecord };
  }),

  'app-init': createHandler('app-init', async () => {
    const { MONGODB_URI } = process.env;
    if (!MONGODB_URI) {
      return { credentialsSet: false, brands: [], adminDefaults: {}, aiModels: [] };
    }

    const { db } = await getClientAndDb();
    await db.command({ ping: 1 });

    const brands = await brandsTemplate.findAll(db);
    const brandsList = brands
      .filter(brand => brand._id && brand.name)
      .map(brand => ({
        id: brand._id.toString(),
        name: brand.name
      }));

    const [settingsRecord, aiModels] = await Promise.all([
      adminSettingsTemplate.findOne(db, {}),
      aiModelsTemplate.findAll(db)
    ]);

    let adminDefaults = settingsRecord;
    if (!adminDefaults || !adminDefaults.prompts) {
      console.log('No admin prompts found in DB, initializing...');
      const collection = adminSettingsTemplate.getCollection(db);
      await collection.updateOne(
        {},
        { $set: { ...initialSettings, updatedAt: new Date() } },
        { upsert: true }
      );
      adminDefaults = await adminSettingsTemplate.findOne(db, {});
    }

    return { 
      credentialsSet: true, 
      brands: brandsList, 
      adminDefaults: adminDefaults || {}, 
      aiModels 
    };
  }),

  'create-or-update-brand': createHandler('create-or-update-brand', async ({ assets, brandId }) => {
    const { db } = await getClientAndDb();
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
      settings: assets.settings || {}
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
  }),

  'assign-persona-to-plan': createHandler('assign-persona-to-plan', async ({ planId, personaId, updatedPosts }) => {
    const { db } = await getClientAndDb();
    
    await mediaPlanGroupsTemplate.update(db, planId, { personaId });
    
    if (updatedPosts && updatedPosts.length > 0) {
      const bulkOperations = updatedPosts.map(post => ({
        updateOne: {
          filter: createIdFilter(post.id),
          update: { $set: { mediaPrompt: post.mediaPrompt } }
        }
      }));
      await mediaPlanPostsTemplate.bulkWrite(db, bulkOperations);
    }
    
    return { success: true };
  }),

  'list-media-plan-groups': createHandler('list-media-plan-groups', async ({ brandId }) => {
    if (!brandId) {
      throw new Error('Missing brandId');
    }
    const { db } = await getClientAndDb();
    const planRecords = await mediaPlanGroupsTemplate.findByBrand(db, brandId);
    
    // Safely map records to avoid any problematic data
    const groups = planRecords.map(record => {
      // Ensure all fields are properly sanitized
      return {
        id: (record.id || record._id?.toString()) ?? null,
        name: typeof record.name === 'string' ? record.name : (record.name?.toString() || ''),
        prompt: typeof record.prompt === 'string' ? record.prompt : (record.prompt?.toString() || ''),
        source: record.source || null,
        productImages: Array.isArray(record.productImages) ? record.productImages : [],
        personaId: record.personaId || null,
        modelUsed: record.modelUsed || null
      };
    });
    
    // Ensure the response object is clean of any potential problematic properties
    const responseObj = { groups };
    
    // Verify the response can be serialized to JSON before returning
    try {
      JSON.stringify(responseObj);
    } catch (e) {
      console.error('Error serializing list-media-plan-groups response:', e);
      throw new Error('Failed to serialize response data');
    }
    
    return responseObj;
  }),

  'load-settings-data': createHandler('load-settings-data', async () => {
    const { db } = await getClientAndDb();
    
    const [modelRecords, adminSettingsRecord] = await Promise.all([
      aiModelsTemplate.findAll(db),
      adminSettingsTemplate.findOne(db, {})
    ]);
    
    const servicesMap = new Map();
    modelRecords.forEach(model => {
      if (!servicesMap.has(model.service)) {
        servicesMap.set(model.service, {
          id: model.service,
          name: model.service,
          models: []
        });
      }
      servicesMap.get(model.service).models.push({
        id: model._id.toString(),
        name: model.name,
        provider: model.provider,
        capabilities: model.capabilities || []
      });
    });

    const services = Array.from(servicesMap.values());
    const adminSettings = adminSettingsRecord ? {
      ...adminSettingsRecord,
      prompts: { ...defaultPrompts, ...(adminSettingsRecord.prompts || {}) }
    } : {
      language: 'English',
      totalPostsPerMonth: 30,
      mediaPromptSuffix: '',
      affiliateContentKit: '',
      textGenerationModel: 'gemini-1.5-pro-latest',
      imageGenerationModel: 'dall-e-3',
      textModelFallbackOrder: [],
      visionModels: [],
      contentPillars: [],
      prompts: defaultPrompts
    };
    
    return { services, adminSettings };
  }),

  'load-media-plan': createHandler('load-media-plan', async ({ planId }) => {
    const { db } = await getClientAndDb();
    
    const planRecord = await mediaPlanGroupsTemplate.findOne(db, { _id: new ObjectId(planId) });
    if (!planRecord) {
      throw new Error(`Plan with ID ${planId} not found.`);
    }
    
    const postRecords = await mediaPlanPostsTemplate.findAll(db, { mediaPlanId: planId });
    
    const imageUrls = {};
    const videoUrls = {};
    const weeks = new Map();
    
    postRecords.forEach(record => {
      if (record.imageKey && record.imageUrl) imageUrls[record.imageKey] = record.imageUrl;
      if (record.imageKeys && record.imageUrlsArray && Array.isArray(record.imageKeys) && Array.isArray(record.imageUrlsArray)) {
        for (let i = 0; i < record.imageKeys.length; i++) {
          if (record.imageKeys[i] && record.imageUrlsArray[i]) {
            imageUrls[record.imageKeys[i]] = record.imageUrlsArray[i];
          }
        }
      }
      if (record.videoKey && record.videoUrl) videoUrls[record.videoKey] = record.videoUrl;
      
      const weekNum = record.week;
      if (!weeks.has(weekNum)) {
        weeks.set(weekNum, { theme: record.theme, posts: [] });
      }
      
      weeks.get(weekNum).posts.push({
        id: record._id.toString(),
        platform: record.platform,
        contentType: record.contentType,
        title: record.title,
        content: record.content || '',
        description: record.description,
        hashtags: record.hashtags || [],
        cta: record.cta,
        mediaPrompt: record.mediaPrompt,
        script: record.script,
        imageKey: record.imageKey,
        imageKeys: record.imageKeys,
        imageUrl: record.imageUrl,
        imageUrlsArray: record.imageUrlsArray,
        videoKey: record.videoKey,
        mediaOrder: record.mediaOrder || [],
        sources: record.sources || [],
        promotedProductIds: record.promotedProductIds || [],
        scheduledAt: record.scheduledAt,
        publishedAt: record.publishedAt,
        publishedUrl: record.publishedUrl,
        autoComment: record.autoComment,
        status: record.status || 'draft',
        isPillar: record.isPillar,
        pillar: record.pillar,
        week: record.week,
        postOrder: record.postOrder,
        modelUsed: record.modelUsed  // Include modelUsed in the post data
      });
    });
    
    const finalPlan = Array.from(weeks.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([weekNum, weekData]) => ({
        week: weekNum,
        theme: weekData.theme,
        posts: weekData.posts
      }));
    
    return { plan: finalPlan, imageUrls, videoUrls };
  }),

  'load-media-plan-posts': createHandler('load-media-plan-posts', async ({ planId, page = 1, limit = 30 }) => {
    const { db } = await getClientAndDb();
    const allPostRecords = await mediaPlanPostsTemplate.findAll(db, { mediaPlanId: planId });
    
    allPostRecords.sort((a, b) => {
      const weekA = a.week || 0;
      const weekB = b.week || 0;
      if (weekA !== weekB) return weekA - weekB;
      
      const orderA = a.postOrder || new Date(a.createdTime || 0).getTime();
      const orderB = b.postOrder || new Date(b.createdTime || 0).getTime();
      return orderA - orderB;
    });
    
    // Include modelUsed in each post
    const postsWithModelUsed = allPostRecords.map(post => ({
      ...post,
      modelUsed: post.modelUsed
    }));
    
    const { items: posts, pagination } = paginateArray(postsWithModelUsed, page, limit);
    return { posts, pagination };
  }),

  'save-media-plan-group': createHandler('save-media-plan-group', async ({ group, imageUrls, brandId }) => {
    const { db } = await getClientAndDb();
    
    const { id: groupId, document: groupDocument } = await mediaPlanGroupsTemplate.create(db, {
      name: group.name,
      prompt: group.prompt,
      source: group.source,
      productImages: group.productImages || [],
      brandId,
      personaId: group.personaId,
      modelUsed: group.modelUsed  // Add modelUsed to the group if provided
    });

    const allPostsWithNewIds = [];
    if (group.plan && Array.isArray(group.plan)) {
      group.plan.forEach(week => {
        if (week && week.posts && Array.isArray(week.posts)) {
          week.posts.forEach((post, postIndex) => {
            const postObjectId = new ObjectId();
            const postId = postObjectId.toString();
            
            allPostsWithNewIds.push({
              ...post,
              _id: postObjectId,
              id: postId,
              mediaPlanId: groupId,
              week: week.week,
              theme: week.theme,
              brandId: brandId,
              modelUsed: post.modelUsed,  // Preserve modelUsed for each post if provided
              imageUrl: post.imageKey && !Array.isArray(post.imageKey) ? imageUrls[post.imageKey] : null,
              imageKeys: post.imageKeys,
              imageUrlsArray: post.imageUrlsArray,
              videoUrl: post.videoKey ? imageUrls[post.videoKey] : null,
              postOrder: postIndex,
              updatedAt: new Date(),
              createdAt: new Date(),
            });
          });
        }
      });
    }
    
    if (allPostsWithNewIds.length > 0) {
      const bulkOperations = allPostsWithNewIds.map(post => ({
        insertOne: { document: post }
      }));
      await mediaPlanPostsTemplate.bulkWrite(db, bulkOperations);
    }
    
    const finalPlan = {
      ...groupDocument,
      plan: group.plan.map(week => ({
        ...week,
        posts: allPostsWithNewIds
          .filter(p => p.week === week.week)
          .map(p => ({ ...p, _id: p.id }))
      }))
    };

    delete finalPlan._id;
    return { savedPlan: finalPlan };
  }),

  'update-media-plan-post': createHandler('update-media-plan-post', async (body) => {
    const { post } = body;
    const { db } = await getClientAndDb();
    const mediaPlanPostsCollection = mediaPlanPostsTemplate.getCollection(db);
    const filter = createIdFilter(post.id);

    const updatePayload = { ...post };
    delete updatePayload.id;

    // Ensure updatedAt is set
    updatePayload.updatedAt = new Date();

    const updateOperation = { $set: updatePayload };

    const result = await mediaPlanPostsCollection.updateOne(filter, updateOperation);

    if (result.matchedCount === 0) {
      console.warn(`--- update-media-plan-post did not find a document to update for id: ${post.id} ---`);
    }
    
    return { success: true, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
  }),

  'update-persona-state': createHandler('update-persona-state', async ({ personaId, isActive }) => {
    const { db } = await getClientAndDb();
    const result = await personasTemplate.update(db, personaId, { isActive });
    return { success: result.modifiedCount > 0 || result.upsertedCount > 0 };
  }),

  'sync-asset-media': createHandler('sync-asset-media', async ({ brandId, assets }) => {
    const { db } = await getClientAndDb();
    
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
  }),

  'initial-load': createHandler('initial-load', async ({ brandId }) => {
    const { db } = await getClientAndDb();
    
    const [brandRecord, affiliateLinksRecords] = await Promise.all([
      brandsTemplate.findOne(db, { _id: new ObjectId(brandId) }),
      affiliateProductsTemplate.findByBrand(db, brandId)
    ]);
    
    if (!brandRecord) {
      throw new Error(`Brand with ID ${brandId} not found.`);
    }

    const brandSummary = {
      id: brandRecord._id.toString(),
      name: brandRecord.name,
      logoUrl: brandRecord.logoUrl
    };

    const brandKitData = {
      brandFoundation: {
        brandName: brandRecord.name,
        mission: brandRecord.mission,
        values: brandRecord.values || [],
        targetAudience: brandRecord.targetAudience,
        personality: brandRecord.personality,
        keyMessaging: brandRecord.keyMessaging || [],
        usp: brandRecord.usp,
      },
      coreMediaAssets: {
        logoConcepts: brandRecord.coreMediaAssets?.logoConcepts || [],
        colorPalette: brandRecord.coreMediaAssets?.colorPalette || {},
        fontRecommendations: brandRecord.coreMediaAssets?.fontRecommendations || {},
      },
      unifiedProfileAssets: brandRecord.unifiedProfileAssets || {},
      settings: brandRecord.settings || {}
    };

    return {
      brandSummary,
      brandKitData,
      affiliateLinks: affiliateLinksRecords
    };
  }),

  'load-complete-project': createHandler('load-complete-project', async ({ brandId }) => {
    const { db } = await getClientAndDb();
    
    const brandRecord = await brandsTemplate.findOne(db, { _id: new ObjectId(brandId) });
    if (!brandRecord) {
      throw new Error(`Brand with ID ${brandId} not found.`);
    }
    
    const [
      affiliateLinks,
      personas,
      trends,
      ideas,
      mediaPlans
    ] = await Promise.all([
      affiliateProductsTemplate.findByBrand(db, brandId),
      personasTemplate.findByBrand(db, brandId),
      trendsTemplate.findByBrand(db, brandId),
      ideasTemplate.findByBrand(db, brandId),
      mediaPlanGroupsTemplate.findByBrand(db, brandId)
    ]);
    
    const assets = {
      brandFoundation: {
        brandName: brandRecord.name,
        mission: brandRecord.mission,
        values: brandRecord.values || [],
        targetAudience: brandRecord.targetAudience,
        personality: brandRecord.personality,
        keyMessaging: brandRecord.keyMessaging || [],
        usp: brandRecord.usp
      },
      coreMediaAssets: {
        logoConcepts: brandRecord.coreMediaAssets?.logoConcepts || [],
        colorPalette: brandRecord.coreMediaAssets?.colorPalette || {},
        fontRecommendations: brandRecord.coreMediaAssets?.fontRecommendations || {}
      },
      unifiedProfileAssets: brandRecord.unifiedProfileAssets || {},
      mediaPlans: mediaPlans.map(plan => ({ 
        ...plan, 
        id: plan._id?.toString(),
        modelUsed: plan.modelUsed  // Include modelUsed in the plan
      })),
      affiliateLinks,
      personas: personas.map(persona => ({
        ...persona,
        modelUsed: persona.modelUsed  // Include modelUsed in personas
      })),
      trends: trends.map(trend => ({
        ...trend,
        modelUsed: trend.modelUsed  // Include modelUsed in trends
      })),
      ideas: ideas.map(idea => ({
        ...idea,
        modelUsed: idea.modelUsed  // Include modelUsed in ideas
      })),
      settings: brandRecord.settings || {}
    };
    
    return {
      assets,
      generatedImages: {},
      generatedVideos: {},
      brandId
    };
  }),

  'load-project': createHandler('load-project', async ({ brandId }) => {
    return { message: 'Project loading not fully implemented' };
  })
};

// ========== MAIN HANDLER ==========

async function handler(request, response) {
  const { action } = request.query;
  
  const GET_ALLOWED_ACTIONS = [
    'list-media-plan-groups',
    'fetch-affiliate-links',
    'fetch-settings',
    'load-personas',
    'load-strategy-hub',
    'load-ideas-for-trend',
    'load-trend',
    'load-affiliate-vault',
    'check-credentials',
    'check-product-exists',
    'app-init',
    'load-settings-data',
    'load-media-plan',
    'load-media-plan-posts',
    'load-complete-project',
    'load-project'
  ];

  if (request.method !== 'POST' && !(request.method === 'GET' && GET_ALLOWED_ACTIONS.includes(action))) {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!action) {
    return response.status(400).json({ error: 'Missing action parameter' });
  }

  try {
    const { client, db } = await getClientAndDb();

    if (handlers[action]) {
      return await handlers[action](request, response, db);
    }

    response.status(400).json({ error: `Unknown action: ${action}` });
  } catch (error) {
    console.error('--- CRASH in /api/mongodb/[action] ---');
    console.error('Error object:', error);
    console.error('Action:', action);
    console.error('Query params:', request.query);
    console.error('Method:', request.method);
    
    // Check if it's a MongoDB connection error
    if (error.message.includes('ECONNREFUSED') || error.message.includes('getaddrinfo') || error.message.includes('MongoServerSelectionError')) {
      return response.status(500).json({ 
        error: 'Database connection error. Please check that MongoDB is running and the connection string is correct.' 
      });
    }
    
    response.status(500).json({ error: `Failed to process action ${action}: ${error.message}` });
  }
}

export default handler;