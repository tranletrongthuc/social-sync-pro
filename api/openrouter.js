import { allowCors } from '../server_lib/cors.js';
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function handler(request, response) {
  const { action } = request.query;

  // Helper function for robust response handling
  const handleOpenRouterResponse = async (openrouterResponse) => {
    const responseText = await openrouterResponse.text();

    if (!openrouterResponse.ok) {
      let errorMessage = `OpenRouter API error: ${openrouterResponse.status} ${openrouterResponse.statusText}`;
      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          errorMessage = responseText.substring(0, 500); // Use raw text if not JSON
        }
      }
      throw new Error(errorMessage);
    }

    if (!responseText) {
        console.warn("OpenRouter returned an empty but successful response.");
        return null; // Return null to indicate empty response
    }

    try {
        return JSON.parse(responseText);
    } catch (e) {
        console.error("Failed to parse JSON from OpenRouter response, returning raw text object.");
        // If parsing fails, but it was a 200 OK, return as text
        return { raw_text: responseText };
    }
  };

  switch (action) {
    case 'generate': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/openrouter/generate ---');
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

        const responseData = await handleOpenRouterResponse(openrouterResponse);

        if (!responseData) {
            return response.status(200).json([]); // Handle empty but successful response
        }

        if (responseData.raw_text) {
            return response.status(200).json({ text: responseData.raw_text });
        }
        
        if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message?.content) {
          const responseText = responseData.choices[0].message.content;
          try {
            const parsedData = JSON.parse(responseText);
            const finalData = parsedData.ViralIdeas || parsedData.ideas || parsedData;
            response.status(200).json(finalData);
          } catch (e) {
            response.status(200).json({ text: responseText });
          }
        } else {
           response.status(200).json([]); // Return empty array if no content
        }

        console.log('--- OpenRouter response sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/openrouter/generate ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate content from OpenRouter API: ' + error.message });
      }
      break;
    }
    case 'generate-image': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/openrouter/generate-image ---');
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

        const responseData = await handleOpenRouterResponse(openrouterResponse);

        if (!responseData) {
            return response.status(200).json({ image: '' }); // Handle empty but successful response
        }

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
        console.log('--- OpenRouter image response sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/openrouter/generate-image ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate image from OpenRouter API: ' + error.message });
      }
      break;
    }
    default:
      response.setHeader('Allow', ['POST']);
      response.status(405).end(`Method ${request.method} Not Allowed for action ${action}`);
  }
}

export default allowCors(handler);