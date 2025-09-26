import { 
  generateRawContentWithGemini,
} from './geminiService';
import { 
  generateRawContentWithOpenRouter,
} from './openrouterService';
import type { 
  BrandInfo, 
  GeneratedAssets, 
  MediaPlanGroup, 
  MediaPlanPost, 
  AffiliateLink, 
  Persona, 
  Idea, 
  BrandFoundation, 
  FacebookTrend, 
  FacebookPostIdea,
  Trend, // Add this import
  Settings,
  PostInfo,
  GenerationOptions
} from '../../types';
import { 
    PromptBuilder,
    buildMediaPlanPrompt, 
    buildBrandKitPrompt,
    buildRefinePostPrompt, 
    buildGenerateBrandProfilePrompt
} from './prompt.builder';
import { 
    processMediaPlanResponse, 
    processBrandKitResponse, 
    processBrandProfileResponse
} from './response.processor';
import { AiModelConfig } from './configService';

// --- Provider Service Abstraction ---

interface ProviderService {
    generateRawContent: (prompt: string, model: string, settings: Settings, useSearch: boolean) => Promise<string>;
}

const googleProvider: ProviderService = {
    generateRawContent: generateRawContentWithGemini,
};

const openRouterProvider: ProviderService = {
    generateRawContent: generateRawContentWithOpenRouter,
};

const getProviderService = (modelName: string, aiModelConfig: AiModelConfig): ProviderService => {
    console.log(`[getProviderService] Getting provider for model: "${modelName}"`);
    console.log(`[getProviderService] All models in config:`, aiModelConfig.allModels);

    // --- BEGIN DEBUG LOGGING ---
    console.log(`[getProviderService] Iterating allModels to find a match for "${modelName}"`);
    aiModelConfig.allModels.forEach(m => {
        console.log(`[getProviderService] Checking model: "${m.name}" | Match? ${m.name === modelName}`);
    });
    // --- END DEBUG LOGGING ---

    const modelData = aiModelConfig.allModels.find(m => m.name === modelName);
    console.log(`[getProviderService] Found model data:`, modelData);

    let serviceId = 'google'; // Default to google

    if (modelData && modelData.service) {
        serviceId = modelData.service.toLowerCase();
    } else if (modelData && modelData.provider) {
        // Fallback to checking provider if service field is missing
        const provider = modelData.provider.toLowerCase();
        if (provider.includes('open router')) {
            serviceId = 'openrouter';
        } else if (provider.includes('cloudflare')) {
            serviceId = 'cloudflare';
        }
    } else {
        // Even if modelData is not found, let's try to infer from the name
        if (modelName.includes('google/') || modelName.includes('gemini')) {
            serviceId = 'google';
        } else if (modelName.includes('/')) { // A simple heuristic for non-google models
            serviceId = 'openrouter';
        }
    }
    
    console.log(`[getProviderService] Determined serviceId: "${serviceId}"`);

    switch (serviceId) {
        case 'google':
            return googleProvider;
        case 'openrouter':
            return openRouterProvider;
        default:
            console.warn(`Unknown service ID "${serviceId}" for model "${modelName}". Defaulting to Google service.`);
            return googleProvider;
    }
};

// --- Centralized Fallback Logic ---

async function executeWithFallback<T>(
    aiModelConfig: AiModelConfig,
    settings: Settings,
    preferredModel: string,
    generationFn: (provider: ProviderService, model: string) => Promise<T>
): Promise<T> {
    const modelsToTry = [
        preferredModel,
        ...(settings.textModelFallbackOrder || []).filter(m => m !== preferredModel)
    ];

    let lastError: any;

    for (const model of modelsToTry) {
        try {
            const provider = getProviderService(model, aiModelConfig);
            console.log('[executeWithFallback] USING PROVIDER:', provider === googleProvider ? 'googleProvider' : 'openRouterProvider');
            return await generationFn(provider, model);
        } catch (error: any) {
            lastError = error;
            const errorMessage = String(error).toLowerCase();
            const isRetryable = errorMessage.includes('503') || 
                                errorMessage.includes('overloaded') || 
                                errorMessage.includes('service unavailable') || 
                                errorMessage.includes('rate limit') ||
                                errorMessage.includes('failed to generate') || // From our BFF
                                errorMessage.includes('unexpected end of json input') || // The specific error we saw
                                errorMessage.includes('api error'); // A general catch-all
            if (isRetryable) {
                console.warn(`Model ${model} failed with a retryable error. Trying next model...`);
                continue;
            }
            console.error(`Model ${model} failed with a non-retryable error:`, error);
            throw error;
        }
    }
    throw lastError;
}

// --- Orchestrator Functions ---

const generateMediaPlanGroup = (
    params: { brandFoundation: BrandFoundation, userPrompt: string, language: string, totalPosts: number, useSearch: boolean, selectedPlatforms: string[], options: GenerationOptions, brandSettings: Settings, adminSettings: Settings, persona: Persona | null, selectedProduct: AffiliateLink | null, pillar: string },
    aiModelConfig: AiModelConfig
): Promise<MediaPlanGroup> => {
    return executeWithFallback(aiModelConfig, params.brandSettings, params.brandSettings.textGenerationModel, async (provider, model) => {
        const prompt = buildMediaPlanPrompt(params);
        const jsonText = await provider.generateRawContent(prompt, model, params.brandSettings, params.useSearch);
        return processMediaPlanResponse(jsonText, {
            userPrompt: params.userPrompt,
            pillar: params.pillar,
            settings: params.brandSettings,
            persona: params.persona,
            selectedProduct: params.selectedProduct
        });
    });
};

const generateBrandKit = (
    params: { brandInfo: BrandInfo, language: string, brandSettings: Settings, adminSettings: Settings },
    aiModelConfig: AiModelConfig
): Promise<Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'>> => {
    return executeWithFallback(aiModelConfig, params.brandSettings, params.brandSettings.textGenerationModel, async (provider, model) => {
        const prompt = buildBrandKitPrompt({ ...params });
        const jsonText = await provider.generateRawContent(prompt, model, params.brandSettings, false);
        return processBrandKitResponse(jsonText, params.language);
    });
};

const refinePostContent = (
    params: { postText: string, settings: Settings },
    aiModelConfig: AiModelConfig
): Promise<string> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (provider, model) => {
        const prompt = buildRefinePostPrompt(params);
        return await provider.generateRawContent(prompt, model, params.settings, false);
    });
};

const generateBrandProfile = (
    params: { idea: string, language: string, brandSettings: Settings, adminSettings: Settings },
    aiModelConfig: AiModelConfig
): Promise<BrandInfo> => {
    return executeWithFallback(aiModelConfig, params.brandSettings, params.brandSettings.textGenerationModel, async (provider, model) => {
        const prompt = buildGenerateBrandProfilePrompt({ ...params, settings: params.brandSettings });
        const jsonText = await provider.generateRawContent(prompt, model, params.brandSettings, true);
        return processBrandProfileResponse(jsonText);
    });
};




// This object is what the UI layer (App.tsx) interacts with.
export const textGenerationService = {
    generateMediaPlanGroup,
    generateBrandKit,
    refinePostContent,
    generateBrandProfile,
};