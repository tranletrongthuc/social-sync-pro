const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the .env file. Gemini-related routes will fail.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/gemini/generate ---');
  try {
    console.log('Request body:', JSON.stringify(request.body, null, 2));
    const { model, contents, config } = request.body;

    if (!model || !contents) {
      console.log('Validation failed: Missing model or contents.');
      return response.status(400).json({ error: 'Missing required fields: model and contents' });
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

    response.status(200).json({ text: responseText });
    console.log('--- Response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/gemini/generate ---');
    console.error('Error object:', error);
    response.status(500).json({ error: 'Failed to generate content from Gemini API: ' + error.message });
  }
}