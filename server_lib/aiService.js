import { generateWithGemini } from './geminiClient.js';
import { generateWithOpenRouter } from './openrouterClient.js';
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
        console.error('[aiService] Failed to load models from database:', error);
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
        console.warn(`[aiService] Failed to determine provider for model ${modelName}, using default routing:`, error.message);
    }
    
    // Fallback heuristic for models not found in database or if database query fails
    if (modelName.includes(':free')) {
        return 'openrouter';
    }
    if (modelName.includes('google/') || modelName.includes('gemini')) {
        return 'gemini';
    }
    return 'openrouter';
}

export async function executeGeneration(prompt, modelsToTry, isJson = false, includeModelUsed = false) {
    let lastError;

    for (const model of modelsToTry) {
        try {
            const provider = await getProviderService(model);
            console.log(`[aiService] Executing generation with model: ${model} via provider: ${provider}`);

            let result;
            if (provider === 'gemini') {
                result = await generateWithGemini(model, prompt, {});
            } else if (provider === 'openrouter') {
                result = await generateWithOpenRouter(model, prompt, { isJson });
            }

            // If includeModelUsed is true, return both the result and the model used
            if (includeModelUsed) {
                return {
                    responseText: result,
                    modelUsed: model
                };
            } else {
                return result;
            }

        } catch (error) {
            lastError = error;
            console.warn(`[aiService] Model ${model} failed with error: ${error.message}. Trying next model...`);
            continue; // Try next model
        }
    }

    console.error('[aiService] All models failed to generate content.');
    throw lastError || new Error('All configured AI models failed.');
}
