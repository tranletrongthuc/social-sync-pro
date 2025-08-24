import { makeAirtableRequest } from '../../lib/airtable';

export default async function handler(request, response) {
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
}