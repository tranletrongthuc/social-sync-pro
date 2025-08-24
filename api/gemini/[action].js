
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the .env file. Gemini-related routes will fail.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(request, response) {
  const { action } = request.query;

  switch (action) {
    case 'generate': {
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
      break;
    }
    case 'generate-image': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/gemini/generate-image ---');
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
        console.log('Generating image with Gemini...');

        const result = await geminiModel.generateImages({ prompt, config: generationConfig });
        
        console.log('--- generateImages call SUCCEEDED ---');
        
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
      break;
    }
    case 'embed': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/gemini/embed ---');
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
        console.log('--- Gemini embeddings response sent to client ---');

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
