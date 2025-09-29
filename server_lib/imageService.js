import { generateImageWithOpenRouter } from './openrouterClient.js';
import { generateImageWithCloudflare } from './cloudflareService.js';
import { getClientAndDb } from './mongodb.js';

// Cache for loaded models to avoid repeated database queries
let cachedModels = null;
let lastModelLoad = 0;
const MODEL_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to load models from database with caching
async function loadModels() {
    const now = Date.now();
    if (cachedModels && (now - lastModelLoad) < MODEL_CACHE_DURATION) {
        return cachedModels;
    }
    
    try {
        const { db } = await getClientAndDb();
        const aiModelsCollection = db.collection('aiModels');
        const models = await aiModelsCollection.find({}).toArray();
        cachedModels = models;
        lastModelLoad = now;
        return models;
    } catch (error) {
        console.error('[imageService] Failed to load models from database:', error);
        // Return empty array if we can't load models
        return [];
    }
}

// Get provider service based on the actual service field from database
async function getProviderService(modelName) {
    try {
        const models = await loadModels();
        const model = models.find(m => m.name === modelName);
        
        if (model) {
            // Use the actual service field from the database
            const service = model.service ? model.service.toLowerCase() : 'openrouter';
            
            // Map service names to provider identifiers
            if (service.includes('google')) {
                return 'gemini';
            } else if (service.includes('open router')) {
                return 'openrouter';
            } else if (service.includes('cloudflare')) {
                return 'cloudflare';
            } else {
                // Default to openrouter for unknown services
                return 'openrouter';
            }
        }
    } catch (error) {
        console.warn(`[imageService] Failed to determine provider for model ${modelName}, using default routing:`, error.message);
    }
    
    // Fallback heuristic for models not found in database or if database query fails
    if (modelName.startsWith('@cf/')) {
        return 'cloudflare';
    }
    if (modelName.includes(':free')) {
        return 'openrouter';
    }
    if (modelName.includes('google/') || modelName.includes('gemini')) {
        return 'gemini';
    }
    return 'openrouter';
}

export async function executeImageGeneration(prompt, model, aspectRatio = "1:1") {
    const provider = await getProviderService(model);
    console.log(`[imageService] Executing image generation with model: ${model} via provider: ${provider}`);

    if (provider === 'openrouter') {
        // This assumes generateImageWithOpenRouter exists and returns a data URL (e.g., base64)
        return await generateImageWithOpenRouter(model, prompt, { aspectRatio });
    } else if (provider === 'cloudflare') {
        // Call the Cloudflare image generation service
        return await generateImageWithCloudflare(model, prompt, { aspectRatio });
    } else if (provider === 'gemini') {
        // Placeholder for Gemini image generation
        // This should be implemented with actual Gemini image generation when available
        throw new Error(`Gemini image generation is not yet implemented for model: ${model}`);
    } else {
        // Placeholder for other providers
        throw new Error(`Image generation provider ${provider} is not yet implemented for model: ${model}`);
    }
}
