import type { Settings, AIModel } from '../../types';
import { AiModelConfig } from './configService';
import { generateImageWithCloudflare } from './cloudflareService';
import { generateImageWithBanana } from './geminiService';
import { generateImageWithOpenRouter } from './openrouterService';

/**
 * Defines the standard interface for any image generation service.
 * This allows the application to switch between different AI image providers
 * (e.g., Gemini, Cloudflare, OpenRouter) seamlessly.
 */
export interface ImageGenerationProvider {
  generateImage(
    prompt: string,
    model: string,
    settings: Settings,
    aspectRatio: "1:1" | "16:9",
    productImages?: File[]
  ): Promise<string>;
}

// --- Provider Implementations ---

const cloudflareProvider: ImageGenerationProvider = {
    generateImage: (prompt, model, settings, aspectRatio, productImages) => 
        generateImageWithCloudflare(prompt, model, productImages || [], settings),
};

const geminiProvider: ImageGenerationProvider = {
    generateImage: (prompt, model, settings, aspectRatio, productImages) =>
        generateImageWithBanana(model, prompt, settings.mediaPromptSuffix),
};

const openRouterProvider: ImageGenerationProvider = {
    generateImage: (prompt, model, settings, aspectRatio, productImages) =>
        generateImageWithOpenRouter(prompt, model, settings, aspectRatio, productImages || []),
};

// --- Provider Selection Logic ---

const getProviderService = (modelName: string, aiModelConfig: AiModelConfig): ImageGenerationProvider => {
    const modelData = aiModelConfig.allModels.find(m => m.name === modelName);
    // Default to openrouter for images if service is not specified
    const serviceId = modelData?.service || 'openrouter'; 

    switch (serviceId) {
        case 'cloudflare':
            return cloudflareProvider;
        case 'google':
            return geminiProvider;
        case 'openrouter':
            return openRouterProvider;
        default:
            console.warn(`Unknown image service ID for model "${modelName}". Defaulting to OpenRouter.`);
            return openRouterProvider;
    }
};


// --- Main Orchestrator Service ---

export const imageGenerationService = {
    /**
     * The main orchestrator function for generating images.
     * It determines the correct provider and calls it.
     */
    generateImage: async (
        prompt: string,
        aspectRatio: "1:1" | "16:9",
        settings: Settings,
        aiModelConfig: AiModelConfig,
        productImages?: File[]
    ): Promise<string> => {
        const model = settings.imageGenerationModel;
        const provider = getProviderService(model, aiModelConfig);

        return provider.generateImage(prompt, model, settings, aspectRatio, productImages);
    }
};