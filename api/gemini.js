import { allowCors } from './lib/cors.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the .env file. Gemini-related routes will fail.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function handler(request, response) {
  const { action } = request.query;

  switch (action) {
    case 'generate': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/gemini/generate ---');
      try {
        // console.log('Request body:', JSON.stringify(request.body, null, 2));
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
        const tools = generationConfig?.tools;
        if (tools) {
          delete generationConfig.tools;
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
        if (tools) {
          generateContentRequest.tools = tools;
        }

        const result = await geminiModel.generateContent(generateContentRequest);
        
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
        const { model, prompt } = request.body;

        if (!model || !prompt) {
          return response.status(400).json({ error: 'Missing required fields: model and prompt' });
        }

        const geminiModel = genAI.getGenerativeModel({ model: model });
        console.log(`Generating image with Gemini model: ${model}...`);

        const result = await geminiModel.generateContent(prompt);
        const resultResponse = result.response;

        const inlineDataPart = resultResponse.candidates[0].content.parts.find(part => part.inlineData);

        if (inlineDataPart) {
          const imageData = inlineDataPart.inlineData.data;
          const mimeType = inlineDataPart.inlineData.mimeType;
          response.status(200).json({ image: `data:${mimeType};base64,${imageData}` });
        } else {
          throw new Error("No inline image data found in Gemini response.");
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
    case 'generate-banana-image': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }

      console.log('--- Received request for /api/gemini/generate-banana-image ---');
      try {
        const { prompt } = request.body;

        if (!prompt) {
          return response.status(400).json({ error: 'Missing required field: prompt' });
        }
        
        // const modelConfig = { model: model };
        // if (systemInstruction) {
        //   modelConfig.systemInstruction = systemInstruction;
        // }
        
        // const model = genAI.getGenerativeModel(modelConfig);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
        
        console.log('Generating banana image with Gemini 2.5 Flash Image Preview...');

        const result = await model.generateContent(prompt);
        const resultResponse = result.response;

        const inlineDataPart = resultResponse.candidates[0].content.parts.find(part => part.inlineData);

        if (inlineDataPart) {
          const imageData = inlineDataPart.inlineData.data;
          const mimeType = inlineDataPart.inlineData.mimeType;
          response.status(200).json({ image: `data:${mimeType};base64,${imageData}` });
        } else {
          throw new Error("No inline image data found in Gemini response.");
        }

        console.log('--- Banana image response sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/gemini/generate-banana-image ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate banana image from Gemini API: ' + error.message });
      }
      break;
    }
    case 'auto-generate-persona': {''
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }
      console.log('--- Received request for /api/gemini/auto-generate-persona ---');
      try {
        const { mission, usp } = request.body;

        if (!mission || !usp) {
          return response.status(400).json({ error: 'Missing required fields: mission and usp' });
        }

        // const modelConfig = { model: model };
        // if (systemInstruction) {
        //   modelConfig.systemInstruction = systemInstruction;
        // }
        
        // const model = genAI.getGenerativeModel(modelConfig);
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

        const prompt = `
          You are an expert brand strategist and storyteller. Your task is to create a detailed, brand-aligned persona based on the provided brand information.

          **Brand Information:**
          *   **Mission Statement:** "${mission}"
          *   **Unique Selling Proposition (USP):** "${usp}"

          **Instructions:**
          Generate an array of EXACTLY 3 persona profiles. Each persona in the array must be distinct and diverse from the others.
          - **Diversity Requirement:** The set of personas must include a mix of genders (male, female) and represent different facets of the target audience (e.g., one could be a seasoned expert, another a curious newcomer).
          - **Uniqueness Requirement:** Do not use the same name or highly similar characteristics for different personas in the array. Each profile should feel like a unique individual.

          **Output Format:**
          Provide your response as a single, minified JSON array of objects. Do not include any text or markdown formatting before or after the JSON object. The JSON objects must have the following structure:
          [
            {
              "nickName": "A realistic, human-sounding first and last name for the persona that fits the brand's character (e.g., 'Alex Chen', 'Sophia Miller').",
              "gender": "Male or Female",
              "mainStyle": "A brief description of the persona's primary style (e.g., 'Minimalist and Modern', 'Bohemian and Earthy').",
              "activityField": "The persona's main area of activity or expertise (e.g., 'Tech and Gadgets', 'Sustainable Living', 'Fitness and Wellness').",
              "contentTone": "A description of the appropriate voice and style for all communications (e.g., 'Inspirational and empowering, with a friendly and approachable tone.').",
              "visualCharacteristics": "Detailed descriptions of the persona's appearance, including clothing, style, and specific features. This will be used as a reference for generating an avatar. Be descriptive (e.g., 'Wears ethically sourced linen clothing in neutral tones, has long, flowing brown hair, and a warm, inviting smile. Often seen in natural, outdoor settings.').",
              "coreCharacteristics": [
                "A list of 3-5 key personality traits and values that resonate with the target audience (e.g., 'Authenticity', 'Innovation', 'Community-focused')."
              ],
              "keyMessages": [
                "A list of 3-5 core messages the persona should consistently communicate, derived from the brand's mission and USP."
              ]
            }
          ]
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean the response to ensure it's valid JSON
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Parse the JSON response
        const personaData = JSON.parse(cleanedJson);

        response.status(200).json(personaData);
        console.log('--- Auto-generated persona sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/gemini/auto-generate-persona ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate persona from Gemini API: ' + error.message });
      }
      break;
    }
    default:
      response.setHeader('Allow', ['POST']);
      response.status(405).end(`Method ${request.method} Not Allowed for action ${action}`);
  }
}

export default allowCors(handler);