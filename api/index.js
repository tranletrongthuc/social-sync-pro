const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');

const app = express();

// Setup CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow all localhost and local IP origins, regardless of port or protocol
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('https://localhost') || origin.startsWith('https://127.0.0.1')) {
        return callback(null, true);
    }
    // Also allow Vercel preview URLs and your production domain
    if (origin.endsWith('.vercel.app') || origin === 'https://social-sync-pro.vercel.app/') { // Replace with your actual production domain
        return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize Gemini AI
if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the .env file. Gemini-related routes will fail.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.send('SocialSync Pro BFF is running! This is the root of the API.');
});

// Gemini Proxy Endpoint
app.post('/gemini/generate', async (req, res) => {
  console.log('--- Received request for /api/gemini/generate ---');
  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    const { model, contents, config } = req.body;

    if (!model || !contents) {
      console.log('Validation failed: Missing model or contents.');
      return res.status(400).json({ error: 'Missing required fields: model and contents' });
    }
    console.log(`Model: ${model}`);

    // Separate systemInstruction from generationConfig
    const generationConfig = { ...config };
    const systemInstruction = generationConfig?.systemInstruction;
    if (systemInstruction) {
      delete generationConfig.systemInstruction;
    }

    const modelConfig = { model: model };
    if (systemInstruction) {
      modelConfig.systemInstruction = systemInstruction;
    }

    const geminiModel = genAI.getGenerativeModel(modelConfig);
    console.log('Got generative model. Calling generateContent...');

    // Using the full configuration if provided
    const generateContentRequest = {
      contents: [{ parts: [{ text: JSON.stringify(contents) }] }]
    };
    
    if (Object.keys(generationConfig).length > 0) {
      generateContentRequest.generationConfig = generationConfig;
    }

    const result = config 
      ? await geminiModel.generateContent(generateContentRequest)
      : await geminiModel.generateContent(JSON.stringify(contents));
    
    console.log('--- generateContent call SUCCEEDED ---');
    const responseText = result.response.text();

    res.json({ text: responseText });
    console.log('--- Response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/gemini/generate ---');
    console.error('Error object:', error);
    res.status(500).json({ error: 'Failed to generate content from Gemini API: ' + error.message });
  }
});

// Gemini Image Generation Endpoint
app.post('/gemini/generate-image', async (req, res) => {
  console.log('--- Received request for /api/gemini/generate-image ---');
  try {
    const { model, prompt, config } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: model and prompt' });
    }

    // Separate systemInstruction from generationConfig
    const generationConfig = { ...config };
    const systemInstruction = generationConfig?.systemInstruction;
    if (systemInstruction) {
      delete generationConfig.systemInstruction;
    }

    const modelConfig = { model: model };
    if (systemInstruction) {
      modelConfig.systemInstruction = systemInstruction;
    }

    const geminiModel = genAI.getGenerativeModel(modelConfig);
    console.log('Generating image with Gemini...');

    const result = await geminiModel.generateImages({ prompt, config: generationConfig });
    
    console.log('--- generateImages call SUCCEEDED ---');
    
    // Return the first generated image
    if (result.generatedImages && result.generatedImages.length > 0) {
      const base64Image = result.generatedImages[0].image.imageBytes;
      res.json({ image: `data:image/jpeg;base64,${base64Image}` });
    } else {
      res.status(500).json({ error: 'No image was generated' });
    }

    console.log('--- Image response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/gemini/generate-image ---');
    console.error('Error object:', error);
    res.status(500).json({ error: 'Failed to generate image from Gemini API: ' + error.message });
  }
});

// OpenRouter Proxy Endpoint
app.post('/openrouter/generate', async (req, res) => {
  console.log('--- Received request for /api/openrouter/generate ---');
  try {
    const { model, messages, responseFormat } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured on server' });
    }

    if (!model || !messages) {
      return res.status(400).json({ error: 'Missing required fields: model and messages' });
    }

    const siteUrl = req.headers.referer || 'https://socialsync.pro';
    const siteTitle = 'SocialSync Pro';

    const body = {
      model: model,
      messages: messages
    };

    if (responseFormat) {
      body.response_format = responseFormat;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": siteUrl,
        "X-Title": siteTitle,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    
    // Extract text from the response
    let responseText = '';
    if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message?.content) {
      responseText = responseData.choices[0].message.content;
    }

    res.json({ text: responseText });
    console.log('--- OpenRouter response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/openrouter/generate ---');
    console.error('Error object:', error);
    res.status(500).json({ error: 'Failed to generate content from OpenRouter API: ' + error.message });
  }
});

// OpenRouter Image Generation Endpoint
app.post('/openrouter/generate-image', async (req, res) => {
  console.log('--- Received request for /api/openrouter/generate-image ---');
  try {
    const { model, messages, responseFormat } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured on server' });
    }

    if (!model || !messages) {
      return res.status(400).json({ error: 'Missing required fields: model and messages' });
    }

    const siteUrl = req.headers.referer || 'https://socialsync.pro';
    const siteTitle = 'SocialSync Pro';

    const body = {
      model: model,
      messages: messages
    };

    if (responseFormat) {
      body.response_format = responseFormat;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": siteUrl,
        "X-Title": siteTitle,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    
    // Extract image from the response (assuming it's in JSON format)
    let responseImage = '';
    if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message?.content) {
      try {
        const content = responseData.choices[0].message.content;
        // Try to parse as JSON to extract base64 image
        const parsed = JSON.parse(content);
        if (parsed.b64_json) {
          responseImage = `data:image/jpeg;base64,${parsed.b64_json}`;
        } else {
          responseImage = content; // fallback to raw content
        }
      } catch (parseError) {
        // If parsing fails, use the raw content
        responseImage = responseData.choices[0].message.content;
      }
    }

    res.json({ image: responseImage });
    console.log('--- OpenRouter image response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/openrouter/generate-image ---');
    console.error('Error object:', error);
    res.status(500).json({ error: 'Failed to generate image from OpenRouter API: ' + error.message });
  }
});

// Cloudinary Upload Endpoint
app.post('/cloudinary/upload', async (req, res) => {
  console.log('--- Received request for /api/cloudinary/upload ---');
  try {
    const { media } = req.body;

    if (!media || typeof media !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid media data' });
    }

    const mediaEntries = Object.entries(media).filter(
      ([, url]) => url && url.startsWith('data:')
    );

    if (mediaEntries.length === 0) {
      return res.json({ uploadedUrls: {} });
    }

    const uploadPromises = mediaEntries.map(async ([key, url]) => {
      try {
        const isVideo = url.startsWith('data:video');
        const resourceType = isVideo ? 'video' : 'image';
        const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
        
        console.log(uploadUrl)

        // Convert data URL to buffer
        const dataUrlParts = url.split(',');
        if (dataUrlParts.length < 2) {
          throw new Error('Invalid data URL format');
        }
        
        const mimePart = dataUrlParts[0].split(':')[1];
        const mimeType = mimePart ? mimePart.split(';')[0] : (isVideo ? 'video/mp4' : 'image/jpeg');
        const base64Data = dataUrlParts[1];
        
        // Clean base64 string
        const cleanedBase64 = base64Data.replace(/\s/g, '');
        const buffer = Buffer.from(cleanedBase64, 'base64');

        // Create form data
        const formData = new FormData();
        formData.append('file', buffer, {
          filename: `${key}.${mimeType.split('/')[1] || 'jpg'}`,
          contentType: mimeType
        });
        formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);
        formData.append('public_id', key);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders()
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
        }

        const result = await response.json();
        return [key, result.secure_url];
      } catch (error) {
        console.error(`Failed to upload media with key "${key}" to Cloudinary:`, error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const uploadedUrls = Object.fromEntries(results.filter(r => r !== null));

    res.json({ uploadedUrls });
    console.log('--- Cloudinary upload response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/cloudinary/upload ---');
    console.error('Error object:', error);
    res.status(500).json({ error: 'Failed to upload media to Cloudinary: ' + error.message });
  }
});

// Facebook API Proxy Endpoint
app.post('/facebook/publish', async (req, res) => {
  console.log('--- Received request for /api/facebook/publish ---');
  try {
    const { post, imageUrl, pageId, accessToken, videoUrl } = req.body;

    if (!pageId || !accessToken) {
      return res.status(400).json({ error: 'Missing required fields: pageId and accessToken' });
    }

    if (!post || typeof post !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid post data' });
    }

    const apiVersion = 'v23.0';
    const fullMessage = `${post.title}\n\n${post.content}\n\n${(post.hashtags || []).join(' ')}\n\nCTA: ${post.cta}`;

    let endpoint = '';
    const params = new URLSearchParams();
    params.append('access_token', accessToken);

    console.log("Page ID right before URL construction:", pageId); // New diagnostic log

    if (imageUrl) {
      endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/photos`;
      params.append('caption', fullMessage);
      params.append('url', imageUrl);
    } else {
      endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
      params.append('message', fullMessage);
    }

    const response = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'POST',
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error?.message || "Failed to publish to Facebook");
    }

    const postId = responseData.id || responseData.post_id;
    if (!postId) {
      throw new Error("Facebook API did not return a post ID");
    }

    const publishedUrl = `https://www.facebook.com/${postId}`;
    res.json({ publishedUrl });
    console.log('--- Facebook publish response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/facebook/publish ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to publish to Facebook: ${error.message}` });
  }
});

// Airtable API Proxy Endpoint
app.post('/airtable/request', async (req, res) => {
  // console.log('--- Received request for /api/airtable/request ---');
  try {
    const { method = 'GET', path, body, headers = {} } = req.body;
    const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;

    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
      return res.status(500).json({ error: 'Airtable credentials not configured on server' });
    }

    if (!path) {
      return res.status(400).json({ error: 'Missing path for Airtable request' });
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

    const response = await fetch(url, fetchOptions);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
    }

    res.json(responseData);
    // console.log('--- Airtable response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/airtable/request ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to communicate with Airtable: ${error.message}` });
  }
});

// --- BFF Airtable Service Endpoints ---

// Helper function to make Airtable requests
const makeAirtableRequest = async (method, path, body = null) => {
  const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable credentials not configured on server');
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${path}`;
  
  const airtableHeaders = {
    'Authorization': `Bearer ${AIRTABLE_PAT}`,
    'Content-Type': 'application/json'
  };

  const fetchOptions = { method, headers: airtableHeaders };
  
  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }

  return responseData;
};

// Check Airtable credentials
app.get('/airtable/check-credentials', async (req, res) => {
  console.log('--- Received request for /api/airtable/check-credentials ---');
  try {
    const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;
    
    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
      return res.json({ valid: false });
    }
    
    // Perform a simple, low-cost request to validate credentials
    await makeAirtableRequest('GET', `meta/bases/${AIRTABLE_BASE_ID}/tables`);
    res.json({ valid: true });
  } catch (error) {
    console.error('Airtable credential check failed:', error);
    res.json({ valid: false });
  }
});

// List brands
app.get('/airtable/list-brands', async (req, res) => {
  console.log('--- Received request for /api/airtable/list-brands ---');
  try {
    const { AIRTABLE_BASE_ID } = process.env;
    if (!AIRTABLE_BASE_ID) {
      throw new Error('Airtable Base ID not configured on server');
    }
    
    const BRANDS_TABLE_NAME = 'Brands';
    const response = await makeAirtableRequest('GET', BRANDS_TABLE_NAME);
    
    const brands = response.records.map(record => ({
      id: record.fields.brand_id, // The custom ID
      name: record.fields.name,
      airtableId: record.id // The Airtable record ID
    }));
    
    res.json({ brands });
    console.log('--- Brands list sent to client ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/list-brands ---');
    console.error('Error object:', error);
    
    // If the table doesn't exist, return an empty array
    if (error.message && error.message.includes('NOT_FOUND')) {
      console.warn("Brands table not found in Airtable. Returning empty list.");
      return res.json({ brands: [] });
    }
    
    res.status(500).json({ error: `Failed to fetch brands from Airtable: ${error.message}` });
  }
});

// Create or update brand record
app.post('/airtable/create-or-update-brand', async (req, res) => {
  console.log('--- Received request for /api/airtable/create-or-update-brand ---');
  try {
    const { brandInfo, colorPalette, fontRecommendations, unifiedProfile, brandId } = req.body;
    
    // Implementation would go here - for now, we'll just proxy to the existing airtable/request endpoint
    const response = await makeAirtableRequest('POST', 'Brands', {
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
    
    res.json({ brandId: response.records[0].fields.brand_id });
    console.log('--- Brand record response sent to client ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/create-or-update-brand ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to create or update brand record: ${error.message}` });
  }
});

// Save affiliate links
app.post('/airtable/save-affiliate-links', async (req, res) => {
  console.log('--- Received request for /api/airtable/save-affiliate-links ---');
  try {
    const { links, brandId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Affiliate links saved ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/save-affiliate-links ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to save affiliate links: ${error.message}` });
  }
});

// Delete affiliate link
app.post('/airtable/delete-affiliate-link', async (req, res) => {
  console.log('--- Received request for /api/airtable/delete-affiliate-link ---');
  try {
    const { linkId, brandId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Affiliate link deleted ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/delete-affiliate-link ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to delete affiliate link: ${error.message}` });
  }
});

// Save persona
app.post('/airtable/save-persona', async (req, res) => {
  console.log('--- Received request for /api/airtable/save-persona ---');
  try {
    const { persona, brandId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Persona saved ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/save-persona ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to save persona: ${error.message}` });
  }
});

// Delete persona
app.post('/airtable/delete-persona', async (req, res) => {
  console.log('--- Received request for /api/airtable/delete-persona ---');
  try {
    const { personaId, brandId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Persona deleted ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/delete-persona ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to delete persona: ${error.message}` });
  }
});

// Assign persona to plan
app.post('/airtable/assign-persona-to-plan', async (req, res) => {
  console.log('--- Received request for /api/airtable/assign-persona-to-plan ---');
  try {
    const { planId, personaId, updatedPosts, brandId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Persona assigned to plan ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/assign-persona-to-plan ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to assign persona to plan: ${error.message}` });
  }
});

// Update media plan post
app.post('/airtable/update-media-plan-post', async (req, res) => {
  console.log('--- Received request for /api/airtable/update-media-plan-post ---');
  try {
    const { post, brandId, imageUrl, videoUrl } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Media plan post updated ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/update-media-plan-post ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to update media plan post: ${error.message}` });
  }
});

// Save media plan group
app.post('/airtable/save-media-plan-group', async (req, res) => {
  console.log('--- Received request for /api/airtable/save-media-plan-group ---');
  try {
    const { group, imageUrls, brandAirtableId } = req.body;

    if (!group || !group.name || !Array.isArray(group.posts)) {
      return res.status(400).json({ error: 'Invalid group data provided.' });
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
    res.json({ success: true, groupId: newGroupId, postIds: createdPostIds });
  } catch (error) {
    console.error('--- CRASH in /api/airtable/save-media-plan-group ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to save media plan group: ${error.message}` });
  }
});

// Sync asset media
app.post('/airtable/sync-asset-media', async (req, res) => {
  console.log('--- Received request for /api/airtable/sync-asset-media ---');
  try {
    const { imageUrls, brandId, assets } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Asset media synced ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/sync-asset-media ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to sync asset media: ${error.message}` });
  }
});

// Bulk update post schedules
app.post('/airtable/bulk-update-post-schedules', async (req, res) => {
  console.log('--- Received request for /api/airtable/bulk-update-post-schedules ---');
  try {
    const { updates, brandId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Post schedules updated ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/bulk-update-post-schedules ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to update post schedules: ${error.message}` });
  }
});

// Fetch affiliate links
app.post('/airtable/fetch-affiliate-links', async (req, res) => {
  console.log('--- Received request for /api/airtable/fetch-affiliate-links ---');
  try {
    const { brandId } = req.body;
    
    // Implementation would go here
    res.json({ links: [] });
    console.log('--- Affiliate links fetched ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/fetch-affiliate-links ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to fetch affiliate links: ${error.message}` });
  }
});

// Save settings
app.post('/airtable/save-settings', async (req, res) => {
  console.log('--- Received request for /api/airtable/save-settings ---');
  try {
    const { settings, brandId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Settings saved ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/save-settings ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to save settings: ${error.message}` });
  }
});

// Fetch settings
app.post('/airtable/fetch-settings', async (req, res) => {
  console.log('--- Received request for /api/airtable/fetch-settings ---');
  try {
    const { brandId } = req.body;
    
    // Implementation would go here
    res.json({ settings: null });
    console.log('--- Settings fetched ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/fetch-settings ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to fetch settings: ${error.message}` });
  }
});

// Load project
app.post('/airtable/load-project', async (req, res) => {
  console.log('--- Received request for /api/airtable/load-project ---');
  try {
    const { brandId } = req.body;
    
    // Implementation would go here
    res.json({ 
      assets: null, 
      generatedImages: {}, 
      generatedVideos: {}, 
      brandId 
    });
    console.log('--- Project loaded ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/load-project ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to load project: ${error.message}` });
  }
});

// List media plan groups
app.post('/airtable/list-media-plan-groups', async (req, res) => {
  console.log('--- Received request for /api/airtable/list-media-plan-groups ---');
  try {
    const { brandId } = req.body;
    
    // Implementation would go here
    res.json({ groups: [] });
    console.log('--- Media plan groups listed ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/list-media-plan-groups ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to list media plan groups: ${error.message}` });
  }
});

// Load media plan
app.post('/airtable/load-media-plan', async (req, res) => {
  console.log('--- Received request for /api/airtable/load-media-plan ---');
  try {
    const { planId, brandFoundation, language } = req.body;
    
    // Implementation would go here
    res.json({ 
      plan: null, 
      imageUrls: {}, 
      videoUrls: {} 
    });
    console.log('--- Media plan loaded ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/load-media-plan ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to load media plan: ${error.message}` });
  }
});

// Bulk patch posts
app.post('/airtable/bulk-patch-posts', async (req, res) => {
  console.log('--- Received request for /api/airtable/bulk-patch-posts ---');
  try {
    const { updates, brandId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Posts patched ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/bulk-patch-posts ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to patch posts: ${error.message}` });
  }
});

// Save trend
app.post('/airtable/save-trend', async (req, res) => {
  console.log('--- Received request for /api/airtable/save-trend ---');
  try {
    const { trend, brandId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Trend saved ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/save-trend ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to save trend: ${error.message}` });
  }
});

// Delete trend
app.post('/airtable/delete-trend', async (req, res) => {
  console.log('--- Received request for /api/airtable/delete-trend ---');
  try {
    const { trendId, brandId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Trend deleted ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/delete-trend ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to delete trend: ${error.message}` });
  }
});

// Save ideas
app.post('/airtable/save-ideas', async (req, res) => {
  console.log('--- Received request for /api/airtable/save-ideas ---');
  try {
    const { ideas } = req.body;

    if (!Array.isArray(ideas) || ideas.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty ideas array provided.' });
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
    res.json({ success: true, createdIds: createdIdeaIds });
  } catch (error) {
    console.error('--- CRASH in /api/airtable/save-ideas ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to save ideas: ${error.message}` });
  }
});

// Fetch admin defaults
app.get('/airtable/fetch-admin-defaults', async (req, res) => {
  console.log('--- Received request for /api/airtable/fetch-admin-defaults ---');
  try {
    // Implementation would go here
    res.json({ settings: null });
    console.log('--- Admin defaults fetched ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/fetch-admin-defaults ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to fetch admin defaults: ${error.message}` });
  }
});

// Save admin defaults
app.post('/airtable/save-admin-defaults', async (req, res) => {
  console.log('--- Received request for /api/airtable/save-admin-defaults ---');
  try {
    const { settings } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Admin defaults saved ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/save-admin-defaults ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to save admin defaults: ${error.message}` });
  }
});

// Load AI services
app.get('/airtable/load-ai-services', async (req, res) => {
  console.log('--- Received request for /api/airtable/load-ai-services ---');
  try {
    // Implementation would go here
    res.json({ services: [] });
    console.log('--- AI services loaded ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/load-ai-services ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to load AI services: ${error.message}` });
  }
});

// Save AI service
app.post('/airtable/save-ai-service', async (req, res) => {
  console.log('--- Received request for /api/airtable/save-ai-service ---');
  try {
    const { service } = req.body;
    
    // Implementation would go here
    res.json({ service: null });
    console.log('--- AI service saved ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/save-ai-service ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to save AI service: ${error.message}` });
  }
});

// Delete AI service
app.post('/airtable/delete-ai-service', async (req, res) => {
  console.log('--- Received request for /api/airtable/delete-ai-service ---');
  try {
    const { serviceId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- AI service deleted ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/delete-ai-service ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to delete AI service: ${error.message}` });
  }
});

// Save AI model
app.post('/airtable/save-ai-model', async (req, res) => {
  console.log('--- Received request for /api/airtable/save-ai-model ---');
  try {
    const { model } = req.body;
    
    // Implementation would go here
    res.json({ model: null });
    console.log('--- AI model saved ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/save-ai-model ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to save AI model: ${error.message}` });
  }
});

// Delete AI model
app.post('/airtable/delete-ai-model', async (req, res) => {
  console.log('--- Received request for /api/airtable/delete-ai-model ---');
  try {
    const { modelId } = req.body;
    
    // Implementation would go here
    res.json({ success: true });
    console.log('--- AI model deleted ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/delete-ai-model ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to delete AI model: ${error.message}` });
  }
});

// Ensure tables exist
app.post('/airtable/ensure-tables', async (req, res) => {
  console.log('--- Received request for /api/airtable/ensure-tables ---');
  try {
    // Implementation would go here
    res.json({ success: true });
    console.log('--- Tables ensured ---');
  } catch (error) {
    console.error('--- CRASH in /api/airtable/ensure-tables ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to ensure tables: ${error.message}` });
  }
});

// Cloudflare Image Generation Endpoint
app.post('/cloudflare/generate-image', async (req, res) => {
  console.log('--- Received request for /api/cloudflare/generate-image ---');
  try {
    const { prompt, model, image } = req.body;
    const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return res.status(500).json({ error: 'Cloudflare credentials not configured on server' });
    }

    if (!model || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: model and prompt' });
    }
    const apiUrl = `https://ai-proxy.tk100mil.workers.dev/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${encodeURIComponent(model)}`;

    // The payload can be either text-to-image or image-to-image
    const inputs = {
      prompt,
      negative_prompt: 'text, typography, writing, letters, words, text overlay'
    };

    // Add image if provided (for image-to-image tasks)
    if (image && Array.isArray(image)) {
      inputs.image = image;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputs)
    });

    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = errorData.errors?.map((e) => e.message).join(', ') || JSON.stringify(errorData);
      } catch (e) {
        errorText = await response.text();
      }
      throw new Error(`Cloudflare AI Error: ${errorText}`);
    }

    const blob = await response.blob();
    // Check if the successful response is actually an image
    if (blob.type.startsWith('image/')) {
      const buffer = await blob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = blob.type;
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      res.json({ image: dataUrl });
    } else {
      // Handle cases where the server returns OK but sends an error in a non-image format (e.g., JSON)
      const responseText = await blob.text();
      console.error("Cloudflare AI returned a non-image success response:", responseText);
      throw new Error("Cloudflare AI returned an unexpected response format.");
    }

    console.log('--- Cloudflare image response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/cloudflare/generate-image ---');
    console.error('Error object:', error);
    res.status(500).json({ error: 'Failed to generate image from Cloudflare API: ' + error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      gemini: !!process.env.GEMINI_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      cloudflare: !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN),
      cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET),
      facebook: !!(process.env.FACEBOOK_APP_ID),
      airtable: !!(process.env.AIRTABLE_PAT && process.env.AIRTABLE_BASE_ID)
    }
  });
});

// Gemini Embedding Endpoint for KhongMinh service
app.post('/gemini/embed', async (req, res) => {
  console.log('--- Received request for /api/gemini/embed ---');
  try {
    const { texts, taskTypes } = req.body;
    const { GEMINI_API_KEY } = process.env;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    if (!texts || !Array.isArray(texts) || !taskTypes || !Array.isArray(taskTypes) || texts.length !== taskTypes.length) {
      return res.status(400).json({ error: 'Invalid request: texts and taskTypes must be arrays of the same length' });
    }

    // Import the Google GenAI library
    const { GoogleGenAI } = await import("@google/generative-ai");
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Generate embeddings for all texts
    const embeddingPromises = texts.map((text, index) => 
      ai.models.embedContent({
        model: "embedding-001",
        contents: { parts: [{ text }] },
        taskType: taskTypes[index]
      })
    );

    const embeddingResults = await Promise.all(embeddingPromises);
    
    // Extract embedding values
    const embeddings = embeddingResults.map(res => res.embeddings[0].values);

    res.json({ embeddings });
    console.log('--- Gemini embeddings response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/gemini/embed ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to generate embeddings with Gemini: ${error.message}` });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app; // Export the app for Vercel
