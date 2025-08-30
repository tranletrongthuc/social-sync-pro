import { getClientAndDb } from '../lib/mongodb.js';
import { allowCors } from '../lib/cors.js';

async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/mongodb/load-strategy-hub ---');
  try {
    const { brandId } = request.body;

    if (!brandId) {
      return response.status(400).json({ error: 'Missing brandId in request body' });
    }

    // Get MongoDB client and database instance
    const { client, db } = await getClientAndDb();
    
    // Fetch trends data from MongoDB
    const trendsCollection = db.collection('trends');
    const trendRecords = await trendsCollection.find({ brandId: brandId }).toArray();
    
    // Transform MongoDB records to match the expected API response format
    const trends = trendRecords.map((record) => ({
      id: record._id.toString(),
      brandId: record.brandId,
      industry: record.industry,
      topic: record.topic,
      keywords: record.keywords || [],
      links: record.links || [],
      notes: record.notes,
      analysis: record.analysis,
      createdAt: record.createdAt,
      ...record // Include any other fields that might be in the record
    }));

    // Fetch ideas data (only for existing trends)
    const trendIds = trendRecords.map(r => r._id.toString());
    let ideas = [];
    
    if (trendIds.length > 0) {
      const ideasCollection = db.collection('ideas');
      const ideaRecords = await ideasCollection.find({ trendId: { $in: trendIds } }).toArray();
      
      // Transform MongoDB records to match the expected API response format
      ideas = ideaRecords.map((record) => ({
        id: record._id.toString(),
        trendId: record.trendId,
        title: record.title,
        description: record.description,
        targetAudience: record.targetAudience,
        productId: record.productId,
        ...record // Include any other fields that might be in the record
      }));
    }

    response.status(200).json({ trends, ideas });
    console.log('--- Strategy hub data sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/mongodb/load-strategy-hub ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to load strategy hub data: ${error.message}` });
  }
}

export default allowCors(handler);