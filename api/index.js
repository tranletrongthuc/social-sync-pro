import { allowCors } from '../server_lib/cors.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import FormData from 'form-data';
import mongodbHandler from './mongodb.js';

// Initialize AI services
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const { service, action } = request.query;

  // Route based on service
  switch (service) {
    case 'mongodb':
      return handleMongodbRequest(request, response, action);
    case 'gemini':
      return handleGeminiRequest(request, response, action);
    case 'openrouter':
      return handleOpenRouterRequest(request, response, action);
    case 'cloudflare':
      return handleCloudflareRequest(request, response, action);
    case 'cloudinary':
      return handleCloudinaryRequest(request, response, action);
    case 'facebook':
      return handleFacebookRequest(request, response, action);
    case 'health':
      return handleHealthRequest(request, response);
    default:
      response.setHeader('Allow', ['GET', 'POST']);
      response.status(405).end(`Service ${service} Not Allowed`);
  }
}

// Gemini handler
async function handleGeminiRequest(request, response, action) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not defined in the .env file. Gemini-related routes will fail.");
  }

  switch (action) {
    case 'generate': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      try {
        const { model, contents, config } = request.body;

        if (!model || !contents) {
          return response.status(400).json({ error: 'Missing required fields: model and contents' });
        }

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

        const generateContentRequest = {
          contents: [{ parts: [{ text: JSON.stringify(contents) }] }]
        };
        
        if (Object.keys(generationConfig).length > 0) {
          generateContentRequest.generationConfig = generationConfig;
        }

        const result = config 
          ? await geminiModel.generateContent(generateContentRequest)
          : await geminiModel.generateContent(JSON.stringify(contents));
        
        const responseText = result.response.text();

        response.status(200).json({ text: responseText });

      } catch (error) {
        console.error('--- CRASH in /api/gemini/generate ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate content from Gemini API: ' + error.message });
      }
      break;
    }
    case 'generate-image': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      try {
        const { model, prompt, config } = request.body;

        if (!model || !prompt) {
          return response.status(400).json({ error: 'Missing required fields: model and prompt' });
        }

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

        const result = await geminiModel.generateImages({ prompt, config: generationConfig });
        
        if (result.generatedImages && result.generatedImages.length > 0) {
          const base64Image = result.generatedImages[0].image.imageBytes;
          response.status(200).json({ image: `data:image/jpeg;base64,${base64Image}` });
        } else {
          response.status(500).json({ error: 'No image was generated' });
        }

      } catch (error) {
        console.error('--- CRASH in /api/gemini/generate-image ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate image from Gemini API: ' + error.message });
      }
      break;
    }
    case 'embed': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      try {
        const { texts, taskTypes } = request.body;
        const { GEMINI_API_KEY } = process.env;

        if (!GEMINI_API_KEY) {
          return response.status(500).json({ error: 'Gemini API key not configured on server' });
        }

        if (!texts || !Array.isArray(texts) || !taskTypes || !Array.isArray(taskTypes) || texts.length !== taskTypes.length) {
          return response.status(400).json({ error: 'Invalid request: texts and taskTypes must be arrays of the same length' });
        }

        const ai = new GoogleGenerativeAI(GEMINI_API_KEY);

        const embeddingPromises = texts.map((text, index) => 
          ai.getGenerativeModel({ model: "embedding-001" }).embedContent({
            content: { parts: [{ text }] },
            taskType: taskTypes[index]
          })
        );

        const embeddingResults = await Promise.all(embeddingPromises);
        
        const embeddings = embeddingResults.map(res => res.embedding.values);

        response.status(200).json({ embeddings });

      } catch (error) {
        console.error('--- CRASH in /api/gemini/embed ---');
        console.error('Error object:', error);
        response.status(500).json({ error: `Failed to generate embeddings with Gemini: ${error.message}` });
      }
      break;
    }
    default:
      response.setHeader('Allow', ['POST']);
      response.status(405).end(`Method ${request.method} Not Allowed for action ${action}`);
  }
}

// OpenRouter handler
async function handleOpenRouterRequest(request, response, action) {
  switch (action) {
    case 'generate':
    case 'generate-image': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      try {
        const { model, messages, responseFormat } = request.body;

        if (!process.env.OPENROUTER_API_KEY) {
          return response.status(500).json({ error: 'OpenRouter API key not configured on server' });
        }

        if (!model || !messages) {
          return response.status(400).json({ error: 'Missing required fields: model and messages' });
        }

        const siteUrl = request.headers.referer || 'https://socialsync.pro';
        const siteTitle = 'SocialSync Pro';

        const body = {
          model: model,
          messages: messages
        };

        if (responseFormat) {
          body.response_format = responseFormat;
        }

        const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": siteUrl,
            "X-Title": siteTitle,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (!openrouterResponse.ok) {
          const errorData = await openrouterResponse.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `OpenRouter API error: ${openrouterResponse.status} ${openrouterResponse.statusText}`);
        }

        const responseData = await openrouterResponse.json();
        
        if (action === 'generate') {
          let responseText = '';
          if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message?.content) {
            responseText = responseData.choices[0].message.content;
          }
          response.status(200).json({ text: responseText });
        } else {
          let responseImage = '';
          if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message?.content) {
            try {
              const content = responseData.choices[0].message.content;
              const parsed = JSON.parse(content);
              if (parsed.b64_json) {
                responseImage = `data:image/jpeg;base64,${parsed.b64_json}`;
              } else {
                responseImage = content;
              }
            } catch (parseError) {
              responseImage = responseData.choices[0].message.content;
            }
          }
          response.status(200).json({ image: responseImage });
        }

      } catch (error) {
        console.error(`--- CRASH in /api/openrouter/${action} ---`);
        console.error('Error object:', error);
        response.status(500).json({ error: `Failed to ${action === 'generate' ? 'generate content' : 'generate image'} from OpenRouter API: ` + error.message });
      }
      break;
    }
    default:
      response.setHeader('Allow', ['POST']);
      response.status(405).end(`Method ${request.method} Not Allowed for action ${action}`);
  }
}

// Cloudflare handler
async function handleCloudflareRequest(request, response, action) {
  switch (action) {
    case 'generate-image': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      try {
        const { prompt, model, image } = request.body;
        const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;

        if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
          return response.status(500).json({ error: 'Cloudflare credentials not configured on server' });
        }

        if (!model || !prompt) {
          return response.status(400).json({ error: 'Missing required fields: model and prompt' });
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

        const cloudflareResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inputs)
        });

        if (!cloudflareResponse.ok) {
          let errorText;
          try {
            const errorData = await cloudflareResponse.json();
            errorText = errorData.errors?.map((e) => e.message).join(', ') || JSON.stringify(errorData);
          } catch (e) {
            errorText = await cloudflareResponse.text();
          }
          throw new Error(`Cloudflare AI Error: ${errorText}`);
        }

        const blob = await cloudflareResponse.blob();
        // Check if the successful response is actually an image
        if (blob.type.startsWith('image/')) {
          const buffer = await blob.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const mimeType = blob.type;
          const dataUrl = `data:${mimeType};base64,${base64}`;
          
          response.status(200).json({ image: dataUrl });
        } else {
          // Handle cases where the server returns OK but sends an error in a non-image format (e.g., JSON)
          const responseText = await blob.text();
          console.error("Cloudflare AI returned a non-image success response:", responseText);
          throw new Error("Cloudflare AI returned an unexpected response format.");
        }

      } catch (error) {
        console.error('--- CRASH in /api/cloudflare/generate-image ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate image from Cloudflare API: ' + error.message });
      }
      break;
    }
    default:
      response.setHeader('Allow', ['POST']);
      response.status(405).end(`Method ${request.method} Not Allowed for action ${action}`);
  }
}

// Cloudinary handler
async function handleCloudinaryRequest(request, response, action) {
  switch (action) {
    case 'upload': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      try {
        const { media } = request.body;

        if (!media || typeof media !== 'object') {
          return response.status(400).json({ error: 'Missing or invalid media data' });
        }

        const mediaEntries = Object.entries(media).filter(
          ([, url]) => url && url.startsWith('data:')
        );

        if (mediaEntries.length === 0) {
          return response.status(200).json({ uploadedUrls: {} });
        }

        const uploadPromises = mediaEntries.map(async ([key, url]) => {
          try {
            const isVideo = url.startsWith('data:video');
            const resourceType = isVideo ? 'video' : 'image';
            const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
            
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

            const cloudinaryResponse = await fetch(uploadUrl, {
              method: 'POST',
              body: formData,
              headers: formData.getHeaders()
            });

            if (!cloudinaryResponse.ok) {
              const errorData = await cloudinaryResponse.json().catch(() => ({}));
              throw new Error(`Cloudinary upload failed: ${errorData.error?.message || cloudinaryResponse.statusText}`);
            }

            const result = await cloudinaryResponse.json();
            return [key, result.secure_url];
          } catch (error) {
            console.error(`Failed to upload media with key "${key}" to Cloudinary:`, error);
            return null;
          }
        });

        const results = await Promise.all(uploadPromises);
        const uploadedUrls = Object.fromEntries(results.filter(r => r !== null));

        response.status(200).json({ uploadedUrls });

      } catch (error) {
        console.error('--- CRASH in /api/cloudinary/upload ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to upload media to Cloudinary: ' + error.message });
      }
      break;
    }
    default:
      response.setHeader('Allow', ['POST']);
      response.status(405).end(`Method ${request.method} Not Allowed for action ${action}`);
  }
}



// MongoDB handler
async function handleMongodbRequest(request, response, action) {
  return mongodbHandler(request, response);
}

// Health check handler
async function handleHealthRequest(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  response.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      gemini: !!process.env.GEMINI_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      cloudflare: !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN),
      cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET),
      facebook: !!(process.env.FACEBOOK_APP_ID),
      mongodb: !!process.env.MONGODB_URI
    }
  });
}

export default allowCors(handler);
