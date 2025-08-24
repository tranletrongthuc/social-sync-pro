import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/airtable/save-ideas ---');
  try {
    const { ideas } = request.body;

    if (!Array.isArray(ideas) || ideas.length === 0) {
      return response.status(400).json({ error: 'Invalid or empty ideas array provided.' });
    }

    // Assuming 'Ideas' is the table name in Airtable.
    const IDEAS_TABLE = 'Ideas';

    const recordsToCreate = ideas.map(idea => ({
      fields: {
        // Assuming the idea object has a 'text' field and can be linked to a brand
        "Idea": idea.text,
        "Status": "New",
        ...(idea.brandAirtableId && { "Brand": [idea.brandAirtableId] }),
      }
    }));

    const BATCH_SIZE = 10;
    const createdIdeaIds = [];

    for (let i = 0; i < recordsToCreate.length; i += BATCH_SIZE) {
      const batch = recordsToCreate.slice(i, i + BATCH_SIZE);
      const ideasResponse = await makeAirtableRequest('POST', IDEAS_TABLE, { records: batch });
      if (ideasResponse.records) {
        createdIdeaIds.push(...ideasResponse.records.map(r => r.id));
      }
    }

    console.log(`--- ${createdIdeaIds.length} ideas saved ---`);
    response.status(200).json({ success: true, createdIds: createdIdeaIds });
  } catch (error) {
    console.error('--- CRASH in /api/airtable/save-ideas ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to save ideas: ${error.message}` });
  }
}