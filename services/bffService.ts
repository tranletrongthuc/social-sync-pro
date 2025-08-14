import type { MediaPlanPost, AffiliateLink, BrandFoundation, Persona } from '../types';

// Get the BFF URL from environment variables or use default
const BFF_URL = import.meta.env.VITE_BFF_URL || '';

// Generic fetch helper with error handling
const bffFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Use relative path when proxying through Vite
  const url = BFF_URL ? `${BFF_URL}${endpoint}` : endpoint;
  
  // Retry mechanism for fetch requests
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
      lastError = error as Error;
      
      // If this is the last attempt, re-throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

// --- Gemini API Functions ---

export const generateContentWithBff = async (
  model: string,
  contents: string,
  config?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/gemini/generate', {
      method: 'POST',
      body: JSON.stringify({ model, contents, config }),
    });
    
    return response.text;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/gemini/generate:`, error);
    throw error;
  }
};

export const generateImageWithBff = async (
  model: string,
  prompt: string,
  config?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/gemini/generate-image', {
      method: 'POST',
      body: JSON.stringify({ model, prompt, config }),
    });
    
    return response.image;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/gemini/generate-image:`, error);
    throw error;
  }
};

// --- OpenRouter API Functions ---

export const generateContentWithOpenRouterBff = async (
  model: string,
  messages: any[],
  responseFormat?: any
): Promise<string> => {
  try {
    const response = await bffFetch('/api/openrouter/generate', {
      method: 'POST',
      body: JSON.stringify({ model, messages, responseFormat }),
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
    const response = await bffFetch('/api/openrouter/generate-image', {
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
    const response = await bffFetch('/api/cloudinary/upload', {
      method: 'POST',
      body: JSON.stringify({ media, cloudName, uploadPreset }),
    });
    
    return response.uploadedUrls;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/cloudinary/upload:`, error);
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
    const response = await bffFetch('/api/facebook/publish', {
      method: 'POST',
      body: JSON.stringify({ post, imageUrl, pageId, accessToken, videoUrl }),
    });
    
    return response;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/facebook/publish:`, error);
    throw error;
  }
};

// --- Airtable API Functions ---

export const airtableRequestWithBff = async (
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<any> => {
  try {
    const response = await bffFetch('/api/airtable/request', {
      method: 'POST',
      body: JSON.stringify({ method, path, body, headers }),
    });
    
    return response;
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/airtable/request:`, error);
    throw error;
  }
};

// --- Health Check ---

export const checkBffHealth = async (): Promise<{
  status: string;
  timestamp: string;
  services: Record<string, boolean>;
}> => {
  try {
    return await bffFetch('/api/health');
  } catch (error) {
    console.error(`Error calling BFF endpoint /api/health:`, error);
    throw error;
  }
};