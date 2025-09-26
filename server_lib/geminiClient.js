import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined. AI service calls will fail.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateWithGemini(model, contents, config) {
  console.log('--- Calling Gemini with model:', model);
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }

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

    // Format the content according to Google's new API structure
    let formattedContents;
    if (typeof contents === 'string') {
      formattedContents = [{ role: "user", parts: [{ text: contents }] }];
    } else if (Array.isArray(contents)) {
      formattedContents = contents;
    } else {
      formattedContents = [{ role: "user", parts: [contents] }];
    }

    const generateContentRequest = {
      contents: formattedContents
    };
    
    if (Object.keys(generationConfig).length > 0) {
      generateContentRequest.generationConfig = generationConfig;
    }
    if (tools) {
      generateContentRequest.tools = tools;
    }

    const result = await geminiModel.generateContent(generateContentRequest);
    const response = result.response;
    if (!response) {
      throw new Error("No response received from Gemini API");
    }
    
    const responseText = response.text();
    if (!responseText) {
      throw new Error("No text content in Gemini API response");
    }
    
    return responseText;

  } catch (error) {
    console.error('--- ERROR in generateWithGemini ---');
    console.error(error);
    
    // Check if it's a rate limit error specifically
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      throw new Error('Rate limit exceeded for Gemini API: ' + error.message);
    }
    
    throw new Error('Failed to generate content from Gemini API: ' + error.message);
  }
}