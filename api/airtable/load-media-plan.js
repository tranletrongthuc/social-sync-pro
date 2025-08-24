import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/airtable/load-media-plan ---');
  try {
    const { planId, brandFoundation, language } = request.body;
    
    // Implementation would go here
    response.status(200).json({ 
      plan: null, 
      imageUrls: {}, 
      videoUrls: {} 
    });
    console.log('--- Media plan loaded ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/load-media-plan ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to load media plan: ${error.message}` });
  }
}