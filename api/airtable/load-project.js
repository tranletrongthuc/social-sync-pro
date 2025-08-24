import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/airtable/load-project ---');
  try {
    const { brandId } = request.body;
    
    // Implementation would go here
    response.status(200).json({ 
      assets: null, 
      generatedImages: {}, 
      generatedVideos: {}, 
      brandId 
    });
    console.log('--- Project loaded ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/load-project ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to load project: ${error.message}` });
  }
}