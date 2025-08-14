const express = require('express');
// const dotenv = require('dotenv');
require('dotenv').config();
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const https = require('https');
const selfsigned = require('selfsigned');
const fetch = require('node-fetch');
const FormData = require('form-data');

// dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Setup CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow all localhost and local IP origins, regardless of port or protocol
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('https://localhost') || origin.startsWith('https://127.0.0.1')) {
        return callback(null, true);
    }
    // Also allow Vite's default development server
    if (origin === 'https://localhost:5173') {
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

console.log('Gemini API key:', process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.send('SocialSync Pro BFF is running!');
});

// Gemini Proxy Endpoint
app.post('/api/gemini/generate', async (req, res) => {
  console.log('--- Received request for /api/gemini/generate ---');
  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    const { model, contents, config } = req.body;

    if (!model || !contents) {
      console.log('Validation failed: Missing model or contents.');
      return res.status(400).json({ error: 'Missing required fields: model and contents' });
    }
    console.log(`Model: ${model}`);

    const geminiModel = genAI.getGenerativeModel({ model: model });
    console.log('Got generative model. Calling generateContent...');

    // Using the full configuration if provided
    const result = config 
      ? await geminiModel.generateContent({ contents: [{ parts: [{ text: JSON.stringify(contents) }] }], generationConfig: config })
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
app.post('/api/gemini/generate-image', async (req, res) => {
  console.log('--- Received request for /api/gemini/generate-image ---');
  try {
    const { model, prompt, config } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: model and prompt' });
    }

    const geminiModel = genAI.getGenerativeModel({ model });
    console.log('Generating image with Gemini...');

    const result = await geminiModel.generateImages({ prompt, config });
    
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
app.post('/api/openrouter/generate', async (req, res) => {
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
app.post('/api/openrouter/generate-image', async (req, res) => {
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
app.post('/api/cloudinary/upload', async (req, res) => {
  console.log('--- Received request for /api/cloudinary/upload ---');
  try {
    const { media, cloudName, uploadPreset } = req.body;

    if (!cloudName || !uploadPreset) {
      return res.status(400).json({ error: 'Missing Cloudinary configuration: cloudName and uploadPreset required' });
    }

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
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

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
        formData.append('upload_preset', uploadPreset);
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
app.post('/api/facebook/publish', async (req, res) => {
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
app.post('/api/airtable/request', async (req, res) => {
  console.log('--- Received request for /api/airtable/request ---');
  try {
    const { method = 'GET', path, body, headers = {} } = req.body;
    const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;

    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
      return res.status(500).json({ error: 'Airtable credentials not configured on server' });
    }

    if (!path) {
      return res.status(400).json({ error: 'Missing path for Airtable request' });
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${path}`;
    
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
    console.log('--- Airtable response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/airtable/request ---');
    console.error('Error object:', error);
    res.status(500).json({ error: `Failed to communicate with Airtable: ${error.message}` });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      gemini: !!process.env.GEMINI_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET),
      airtable: !!(process.env.AIRTABLE_PAT && process.env.AIRTABLE_BASE_ID)
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Server Startup ---
// Generate a self-signed certificate on the fly
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, {
  keySize: 2048,
  days: 365,
  algorithm: 'sha256',
});

const options = {
  key: pems.private,
  cert: pems.cert,
};

https.createServer(options, app).listen(port, () => {
  console.log(`✅ BFF Server listening securely at https://localhost:${port}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   - GET  /`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/gemini/generate`);
  console.log(`   - POST /api/gemini/generate-image`);
  console.log(`   - POST /api/openrouter/generate`);
  console.log(`   - POST /api/openrouter/generate-image`);
  console.log(`   - POST /api/cloudinary/upload`);
  console.log(`   - POST /api/facebook/publish`);
  console.log(`   - POST /api/airtable/request`);
});