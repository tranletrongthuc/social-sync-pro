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
  Settings,
  PostInfo,
  GenerationOptions
} from '../../types';
import { 
    buildMediaPlanPrompt, 
    buildBrandKitPrompt, 
    buildRefinePostPrompt, 
    buildGenerateBrandProfilePrompt, 
    buildGenerateInCharacterPostPrompt, 
    buildGenerateMediaPromptForPostPrompt, 
    buildAffiliateCommentPrompt, 
    buildGenerateViralIdeasPrompt, 
    buildGenerateContentPackagePrompt,
    buildGenerateFacebookTrendsPrompt,
    buildGeneratePostsForFacebookTrendPrompt,
    buildGenerateIdeasFromProductPrompt,
    buildAutoGeneratePersonaPrompt
} from './prompt.builder';
import { 
    processMediaPlanResponse, 
    processBrandKitResponse, 
    processBrandProfileResponse, 
    processGenerateMediaPromptForPostResponse,
    processViralIdeasResponse,
    processContentPackageResponse,
    processFacebookTrendsResponse,
    processPostsForFacebookTrendResponse,
    processIdeasFromProductResponse,
    processAutoGeneratePersonaResponse
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
    const modelData = aiModelConfig.allModels.find(m => m.name === modelName);
    const serviceId = modelData?.service || 'google';

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
    generationFn: (model: string) => Promise<T>
): Promise<T> {
    const modelsToTry = [
        preferredModel,
        ...(settings.textModelFallbackOrder || []).filter(m => m !== preferredModel)
    ];

    let lastError: any;

    for (const model of modelsToTry) {
        try {
            return await generationFn(model);
        } catch (error: any) {
            lastError = error;
            const errorMessage = String(error).toLowerCase();
            const isRetryable = errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('service unavailable') || errorMessage.includes('rate limit');
            if (isRetryable) {
                console.warn(`Model ${model} failed with a retryable error. Trying next model...`);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// --- Orchestrator Functions ---

const generateMediaPlanGroup = (
    params: { brandFoundation: BrandFoundation, userPrompt: string, language: string, totalPosts: number, useSearch: boolean, selectedPlatforms: string[], options: GenerationOptions, settings: Settings, persona: Persona | null, selectedProduct: AffiliateLink | null, pillar: string },
    aiModelConfig: AiModelConfig
): Promise<MediaPlanGroup> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildMediaPlanPrompt({ ...params });
        const provider = getProviderService(model, aiModelConfig);
        const jsonText = await provider.generateRawContent(prompt, model, params.settings, params.useSearch);
        return processMediaPlanResponse(jsonText, params);
    });
};

const generateBrandKit = (
    params: { brandInfo: BrandInfo, language: string, settings: Settings },
    aiModelConfig: AiModelConfig
): Promise<Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'>> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildBrandKitPrompt({ ...params });
        const provider = getProviderService(model, aiModelConfig);
        const jsonText = await provider.generateRawContent(prompt, model, params.settings, false);
        return processBrandKitResponse(jsonText, params.language);
    });
};

const refinePostContent = (
    params: { postText: string, settings: Settings },
    aiModelConfig: AiModelConfig
): Promise<string> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildRefinePostPrompt(params);
        const provider = getProviderService(model, aiModelConfig);
        return await provider.generateRawContent(prompt, model, params.settings, false);
    });
};

const generateBrandProfile = (
    params: { idea: string, language: string, settings: Settings },
    aiModelConfig: AiModelConfig
): Promise<BrandInfo> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildGenerateBrandProfilePrompt({ ...params});
        const provider = getProviderService(model, aiModelConfig);
        const jsonText = await provider.generateRawContent(prompt, model, params.settings, true);
        return processBrandProfileResponse(jsonText);
    });
};

const generateInCharacterPost = (
    params: { objective: string, platform: string, persona: Persona, keywords: string[], pillar: string, settings: Settings, options: GenerationOptions },
    aiModelConfig: AiModelConfig
): Promise<string> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildGenerateInCharacterPostPrompt({ ...params });
        const provider = getProviderService(model, aiModelConfig);
        return await provider.generateRawContent(prompt, model, params.settings, false);
    });
};

const generateMediaPromptForPost = (
    params: { postContent: { title: string; content: string, contentType: string }, brandFoundation: BrandFoundation, language: string, persona: Persona | null, settings: Settings },
    aiModelConfig: AiModelConfig
): Promise<string | string[]> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildGenerateMediaPromptForPostPrompt({ ...params });
        const provider = getProviderService(model, aiModelConfig);
        const isJson = params.postContent.contentType === 'Carousel Post';
        const responseText = await provider.generateRawContent(prompt, model, params.settings, isJson);
        return processGenerateMediaPromptForPostResponse(responseText, params.postContent.contentType, params.settings);
    });
};

const generateAffiliateComment = (
    params: { post: PostInfo, products: AffiliateLink[], language: string, settings: Settings },
    aiModelConfig: AiModelConfig
): Promise<string> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildAffiliateCommentPrompt({ ...params, post: params.post.post });
        const provider = getProviderService(model, aiModelConfig);
        return await provider.generateRawContent(prompt, model, params.settings, false);
    });
};

const generateViralIdeas = (
    params: { trend: { topic: string; keywords: string[] }, language: string, useSearch: boolean, settings: Settings },
    aiModelConfig: AiModelConfig
): Promise<Omit<Idea, 'id' | 'trendId'>[]> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildGenerateViralIdeasPrompt({ ...params });
        const provider = getProviderService(model, aiModelConfig);
        const jsonText = await provider.generateRawContent(prompt, model, params.settings, params.useSearch);
        return processViralIdeasResponse(jsonText, params.useSearch);
    });
};

const generateContentPackage = (
    params: { idea: Idea, brandFoundation: BrandFoundation, language: string, settings: Settings, persona: Persona | null, pillarPlatform: 'YouTube', options: GenerationOptions, selectedProduct: AffiliateLink | null, repurposedPlatforms: string[] },
    aiModelConfig: AiModelConfig
): Promise<MediaPlanGroup> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildGenerateContentPackagePrompt({ ...params });
        const provider = getProviderService(model, aiModelConfig);
        const jsonText = await provider.generateRawContent(prompt, model, params.settings, true);
        return processContentPackageResponse(jsonText, params);
    });
};

const generateFacebookTrends = (
    params: { industry: string, language: string, settings: Settings },
    aiModelConfig: AiModelConfig
): Promise<Omit<FacebookTrend, 'id'|'brandId'>[]> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildGenerateFacebookTrendsPrompt({ ...params });
        const provider = getProviderService(model, aiModelConfig);
        const jsonText = await provider.generateRawContent(prompt, model, params.settings, true);
        return processFacebookTrendsResponse(jsonText);
    });
};

const generatePostsForFacebookTrend = (
    params: { trend: FacebookTrend, language: string, settings: Settings },
    aiModelConfig: AiModelConfig
): Promise<Omit<FacebookPostIdea, 'id' | 'trendId'>[]> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildGeneratePostsForFacebookTrendPrompt({ ...params });
        const provider = getProviderService(model, aiModelConfig);
        const jsonText = await provider.generateRawContent(prompt, model, params.settings, true);
        return processPostsForFacebookTrendResponse(jsonText);
    });
};

const generateIdeasFromProduct = (
    params: { product: AffiliateLink, language: string, settings: Settings },
    aiModelConfig: AiModelConfig
): Promise<Omit<Idea, 'id' | 'trendId'>[]> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildGenerateIdeasFromProductPrompt({ ...params });
        const provider = getProviderService(model, aiModelConfig);
        const jsonText = await provider.generateRawContent(prompt, model, params.settings, true);
        return processIdeasFromProductResponse(jsonText, params.product);
    });
};

const autoGeneratePersonaProfile = (
    params: { mission: string, usp: string, settings: Settings },
    aiModelConfig: AiModelConfig
): Promise<Partial<Persona>[]> => {
    return executeWithFallback(aiModelConfig, params.settings, params.settings.textGenerationModel, async (model) => {
        const prompt = buildAutoGeneratePersonaPrompt({ ...params });
        const provider = getProviderService(model, aiModelConfig);
        const jsonText = await provider.generateRawContent(prompt, model, params.settings, true);
        return processAutoGeneratePersonaResponse(jsonText);
    });
};


// This object is what the UI layer (App.tsx) interacts with.
export const textGenerationService = {
    generateMediaPlanGroup,
    generateBrandKit,
    refinePostContent,
    generateBrandProfile,
    generateInCharacterPost,
    generateMediaPromptForPost,
    generateAffiliateComment,
    generateViralIdeas,
    generateContentPackage,
    generateFacebookTrends,
    generatePostsForFacebookTrend,
    generateIdeasFromProduct,
    autoGeneratePersonaProfile,
};