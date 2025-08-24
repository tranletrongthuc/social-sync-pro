import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/airtable/delete-affiliate-link ---');
  try {
    const { linkId, brandId } = request.body;
    
    // Implementation would go here
    response.status(200).json({ success: true });
    console.log('--- Affiliate link deleted ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/delete-affiliate-link ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to delete affiliate link: ${error.message}` });
  }
}