const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the .env file. Gemini-related routes will fail.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/gemini/generate-image ---');
  try {
    const { model, prompt, config } = request.body;

    if (!model || !prompt) {
      return response.status(400).json({ error: 'Missing required fields: model and prompt' });
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
      response.status(200).json({ image: `data:image/jpeg;base64,${base64Image}` });
    } else {
      response.status(500).json({ error: 'No image was generated' });
    }

    console.log('--- Image response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/gemini/generate-image ---');
    console.error('Error object:', error);
    response.status(500).json({ error: 'Failed to generate image from Gemini API: ' + error.message });
  }
}