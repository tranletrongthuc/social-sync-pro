import { allowCors } from '../server_lib/cors.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getClientAndDb } from '../server_lib/mongodb.js';
import { ObjectId } from 'mongodb';

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the .env file. Gemini-related routes will fail.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// The constructBelievablePersonaPrompt function is removed as its logic is now handled by configurable prompts.

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
        
        // Extract the actual model name by removing the 'banana/' prefix
        const actualModelName = modelName.replace('banana/', '');
        const model = genAI.getGenerativeModel({ model: actualModelName });
        
        console.log(`Generating banana image with ${modelName} (${actualModelName})...`);

        let result;
        const MAX_RETRIES = 3;
        let lastError;
        
        for (let i = 0; i < MAX_RETRIES; i++) {
          try {
            // Use the latest Google Generative AI SDK method for content generation
            result = await model.generateContent({
              contents: [{
                role: 'user',
                parts: [
                  { text: prompt }
                ]
              }]
            });
            break; // Success, exit loop
          } catch (error) {
            lastError = error;
            // Check for rate limit error
            if (error.status === 429 || error.message.includes('429') || error.message.includes('Too Many Requests') || error.message.toLowerCase().includes('rate limit')) {
              if (i < MAX_RETRIES - 1) {
                // Extract retry delay from error if available, otherwise use default
                let retryDelay = 8500; // Default to 8.5 seconds
                if (error.errorDetails) {
                  // Look for retry info in error details
                  const retryInfo = error.errorDetails.find(detail => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
                  if (retryInfo && retryInfo.retryDelay) {
                    // Parse the retry delay (e.g., "24s")
                    const delayString = retryInfo.retryDelay;
                    if (delayString.endsWith('s')) {
                      const seconds = parseInt(delayString.replace('s', ''));
                      if (!isNaN(seconds)) {
                        retryDelay = seconds * 1000; // Convert to milliseconds
                      }
                    }
                  }
                }
                console.warn(`Rate limit hit. Retrying in ${retryDelay/1000} seconds... (${i + 1}/${MAX_RETRIES})`);
                await delay(retryDelay);
              } else {
                console.error('Max retries reached for rate limit error.');
                throw error; // Re-throw the last error
              }
            } else {
              throw error; // Not a rate limit error, throw immediately
            }
          }
        }

        if (!result) {
          throw new Error("Failed to generate content after retries: " + (lastError?.message || "Unknown error"));
        }

        const resultResponse = result.response;

        // Check if we have a valid response
        if (!resultResponse || !resultResponse.candidates || resultResponse.candidates.length === 0) {
          throw new Error("No valid response from Gemini API");
        }

        // Look for inline image data in the response
        let imageData = null;
        let mimeType = null;
        
        // Iterate through candidates to find image data
        for (const candidate of resultResponse.candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData) {
                imageData = part.inlineData.data;
                mimeType = part.inlineData.mimeType;
                break;
              }
            }
            if (imageData) break;
          }
        }

        // If we found image data, return it
        if (imageData && mimeType) {
          response.status(200).json({ image: `data:${mimeType};base64,${imageData}` });
        } else {
          // If no image data found, check if we have text content as fallback
          let textContent = null;
          for (const candidate of resultResponse.candidates) {
            if (candidate.content && candidate.content.parts) {
              for (const part of candidate.content.parts) {
                if (part.text) {
                  textContent = part.text;
                  break;
                }
              }
              if (textContent) break;
            }
          }
          
          // If we have text content, it might be a description of an image
          if (textContent) {
            console.warn("No image data found in response, returning text content as fallback");
            response.status(200).json({ text: textContent });
          } else {
            throw new Error("No image or text data found in Gemini response.");
          }
        }

        console.log('--- Banana image response sent to client ---');

      } catch (error) {
        console.error('--- CRASH in /api/gemini/generate-banana-image ---');
        console.error('Error object:', error);
        
        // Handle quota exceeded errors more gracefully
        if (error.status === 429 || (error.message && error.message.includes('quota'))) {
          response.status(429).json({ 
            error: 'Rate limit exceeded. Please try again later or use a different model.',
            details: 'You have exceeded your current quota for the Gemini API. Please check your plan and billing details.'
          });
        } else {
          response.status(500).json({ 
            error: 'Failed to generate banana image from Gemini API: ' + error.message,
            details: error.stack || 'No stack trace available'
          });
        }
      }
      break;
    }
    case 'auto-generate-persona': {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
      }
      console.log('--- Received request for /api/gemini/auto-generate-persona ---');
      try {
        const { mission, usp, model: modelName, settings } = request.body;

        if (!mission || !usp || !modelName || !settings || !settings.prompts) {
          return response.status(400).json({ error: 'Missing required fields: mission, usp, model, and settings with prompts' });
        }

        const prompts = settings.prompts.autoGeneratePersona;

        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: prompts.systemInstruction,
        });

        const prompt = prompts.mainPrompt
          .replace('{mission}', mission)
          .replace('{usp}', usp);

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
        const { model: modelName, personaId, objective, platform, keywords, pillar, settings } = request.body;

        if (!modelName || !personaId || !objective || !platform || !settings || !settings.prompts) {
          return response.status(400).json({ error: 'Missing required fields: model, personaId, objective, platform, and settings with prompts' });
        }

        // Fetch the persona from the database
        const { db } = await getClientAndDb();
        const persona = await db.collection('personas').findOne({ _id: new ObjectId(personaId) });

        if (!persona) {
          return response.status(404).json({ error: `Persona with id ${personaId} not found.` });
        }

        const p = settings.prompts.generateInCharacterPost;
        const promptLayers = [];

        promptLayers.push(p.rolePlayInstruction
            .replace('{nickName}', persona.nickName)
            .replace('{demographics.age}', persona.demographics?.age)
            .replace('{demographics.occupation}', persona.demographics?.occupation)
            .replace('{demographics.location}', persona.demographics?.location)
        );

        if (persona.voice) {
            promptLayers.push(p.personalityInstruction.replace('{voice.personalityTraits}', persona.voice.personalityTraits?.join(', ')));
            promptLayers.push(p.writingStyleInstruction.replace('{voice.linguisticRules}', persona.voice.linguisticRules?.join('. ')));
        }
        if (persona.backstory) {
            promptLayers.push(p.backstoryInstruction.replace('{backstory}', persona.backstory));
        }
        if (persona.knowledgeBase && persona.knowledgeBase.length > 0) {
            promptLayers.push(p.interestsInstruction.replace('{knowledgeBase}', persona.knowledgeBase.join(', ')));
        }

        promptLayers.push(p.contextPreamble.replace('{date}', new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })));
        promptLayers.push(p.taskInstruction.replace('{platform}', platform));
        promptLayers.push(p.objectiveInstruction.replace('{objective}', objective));

        if (pillar) {
            promptLayers.push(p.pillarInstruction.replace('{pillar}', pillar));
        }
        if (keywords && keywords.length > 0) {
            promptLayers.push(p.keywordsInstruction.replace('{keywords}', keywords.join(', ')));
        }
        promptLayers.push(p.perspectiveInstruction);
        promptLayers.push(p.negativeConstraints);

        const prompt = promptLayers.join('\n');
        
        const model = genAI.getGenerativeModel({ model: modelName });
        
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