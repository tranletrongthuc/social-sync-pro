import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/airtable/delete-ai-service ---');
  try {
    const { serviceId } = request.body;
    
    // Implementation would go here
    response.status(200).json({ success: true });
    console.log('--- AI service deleted ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/delete-ai-service ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to delete AI service: ${error.message}` });
  }
}