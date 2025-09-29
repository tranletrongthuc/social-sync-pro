import { allowCors } from '../server_lib/cors.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the .env file. Embedding route will fail.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('--- Received request for /api/embedding ---');
  try {
    const { texts, taskTypes } = request.body;

    if (!texts || !Array.isArray(texts) || !taskTypes || !Array.isArray(taskTypes) || texts.length !== taskTypes.length) {
      return response.status(400).json({ error: 'Invalid request: texts and taskTypes must be arrays of the same length' });
    }

    const embeddingPromises = texts.map((text, index) => 
      genAI.getGenerativeModel({ model: "embedding-001" }).embedContent({
        content: { parts: [{ text }] },
        taskType: taskTypes[index]
      })
    );

    const embeddingResults = await Promise.all(embeddingPromises);
    
    const embeddings = embeddingResults.map(res => res.embedding.values);

    response.status(200).json({ embeddings });
    console.log('--- Gemini embeddings response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/embedding ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to generate embeddings with Gemini: ${error.message}` });
  }
}

export default allowCors(handler);
