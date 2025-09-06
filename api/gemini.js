import { allowCors } from './lib/cors.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getClientAndDb } from './lib/mongodb.js';
import { ObjectId } from 'mongodb';

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the .env file. Gemini-related routes will fail.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



/**
 * Constructs a detailed, layered prompt for the AI based on a persona.
 * @param {object} persona - The full persona object.
 * @param {string} objective - The user's simple objective for the post.
 * @param {string} platform - The target social media platform.
 * @returns {string} The fully constructed prompt for the AI.
 */
function constructBelievablePersonaPrompt(persona, objective, platform, keywords, pillar) {
  const { 
    nickName, 
    demographics, 
    backstory, 
    voice, 
    knowledgeBase, 
    brandRelationship 
  } = persona;

  const promptLayers = [];

  // Layer 1: Role-play instruction
  promptLayers.push(`You are ${nickName}, a ${demographics?.age}-year-old ${demographics?.occupation} from ${demographics?.location}.`);

  // Layer 2: Personality and Voice
  if (voice) {
    promptLayers.push(`Your personality is: ${voice.personalityTraits?.join(', ')}.`);
    promptLayers.push(`Your writing style is defined by these rules: ${voice.linguisticRules?.join('. ')}.`);
  }

  // Layer 3: Backstory and Values
  if (backstory) {
    promptLayers.push(`Your personal backstory is: ${backstory}`);
  }

  // Layer 4: Interests
  if (knowledgeBase && knowledgeBase.length > 0) {
    promptLayers.push(`You are knowledgeable about and interested in: ${knowledgeBase.join(', ')}.`);
  }

  // Layer 5: Context and Task
  promptLayers.push(`
---
`);
  promptLayers.push(`CONTEXT: Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`);
  promptLayers.push(`TASK: Write a social media post for the ${platform} platform.`);
  promptLayers.push(`The simple objective of the post is: "${objective}".`);
  if (pillar) {
    promptLayers.push(`The post MUST align with the following content pillar: "${pillar}".`);
  }
  if (keywords && keywords.length > 0) {
    promptLayers.push(`You MUST naturally incorporate the following keywords into the post: ${keywords.join(', ')}.`);
  }
  promptLayers.push(`Write the post naturally from your perspective. Weave in your personality, interests, and backstory where it feels authentic.`);

  // Layer 6: Negative Constraints
  promptLayers.push(`
DO NOT:
`);
  promptLayers.push(`- Do not sound like a generic advertisement or AI.`);
  promptLayers.push(`- Do not break character.`);
  promptLayers.push(`- Do not use generic hashtags unless they fit your personality.`);

  return promptLayers.join('\n');
}

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
          contents: [{ parts: [{ text: contents }] }]
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
        const { model: modelName, prompt } = request.body;

        if (!prompt || !modelName) {
          return response.status(400).json({ error: 'Missing required field: prompt and model' });
        }
        
        const model = genAI.getGenerativeModel({ model: modelName.replace('banana/', '') });
        
        console.log(`Generating banana image with ${modelName}...`);

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
    case 'auto-generate-persona': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }
      console.log('--- Received request for /api/gemini/auto-generate-persona ---');
      try {
        const { mission, usp, model: modelName } = request.body;

        if (!mission || !usp || !modelName) {
          return response.status(400).json({ error: 'Missing required fields: mission, usp, and model' });
        }

        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: "You are a helpful assistant that only returns valid, minified JSON objects in a single array. Do not include any markdown formatting or extra text outside of the JSON array.",
        });

        const prompt = `
          Based on the following brand information, generate an array of EXACTLY 3 diverse and detailed persona profiles.

          **Brand Information:**
          *   **Mission Statement:** "${mission}"
          *   **Unique Selling Proposition (USP):** "${usp}"

          **Instructions:**
          - Generate 3 distinct personas with a mix of genders.
          - Each field in the JSON structure MUST be filled with meaningful, creative, and relevant content. Do not leave fields empty.
          - The entire output must be a single, minified JSON array.
          - CRITICAL: The final output must be a perfectly valid JSON array. Do not use trailing commas.

          **JSON Structure:**
          [
            {
              "nickName": "Realistic first and last name",
              "gender": "Male or Female",
              "demographics": {
                "age": A number between 20 and 55,
                "location": "A specific city and country",
                "occupation": "A specific, modern job title"
              },
              "backstory": "A 2-3 sentence backstory explaining their journey, motivations, and what they value, connecting them to the brand mission.",
              "voice": {
                "personalityTraits": ["Trait 1", "Trait 2", "Trait 3"],
                "communicationStyle": {
                  "formality": "A number between 0 and 100",
                  "energy": "A number between 0 and 100"
                },
                "linguisticRules": ["A specific linguistic quirk, e.g., Uses a certain slang term", "A rule about sentence structure", "A rule about emoji usage"]
              },
              "knowledgeBase": ["Interest 1", "Interest 2", "Interest 3"],
              "brandRelationship": {
                "originStory": "How did they discover the brand? Connect it to their values.",
                "coreAffinity": "Which specific brand value resonates most with them?",
                "productUsage": "How do they use the brand’s products/services in their daily life?"
              },
              "visualCharacteristics": "Detailed descriptions of the persona's appearance, clothing, and style for avatar generation."
            }
          ]
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

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
    case 'generate-in-character-post': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }
      console.log('--- Received request for /api/gemini/generate-in-character-post ---');
      try {
        const { model: modelName, personaId, objective, platform, keywords, pillar } = request.body;

        if (!modelName || !personaId || !objective || !platform) {
          return response.status(400).json({ error: 'Missing required fields: model, personaId, objective, and platform' });
        }

        // Fetch the persona from the database
        const { db } = await getClientAndDb();
        const persona = await db.collection('personas').findOne({ _id: new ObjectId(personaId) });

        if (!persona) {
          return response.status(404).json({ error: `Persona with id ${personaId} not found.` });
        }

        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = constructBelievablePersonaPrompt(persona, objective, platform, keywords, pillar);
        
        console.log(`--- Constructed Prompt for ${persona.nickName} ---`, prompt);

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        response.status(200).json({ text: responseText });
        console.log('--- In-character post sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/gemini/generate-in-character-post ---');
        console.error('Error object:', error);
        response.status(500).json({ error: 'Failed to generate in-character post from Gemini API: ' + error.message });
      }
      break;
    }
    default:
      response.setHeader('Allow', ['POST']);
      response.status(405).end(`Method ${request.method} Not Allowed for action ${action}`);
  }
}

export default allowCors(handler);