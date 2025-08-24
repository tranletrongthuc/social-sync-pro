const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

export default async function handler(request, response) {
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

    if (!openrouterResponse.ok) {
      const errorData = await openrouterResponse.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter API error: ${openrouterResponse.status} ${openrouterResponse.statusText}`);
    }

    const responseData = await openrouterResponse.json();
    
    // Extract text from the response
    let responseText = '';
    if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message?.content) {
      responseText = responseData.choices[0].message.content;
    }

    response.status(200).json({ text: responseText });
    console.log('--- OpenRouter response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/openrouter/generate ---');
    console.error('Error object:', error);
    response.status(500).json({ error: 'Failed to generate content from OpenRouter API: ' + error.message });
  }
}