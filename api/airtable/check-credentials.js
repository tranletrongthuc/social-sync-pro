import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/airtable/check-credentials ---');
  try {
    const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;
    
    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
      return response.status(200).json({ valid: false });
    }
    
    // Perform a simple, low-cost request to validate credentials
    await makeAirtableRequest('GET', `meta/bases/${AIRTABLE_BASE_ID}/tables`);
    response.status(200).json({ valid: true });
  } catch (error) {
    console.error('Airtable credential check failed:', error);
    response.status(200).json({ valid: false });
  }
}