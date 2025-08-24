const { GoogleGenerativeAI } = require("@google/generative-ai");

export default async function handler(request, response) {
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

    // Generate embeddings for all texts
    const embeddingPromises = texts.map((text, index) => 
      ai.getGenerativeModel({ model: "embedding-001" }).embedContent({
        content: { parts: [{ text }] },
        taskType: taskTypes[index]
      })
    );

    const embeddingResults = await Promise.all(embeddingPromises);
    
    // Extract embedding values
    const embeddings = embeddingResults.map(res => res.embedding.values);

    response.status(200).json({ embeddings });
    console.log('--- Gemini embeddings response sent to client ---');

  } catch (error) {
    console.error('--- CRASH in /api/gemini/embed ---');
    console.error('Error object:', error);
    response.status(500).json({ error: `Failed to generate embeddings with Gemini: ${error.message}` });
  }
}