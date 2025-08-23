import { config } from 'dotenv';
config();

import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, contents, config: generationConfig } = request.body;

    if (!model || !contents) {
      return response.status(400).json({ error: 'Missing required fields: model and contents' });
    }

    // Initialize Gemini AI
    if (!process.env.GEMINI_API_KEY) {
      return response.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Separate systemInstruction from generationConfig
    const genConfig = { ...generationConfig };
    const systemInstruction = genConfig?.systemInstruction;
    if (systemInstruction) {
      delete genConfig.systemInstruction;
    }

    const modelConfig = { model: model };
    if (systemInstruction) {
      modelConfig.systemInstruction = systemInstruction;
    }

    const geminiModel = genAI.getGenerativeModel(modelConfig);

    // Using the full configuration if provided
    const generateContentRequest = {
      contents: [{ parts: [{ text: JSON.stringify(contents) }] }]
    };
    
    if (Object.keys(genConfig).length > 0) {
      generateContentRequest.generationConfig = genConfig;
    }

    const result = generationConfig 
      ? await geminiModel.generateContent(generateContentRequest)
      : await geminiModel.generateContent(JSON.stringify(contents));
    
    const responseText = result.response.text();

    return response.status(200).json({ text: responseText });
  } catch (error) {
    console.error('Error in /api/gemini/generate:', error);
    return response.status(500).json({ error: 'Failed to generate content from Gemini API: ' + error.message });
  }
}