import type { MediaPlanPost, AffiliateLink, BrandFoundation, Persona } from '../../types';

// Get the BFF URL from environment variables or use default
// In production, VITE_BFF_URL should be set to your actual BFF deployment URL
const BFF_URL = import.meta.env.VITE_BFF_URL || '';

// Generic fetch helper with error handling
export const bffFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Use relative path when proxying through Vite in development
  // Use full URL in production when VITE_BFF_URL is set
  const url = BFF_URL ? `${BFF_URL}${endpoint}` : endpoint;
  
  try {
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'include',
    };
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `BFF request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Re-throw the error to be handled by the calling function
    throw error;
  }
};

// --- Gemini API Functions ---

export const generateContentWithBff = async (
  model: string,
  contents: string,
  config?: any,
  settings?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/gemini?action=generate', {
      method: 'POST',
      body: JSON.stringify({ model, contents, config, settings }),
    });
    
    // The backend returns a JSON object with a text property
    return response.text;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/gemini/generate:`, error);
    throw error;
  }
};

export const generateImageWithBff = async (
  model: string,
  prompt: string,
  config?: any,
  settings?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/gemini?action=generate-image', {
      method: 'POST',
      body: JSON.stringify({ model, prompt, config, settings }),
    });
    
    return response.image;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/gemini/generate-image:`, error);
    throw error;
  }
};

export const generateImageWithBananaBff = async (
  model: string,
  prompt: string,
  settings?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/gemini?action=generate-banana-image', {
      method: 'POST',
      body: JSON.stringify({ model, prompt, settings }),
    });
    
    return response.image;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/gemini/generate-banana-image:`, error);
    throw error;
  }
};

export const autoGeneratePersonaWithBff = async (
  mission: string,
  usp: string,
  model: string,
  settings?: any
): Promise<any> => {
  try {
    const response = await bffFetch('/api/gemini?action=auto-generate-persona', {
      method: 'POST',
      body: JSON.stringify({ mission, usp, model, settings }),
    });
    
    return response;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/gemini?action=auto-generate-persona:`, error);
    throw error;
  }
};

export const generateInCharacterPostWithBff = async (
  model: string,
  personaId: string,
  objective: string,
  platform: string,
  keywords: string[],
  pillar: string,
  settings?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/gemini?action=generate-in-character-post', {
      method: 'POST',
      body: JSON.stringify({ model, personaId, objective, platform, keywords, pillar, settings }),
    });
    
    return response.text;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/gemini?action=generate-in-character-post:`, error);
    throw error;
  }
};

// --- OpenRouter API Functions ---

export const generateContentWithOpenRouterBff = async (
  model: string,
  messages: any[],
  responseFormat?: any,
  settings?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/openrouter?action=generate', {
      method: 'POST',
      body: JSON.stringify({ model, messages, responseFormat, settings }),
    });
    
    return response.text;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/openrouter/generate:`, error);
    throw error;
  }
};

export const generateImageWithOpenRouterBff = async (
  model: string,
  messages: any[],
  responseFormat?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/openrouter?action=generate-image', {
      method: 'POST',
      body: JSON.stringify({ model, messages, responseFormat }),
    });
    
    return response.image;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/openrouter/generate-image:`, error);
    throw error;
  }
};

// --- Cloudinary API Functions ---

export const uploadMediaWithBff = async (
  media: Record<string, string>,
  cloudName: string,
  uploadPreset: string
): Promise<Record<string, string>> => {
  try {
    const response = await bffFetch('/api/cloudinary?action=upload', {
      method: 'POST',
      body: JSON.stringify({ media, cloudName, uploadPreset }),
    });
    
    return response.uploadedUrls;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/cloudinary?action=upload:`, error);
    throw error;
  }
};

// --- Facebook API Functions ---

export const publishToFacebookWithBff = async (
  post: MediaPlanPost,
  imageUrl: string | undefined,
  pageId: string,
  accessToken: string,
  videoUrl?: string
): Promise<{ publishedUrl: string }> => {
  try {
    const response = await bffFetch('/api/facebook?action=publish', {
      method: 'POST',
      body: JSON.stringify({ post, imageUrl, pageId, accessToken, videoUrl }),
    });
    
    return response;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/facebook?action=publish:`, error);
    throw error;
  }
};

// --- Database API Functions ---

export const databaseRequestWithBff = async (
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<any> => {
  try {
    const response = await bffFetch('/api/database/request', {
      method: 'POST',
      body: JSON.stringify({ method, path, body, headers }),
    });
    
    return response;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/database/request:`, error);
    throw error;
  }
};



// --- Cloudflare API Functions ---

export const generateImageWithCloudflareBff = async (
  prompt: string,
  model: string,
  image?: number[],
  settings?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/cloudflare?action=generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt, model, image, settings }),
    });
    
    return response.image;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/cloudflare?action=generate-image:`, error);
    throw error;
  }
};

// --- Gemini Embedding Functions ---

export const generateEmbeddingsWithBff = async (
  texts: string[],
  taskTypes: string[]
): Promise<number[][]> => {
  try {
    const response = await bffFetch('/api/gemini?action=embed', {
      method: 'POST',
      body: JSON.stringify({ texts, taskTypes }),
    });
    
    return response.embeddings;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/gemini/embed:`, error);
    throw error;
  }
};