
import { allowCors } from './lib/cors.js';

function handler(request, response) {
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
      airtable: !!(process.env.AIRTABLE_PAT && process.env.AIRTABLE_BASE_ID)
    }
  });
}

export default allowCors(handler);
