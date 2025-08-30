import { getClientAndDb } from '../lib/mongodb.js';
import { allowCors } from '../lib/cors.js';

async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/mongodb/load-personas ---');
  try {
    const { brandId } = request.body;

    if (!brandId) {
      return response.status(400).json({ error: 'Missing brandId in request body' });
    }

    // Get MongoDB client and database instance
    const { client, db } = await getClientAndDb();
    
    // Fetch personas data from MongoDB
    const collection = db.collection('personas');
    const personaRecords = await collection.find({ brandId: brandId }).toArray();
    
    // Transform MongoDB records to match the expected API response format
    // Convert _id to id and remove _id field
    const personas = personaRecords.map((record) => ({
      id: record._id.toString(),
      nickName: record.nickName,
      mainStyle: record.mainStyle,
      activityField: record.activityField,
      outfitDescription: record.outfitDescription,
      avatarImageKey: record.avatarImageKey,
      avatarImageUrl: record.avatarImageUrl,
      photos: record.photos || [], // Will be populated on client side if needed
      socialAccounts: record.socialAccounts || [], // Will be populated on client side if needed
      ...record // Include any other fields that might be in the record
    }));

    response.status(200).json({ personas });
    console.log('--- Personas data sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/mongodb/load-personas ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to load personas data: ${error.message}` });
  }
}

export default allowCors(handler);