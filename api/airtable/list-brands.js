import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/airtable/list-brands ---');
  try {
    const { AIRTABLE_BASE_ID } = process.env;
    if (!AIRTABLE_BASE_ID) {
      throw new Error('Airtable Base ID not configured on server');
    }
    
    const BRANDS_TABLE_NAME = 'Brands';
    const airtableResponse = await makeAirtableRequest('GET', BRANDS_TABLE_NAME);
    
    const brands = airtableResponse.records.map(record => ({
      id: record.fields.brand_id, // The custom ID
      name: record.fields.name,
      airtableId: record.id // The Airtable record ID
    }));
    
    response.status(200).json({ brands });
    console.log('--- Brands list sent to client ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/list-brands ---');
    console.error('Error object:', error);
    
    // If the table doesn't exist, return an empty array
    if (error.message && error.message.includes('NOT_FOUND')) {
      console.warn("Brands table not found in Airtable. Returning empty list.");
      return response.status(200).json({ brands: [] });
    }
    
    response.status(500).json({ error: `Failed to fetch brands from Airtable: ${error.message}` });
  }
}