import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // console.log('--- Received request for /api/airtable/request ---');
  try {
    const { method = 'GET', path, body, headers = {} } = request.body;
    const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;

    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
      return response.status(500).json({ error: 'Airtable credentials not configured on server' });
    }

    if (!path) {
      return response.status(400).json({ error: 'Missing path for Airtable request' });
    }

    // Construct the full URL
    // Handle different types of paths:
    // 1. Meta operations like "meta/bases/tables" should become "meta/bases/${AIRTABLE_BASE_ID}/tables"
    // 2. Table operations like "Brands" should become "${AIRTABLE_BASE_ID}/Brands"
    let fullPath;
    if (path.startsWith('meta/bases/')) {
      // Meta operation - insert the base ID after "meta/bases/"
      fullPath = path.replace('meta/bases/', `meta/bases/${AIRTABLE_BASE_ID}/`);
    } else {
      // Regular table operation - prepend the base ID
      fullPath = `${AIRTABLE_BASE_ID}/${path}`;
    }
    
    const url = `https://api.airtable.com/v0/${fullPath}`;
    
    const airtableHeaders = {
      'Authorization': `Bearer ${AIRTABLE_PAT}`,
      'Content-Type': 'application/json',
      ...headers
    };

    const fetchOptions = {
      method,
      headers: airtableHeaders
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }

    const airtableResponse = await fetch(url, fetchOptions);
    const responseData = await airtableResponse.json();

    if (!airtableResponse.ok) {
      throw new Error(`Airtable API error: ${airtableResponse.status} ${airtableResponse.statusText} - ${JSON.stringify(responseData)}`);
    }

    response.status(200).json(responseData);
    // console.log('--- Airtable response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/airtable/request ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to communicate with Airtable: ${error.message}` });
  }
}