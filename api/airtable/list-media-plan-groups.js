import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/airtable/list-media-plan-groups ---');
  try {
    const { brandId } = request.body;
    
    // Implementation would go here
    response.status(200).json({ groups: [] });
    console.log('--- Media plan groups listed ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/list-media-plan-groups ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to list media plan groups: ${error.message}` });
  }
}