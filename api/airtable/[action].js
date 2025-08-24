import { makeAirtableRequest } from '../lib/airtable';
import { allowCors } from '../lib/cors';

async function handler(request, response) {
  const { action } = request.query;

  switch (action) {
    case 'assign-persona-to-plan': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/airtable/assign-persona-to-plan ---');
      try {
        const { planId, personaId, updatedPosts, brandId } = request.body;
        
        // Implementation would go here
        response.status(200).json({ success: true });
        console.log('--- Persona assigned to plan ---');
      } catch (error) {
        console.error('--- CRASH in /api/airtable/assign-persona-to-plan ---');
        console.error('Error object:', error);
        response.status(500).json({ error: `Failed to assign persona to plan: ${error.message}` });
      }
      break;
    }
    case 'bulk-patch-posts': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/bulk-patch-posts ---');
        try {
            const { updates, brandId } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Posts patched ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/bulk-patch-posts ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to patch posts: ${error.message}` });
        }
        break;
    }
    case 'bulk-update-post-schedules': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/bulk-update-post-schedules ---');
        try {
            const { updates, brandId } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Post schedules updated ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/bulk-update-post-schedules ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to update post schedules: ${error.message}` });
        }
        break;
    }
    case 'check-credentials': {
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
        break;
    }
    case 'create-or-update-brand': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/create-or-update-brand ---');
        try {
            const { brandInfo, colorPalette, fontRecommendations, unifiedProfile, brandId } = request.body;
            
            const airtableResponse = await makeAirtableRequest('POST', 'Brands', {
            records: [{
                fields: {
                brand_id: brandId,
                name: brandInfo.brandName,
                mission: brandInfo.mission,
                usp: brandInfo.usp,
                target_audience: brandInfo.targetAudience,
                personality: brandInfo.personality,
                color_palette_json: JSON.stringify(colorPalette),
                font_recs_json: JSON.stringify(fontRecommendations),
                unified_profile_json: JSON.stringify(unifiedProfile)
                }
            }]
            });
            
            response.status(200).json({ brandId: airtableResponse.records[0].fields.brand_id });
            console.log('--- Brand record response sent to client ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/create-or-update-brand ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to create or update brand record: ${error.message}` });
        }
        break;
    }
    case 'delete-affiliate-link': {
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
        break;
    }
    case 'delete-ai-model': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/delete-ai-model ---');
        try {
            const { modelId } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- AI model deleted ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/delete-ai-model ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to delete AI model: ${error.message}` });
        }
        break;
    }
    case 'delete-ai-service': {
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
        break;
    }
    case 'delete-persona': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/delete-persona ---');
        try {
            const { personaId, brandId } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Persona deleted ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/delete-persona ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to delete persona: ${error.message}` });
        }
        break;
    }
    case 'delete-trend': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/delete-trend ---');
        try {
            const { trendId, brandId } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Trend deleted ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/delete-trend ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to delete trend: ${error.message}` });
        }
        break;
    }
    case 'ensure-tables': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/ensure-tables ---');
        try {
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Tables ensured ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/ensure-tables ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to ensure tables: ${error.message}` });
        }
        break;
    }
    case 'fetch-admin-defaults': {
        if (request.method !== 'GET') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/fetch-admin-defaults ---');
        try {
            // Implementation would go here
            response.status(200).json({ settings: null });
            console.log('--- Admin defaults fetched ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/fetch-admin-defaults ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to fetch admin defaults: ${error.message}` });
        }
        break;
    }
    case 'fetch-affiliate-links': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/fetch-affiliate-links ---');
        try {
            const { brandId } = request.body;
            
            // Implementation would go here
            response.status(200).json({ links: [] });
            console.log('--- Affiliate links fetched ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/fetch-affiliate-links ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to fetch affiliate links: ${error.message}` });
        }
        break;
    }
    case 'fetch-settings': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/fetch-settings ---');
        try {
            const { brandId } = request.body;
            
            // Implementation would go here
            response.status(200).json({ settings: null });
            console.log('--- Settings fetched ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/fetch-settings ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to fetch settings: ${error.message}` });
        }
        break;
    }
    case 'list-brands': {
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
        break;
    }
    case 'list-media-plan-groups': {
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
        break;
    }
    case 'load-ai-services': {
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
        break;
    }
    case 'load-media-plan': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/load-media-plan ---');
        try {
            const { planId, brandFoundation, language } = request.body;
            
            // Implementation would go here
            response.status(200).json({ 
            plan: null, 
            imageUrls: {}, 
            videoUrls: {} 
            });
            console.log('--- Media plan loaded ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/load-media-plan ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to load media plan: ${error.message}` });
        }
        break;
    }
    case 'load-project': {
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
        break;
    }
    case 'request': {
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
        break;
    }
    case 'save-admin-defaults': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/save-admin-defaults ---');
        try {
            const { settings } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Admin defaults saved ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/save-admin-defaults ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to save admin defaults: ${error.message}` });
        }
        break;
    }
    case 'save-affiliate-links': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/save-affiliate-links ---');
        try {
            const { links, brandId } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Affiliate links saved ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/save-affiliate-links ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to save affiliate links: ${error.message}` });
        }
        break;
    }
    case 'save-ai-model': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/save-ai-model ---');
        try {
            const { model } = request.body;
            
            // Implementation would go here
            response.status(200).json({ model: null });
            console.log('--- AI model saved ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/save-ai-model ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to save AI model: ${error.message}` });
        }
        break;
    }
    case 'save-ai-service': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/save-ai-service ---');
        try {
            const { service } = request.body;
            
            // Implementation would go here
            response.status(200).json({ service: null });
            console.log('--- AI service saved ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/save-ai-service ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to save AI service: ${error.message}` });
        }
        break;
    }
    case 'save-ideas': {
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
        break;
    }
    case 'save-media-plan-group': {
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
        break;
    }
    case 'save-persona': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/save-persona ---');
        try {
            const { persona, brandId } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Persona saved ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/save-persona ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to save persona: ${error.message}` });
        }
        break;
    }
    case 'save-settings': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/save-settings ---');
        try {
            const { settings, brandId } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Settings saved ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/save-settings ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to save settings: ${error.message}` });
        }
        break;
    }
    case 'save-trend': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/save-trend ---');
        try {
            const { trend, brandId } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Trend saved ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/save-trend ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to save trend: ${error.message}` });
        }
        break;
    }
    case 'sync-asset-media': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/sync-asset-media ---');
        try {
            const { imageUrls, brandId, assets } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Asset media synced ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/sync-asset-media ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to sync asset media: ${error.message}` });
        }
        break;
    }
    case 'update-media-plan-post': {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log('--- Received request for /api/airtable/update-media-plan-post ---');
        try {
            const { post, brandId, imageUrl, videoUrl } = request.body;
            
            // Implementation would go here
            response.status(200).json({ success: true });
            console.log('--- Media plan post updated ---');
        } catch (error) {
            console.error('--- CRASH in /api/airtable/update-media-plan-post ---');
            console.error('Error object:', error);
            response.status(500).json({ error: `Failed to update media plan post: ${error.message}` });
        }
        break;
    }
    default:
      response.setHeader('Allow', ['GET', 'POST']);
      response.status(405).end(`Method ${request.method} Not Allowed for action ${action}`);
  }
}

export default allowCors(handler);