import { getClientAndDb } from '../lib/mongodb.js';
import { allowCors } from '../lib/cors.js';

async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/mongodb/list-media-plan-groups ---');
  try {
    const { brandId } = request.body;

    if (!brandId) {
      return response.status(400).json({ error: 'Missing brandId in request body' });
    }

    // Get MongoDB client and database instance
    const { client, db } = await getClientAndDb();
    
    // Fetch media plan groups data from MongoDB
    const collection = db.collection('mediaPlanGroups');
    const planRecords = await collection.find({ brandId: brandId }).toArray();
    
    // Transform MongoDB records to match the expected API response format
    const groups = planRecords.map((record) => ({
      id: record._id.toString(),
      name: record.name,
      prompt: record.prompt,
      source: record.source,
      productImages: record.productImages || [],
      personaId: record.personaId,
      ...record // Include any other fields that might be in the record
    }));

    response.status(200).json({ groups });
    console.log('--- Media plan groups list sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/mongodb/list-media-plan-groups ---');
    console.error('Error object:', error);
    
    response.status(500).json({ error: `Failed to fetch media plan groups from MongoDB: ${error.message}` });
  }
}

export default allowCors(handler);