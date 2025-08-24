import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/airtable/save-media-plan-group ---');
  try {
    const { group, imageUrls, brandAirtableId } = request.body;

    if (!group || !group.name || !Array.isArray(group.posts)) {
      return response.status(400).json({ error: 'Invalid group data provided.' });
    }

    // Assuming table names in Airtable. These could also be passed from the client.
    const POSTS_TABLE = 'Posts';
    const GROUPS_TABLE = 'Media Plan Groups';

    // 1. Create the Media Plan Group record
    const groupRecord = {
      fields: {
        "Name": group.name,
        // Link to the brand using the Airtable record ID
        ...(brandAirtableId && { "Brand": [brandAirtableId] }),
      }
    };

    const groupResponse = await makeAirtableRequest('POST', GROUPS_TABLE, { records: [groupRecord] });
    if (!groupResponse.records || groupResponse.records.length === 0) {
      throw new Error('Failed to create media plan group record in Airtable.');
    }
    const newGroupId = groupResponse.records[0].id;

    // 2. Create the Post records in batches of 10
    const postsToCreate = group.posts.map(post => ({
      fields: {
        "Title": post.title,
        "Content": post.content,
        "Hashtags": (post.hashtags || []).join(' '),
        "CTA": post.cta,
        "Media Plan Group": [newGroupId], // Link to the new group
        ...(imageUrls && imageUrls[post.id] && { "Image URL": imageUrls[post.id] }),
        "Status": "Draft",
      }
    }));

    const BATCH_SIZE = 10;
    const createdPostIds = [];
    for (let i = 0; i < postsToCreate.length; i += BATCH_SIZE) {
      const batch = postsToCreate.slice(i, i + BATCH_SIZE);
      const postsResponse = await makeAirtableRequest('POST', POSTS_TABLE, { records: batch });
      if (postsResponse.records) {
        createdPostIds.push(...postsResponse.records.map(r => r.id));
      }
    }

    console.log(`--- Media plan group saved with ID ${newGroupId} and ${createdPostIds.length} posts ---`);
    response.status(200).json({ success: true, groupId: newGroupId, postIds: createdPostIds });
  } catch (error) {
    console.error('--- CRASH in /api/airtable/save-media-plan-group ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to save media plan group: ${error.message}` });
  }
}