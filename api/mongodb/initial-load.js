import { getClientAndDb } from '../lib/mongodb.js';
import { allowCors } from '../lib/cors.js';

async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/mongodb/initial-load ---');
  try {
    const { brandId } = request.body;

    if (!brandId) {
      return response.status(400).json({ error: 'Missing brandId in request body' });
    }

    // Get MongoDB client and database instance
    const { client, db } = await getClientAndDb();
    
    // Fetch the brand record
    const brandsCollection = db.collection('brands');
    const brandRecord = await brandsCollection.findOne({ brandId: brandId });
    
    if (!brandRecord) {
      return response.status(404).json({ error: `Brand with ID ${brandId} not found.` });
    }

    // Fetch brand summary data for instant rendering
    const brandSummary = {
      id: brandRecord.brandId,
      name: brandRecord.name,
      logoUrl: brandRecord.logoUrl // Assuming there's a logoUrl field
    };

    // Fetch complete brand foundation data (for BrandKitView)
    const brandValuesCollection = db.collection('brandValues');
    const keyMessagesCollection = db.collection('keyMessages');
    const logoConceptsCollection = db.collection('logoConcepts');
    
    const brandValueRecords = await brandValuesCollection.find({ brandId: brandId }).toArray();
    const keyMessageRecords = await keyMessagesCollection.find({ brandId: brandId }).toArray();
    const logoConceptRecords = await logoConceptsCollection.find({ brandId: brandId }).toArray();

    const brandValues = brandValueRecords.map((record) => record.text);
    const keyMessages = keyMessageRecords.map((record) => record.text);
    const logoConcepts = logoConceptRecords.map((record) => ({
      id: record._id.toString(),
      style: record.style,
      prompt: record.prompt,
      imageKey: record.imageKey,
    }));

    const brandFoundation = {
      brandName: brandRecord.name,
      mission: brandRecord.mission,
      values: brandValues,
      targetAudience: brandRecord.targetAudience,
      personality: brandRecord.personality,
      keyMessaging: keyMessages,
      usp: brandRecord.usp,
    };

    const coreMediaAssets = {
      logoConcepts,
      colorPalette: brandRecord.colorPalette || {},
      fontRecommendations: brandRecord.fontRecommendations || {},
    };

    const unifiedProfileAssets = brandRecord.unifiedProfileAssets || {};

    const brandKitData = {
      brandFoundation,
      coreMediaAssets,
      unifiedProfileAssets
    };

    // Return both summary and brand kit data for instant rendering of BrandKitView
    response.status(200).json({
      brandSummary,
      brandKitData
    });
    console.log('--- Initial load data sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/mongodb/initial-load ---');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    response.status(500).json({ error: `Failed to load initial data: ${error.message}`, details: error.message });
  }
}

export default allowCors(handler);