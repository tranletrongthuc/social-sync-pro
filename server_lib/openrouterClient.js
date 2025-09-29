const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Helper function for robust response handling
async function handleOpenRouterResponse(openrouterResponse) {
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
}

async function generateWithOpenRouter(model, contents, config) {
  console.log('--- Calling OpenRouter with model:', model);
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured on server');
    }

    // OpenRouter expects messages array, so convert contents string to that format
    const messages = [{ role: "user", content: contents }];

    const siteUrl = process.env.VERCEL_URL || 'https://socialsync.pro'; // Use VERCEL_URL for serverless context
    const siteTitle = 'SocialSync Pro';

    const body = {
      model: model,
      messages: messages
    };

    if (config?.responseFormat) { // Pass responseFormat from config if available
      body.response_format = config.responseFormat;
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
        return ''; // Return empty string for empty but successful response
    }

    if (responseData.raw_text) {
        return responseData.raw_text;
    }
    
    if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message?.content) {
      return responseData.choices[0].message.content;
    } else {
       return ''; // Return empty string if no content
    }

  } catch (error) {
    console.error('--- ERROR in generateWithOpenRouter ---');
    console.error(error);
    throw new Error('Failed to generate content from OpenRouter API: ' + error.message);
  }
}

async function generateImageWithOpenRouter(model, prompt, n = 1, size = "1024x1024") {
    console.log('--- Calling OpenRouter for Image Generation with model:', model);
    try {
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error('OpenRouter API key not configured on server');
        }

        const siteUrl = process.env.VERCEL_URL || 'https://socialsync.pro';
        const siteTitle = 'SocialSync Pro';

        const body = {
            model: model,
            prompt: prompt,
            n: n,
            size: size,
        };

        const openrouterResponse = await fetch("https://openrouter.ai/api/v1/images/generations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": siteUrl,
                "X-Title": siteTitle,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        return handleOpenRouterResponse(openrouterResponse);

    } catch (error) {
        console.error('--- ERROR in generateImageWithOpenRouter ---', error);
        throw new Error('Failed to generate image from OpenRouter API: ' + error.message);
    }
}

export {
    generateWithOpenRouter,
    generateImageWithOpenRouter
};
