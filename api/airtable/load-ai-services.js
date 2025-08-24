import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/airtable/load-ai-services ---');
  try {
    // Implementation would go here
    response.status(200).json({ services: [] });
    console.log('--- AI services loaded ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/load-ai-services ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to load AI services: ${error.message}` });
  }
}