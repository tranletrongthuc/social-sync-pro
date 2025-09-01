import { allowCors } from './lib/cors.js';
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function handler(request, response) {
  const { action } = request.query;

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  switch (action) {
    case 'generate-image':
      console.log('--- Received request for /api/cloudflare/generate-image ---');
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

        console.log('--- Cloudflare image response sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/cloudflare/generate-image ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate image from Cloudflare API: ' + error.message });
      }
      break;
    default:
      response.status(400).json({ error: `Unknown action: ${action}` });
  }
}

export default allowCors(handler);
