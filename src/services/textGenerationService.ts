import { 
  refinePostContentWithGemini, 
  generateBrandProfile, 
  generateBrandKit, 
  generateMediaPlanGroup, 
  generateMediaPromptForPost, 
  generateAffiliateComment, 
  generateViralIdeas, 
  generateContentPackage,
  generateFacebookTrends,
  generatePostsForFacebookTrend,
  generateIdeasFromProduct,
  generateInCharacterPost
} from './geminiService';
import { 
  refinePostContentWithOpenRouter, 
  generateBrandProfileWithOpenRouter, 
  generateBrandKitWithOpenRouter, 
  generateMediaPlanGroupWithOpenRouter, 
  generateMediaPromptForPostWithOpenRouter, 
  generateAffiliateCommentWithOpenRouter, 
  generateViralIdeasWithOpenRouter, 
  generateContentPackageWithOpenRouter,
  generateIdeasFromProductWithOpenRouter
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
  FacebookPostIdea 
} from '../../types';
import { ConfigService } from './configService';

// Unified interface for all text generation functions
export interface TextGenerationService {
  refinePostContent: (postText: string, model: string) => Promise<string>;
  generateBrandProfile: (idea: string, language: string, model: string) => Promise<BrandInfo>;
  generateBrandKit: (brandInfo: BrandInfo, language: string, model: string) => Promise<Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'>>;
  generateMediaPlanGroup: (
    brandFoundation: BrandFoundation,
    userPrompt: string,
    language: string,
    totalPosts: number,
    useSearch: boolean,
    selectedPlatforms: string[],
    options: { tone: string; style: string; length: string; includeEmojis: boolean; },
    affiliateContentKitSystemInstruction: string,
    model: string,
    persona: Persona | null,
    selectedProduct: AffiliateLink | null,
    pillar: string
  ) => Promise<MediaPlanGroup>;
  generateMediaPromptForPost: (
    postContent: { title: string; content: string; contentType: string },
    brandFoundation: BrandFoundation,
    language: string,
    model: string,
    persona: Persona | null,
    mediaPromptSuffix: string
  ) => Promise<string | string[]>;
  generateAffiliateComment: (
    post: MediaPlanPost,
    products: AffiliateLink[],
    brandFoundation: BrandFoundation,
    language: string,
    model: string
  ) => Promise<string>;
  generateViralIdeas: (
    trend: { topic: string; keywords: string[] },
    language: string,
    useSearch: boolean,
    model: string
  ) => Promise<Omit<Idea, 'id' | 'trendId'>[]>;
  generateContentPackage: (
    idea: Idea,
    brandFoundation: BrandFoundation,
    language: string,
    affiliateContentKit: string,
    model: string,
    persona: Persona | null,
    pillarPlatform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest',
    options: { tone: string; style: string; length: string; includeEmojis: boolean; },
    selectedProduct: AffiliateLink | null
  ) => Promise<MediaPlanGroup>;
  generateFacebookTrends: (
    industry: string,
    language: string,
    model: string
  ) => Promise<Omit<FacebookTrend, 'id'|'brandId'>[]>;
  generatePostsForFacebookTrend: (
    trend: FacebookTrend,
    language: string,
    model: string
  ) => Promise<Omit<FacebookPostIdea, 'id' | 'trendId'>[]>;
    generateIdeasFromProduct: (
    product: AffiliateLink,
    language: string,
    model: string
  ) => Promise<Omit<Idea, 'id' | 'trendId'>[]>;
    generateInCharacterPost: (
    objective: string,
    platform: string,
    personaId: string,
    model: string,
    keywords: string[],
    pillar: string
  ) => Promise<string>;
}

// Determine if a model is a Google model
const isGoogleModel = (model: string): boolean => {
  return model.startsWith('gemini-') && !model.includes('free');
};

// Create service instances
const googleService: TextGenerationService = {
  refinePostContent: refinePostContentWithGemini,
  generateBrandProfile,
  generateBrandKit,
  generateMediaPlanGroup,
  generateMediaPromptForPost,
  generateAffiliateComment,
  generateViralIdeas,
  generateContentPackage,
  generateFacebookTrends,
  generatePostsForFacebookTrend,
  generateIdeasFromProduct,
  generateInCharacterPost
};

const openRouterService: TextGenerationService = {
  refinePostContent: refinePostContentWithOpenRouter,
  generateBrandProfile: generateBrandProfileWithOpenRouter,
  generateBrandKit: generateBrandKitWithOpenRouter,
  generateMediaPlanGroup: (brandFoundation, userPrompt, language, totalPosts, useSearch, selectedPlatforms, options, affiliateContentKitSystemInstruction, model, persona, selectedProduct, pillar) => {
    // OpenRouter doesn't use the useSearch parameter, so we ignore it
    // Add type checking to ensure selectedPlatforms is an array
    if (!Array.isArray(selectedPlatforms)) {
      throw new Error(`selectedPlatforms must be an array, got ${typeof selectedPlatforms}: ${JSON.stringify(selectedPlatforms)}`);
    }
    return generateMediaPlanGroupWithOpenRouter(
      brandFoundation,
      userPrompt,
      language,
      totalPosts,
      selectedPlatforms,
      options,
      affiliateContentKitSystemInstruction,
      model,
      persona,
      selectedProduct,
      pillar
    );
  },
  generateMediaPromptForPost: generateMediaPromptForPostWithOpenRouter,
  generateAffiliateComment,
  generateViralIdeas: (trend, language, useSearch, model) => {
    // OpenRouter doesn't use the useSearch parameter, so we ignore it
    return generateViralIdeasWithOpenRouter(trend, language, model);
  },
  generateContentPackage: async () => {
    throw new Error('Content package generation is not supported with OpenRouter models');
  },
  generateFacebookTrends: async () => {
    throw new Error('Facebook trend generation is not supported with OpenRouter models');
  },
  generatePostsForFacebookTrend: async () => {
    throw new Error('Facebook post generation is not supported with OpenRouter models');
  },
  generateIdeasFromProduct: generateIdeasFromProductWithOpenRouter,
  generateInCharacterPost: async () => {
    throw new Error('In-character post generation is not supported with OpenRouter models');
  }
};

// Generic function to handle API calls with fallback
async function withFallback<T>(
  fn: (model: string) => Promise<T>,
  initialModel: string
): Promise<T> {
  const configService = ConfigService.getInstance();
  const fallbackModels = configService.getAiModelConfig().textModelFallbackOrder || [];
  const modelsToTry = [initialModel, ...fallbackModels];

  let lastError: any;

  for (const model of modelsToTry) {
    try {
      return await fn(model);
    } catch (error: any) {
      lastError = error;
      // Check for 503 Service Unavailable or similar errors
      const errorMessage = String(error).toLowerCase();
      if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('service unavailable')) {
        console.warn(`Model ${model} is overloaded or unavailable. Trying next model...`);
        continue; // Try the next model
      }
      // For other errors, fail immediately
      throw error;
    }
  }

  // If all models fail, throw the last recorded error
  throw lastError;
}


// Unified service that selects the appropriate implementation based on the model
export const textGenerationService: TextGenerationService = {
  refinePostContent: async (postText: string, model: string): Promise<string> => {
    return withFallback((currentModel) => {
      const service = isGoogleModel(currentModel) ? googleService : openRouterService;
      return service.refinePostContent(postText, currentModel);
    }, model);
  },
  
  generateBrandProfile: async (idea: string, language: string, model: string): Promise<BrandInfo> => {
    return withFallback((currentModel) => {
      const service = isGoogleModel(currentModel) ? googleService : openRouterService;
      return service.generateBrandProfile(idea, language, currentModel);
    }, model);
  },
  
  generateBrandKit: async (brandInfo: BrandInfo, language: string, model: string): Promise<Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'>> => {
    return withFallback((currentModel) => {
      const service = isGoogleModel(currentModel) ? googleService : openRouterService;
      return service.generateBrandKit(brandInfo, language, currentModel);
    }, model);
  },
  
  generateMediaPlanGroup: async (
    brandFoundation: BrandFoundation,
    userPrompt: string,
    language: string,
    totalPosts: number,
    useSearch: boolean,
    selectedPlatforms: string[],
    options: { tone: string; style: string; length: string; includeEmojis: boolean; },
    affiliateContentKitSystemInstruction: string,
    model: string,
    persona: Persona | null,
    selectedProduct: AffiliateLink | null,
    pillar: string
  ): Promise<MediaPlanGroup> => {
    return withFallback((currentModel) => {
      const service = isGoogleModel(currentModel) ? googleService : openRouterService;
      const actualUseSearch = isGoogleModel(currentModel) ? useSearch : false;
      
      if (!Array.isArray(selectedPlatforms)) {
        throw new Error(`selectedPlatforms must be an array, got ${typeof selectedPlatforms}: ${JSON.stringify(selectedPlatforms)}`);
      }
      
      return service.generateMediaPlanGroup(
        brandFoundation,
        userPrompt,
        language,
        totalPosts,
        actualUseSearch,
        selectedPlatforms,
        options,
        affiliateContentKitSystemInstruction,
        currentModel,
        persona,
        selectedProduct,
        pillar
      );
    }, model);
  },
  
  generateMediaPromptForPost: async (
    postContent: { title: string; content: string; contentType: string },
    brandFoundation: BrandFoundation,
    language: string,
    model: string,
    persona: Persona | null,
    mediaPromptSuffix: string
  ): Promise<string | string[]> => {
    return withFallback((currentModel) => {
      const service = isGoogleModel(currentModel) ? googleService : openRouterService;
      return service.generateMediaPromptForPost(postContent, brandFoundation, language, currentModel, persona, mediaPromptSuffix);
    }, model);
  },
  
  generateAffiliateComment: async (
    post: MediaPlanPost,
    products: AffiliateLink[],
    brandFoundation: BrandFoundation,
    language: string,
    model: string
  ): Promise<string> => {
    return withFallback((currentModel) => {
      const service = isGoogleModel(currentModel) ? googleService : openRouterService;
      return service.generateAffiliateComment(post, products, brandFoundation, language, currentModel);
    }, model);
  },
  
  generateViralIdeas: async (
    trend: { topic: string; keywords: string[] },
    language: string,
    useSearch: boolean,
    model: string
  ): Promise<Omit<Idea, 'id' | 'trendId'>[]> => {
    return withFallback((currentModel) => {
      const service = isGoogleModel(currentModel) ? googleService : openRouterService;
      const actualUseSearch = isGoogleModel(currentModel) ? useSearch : false;
      return service.generateViralIdeas(trend, language, actualUseSearch, currentModel);
    }, model);
  },
  
  generateContentPackage: async (
    idea: Idea,
    brandFoundation: BrandFoundation,
    language: string,
    affiliateContentKit: string,
    model: string,
    persona: Persona | null,
    pillarPlatform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest',
    options: { tone: string; style: string; length: string; includeEmojis: boolean; },
    selectedProduct: AffiliateLink | null
  ): Promise<MediaPlanGroup> => {
    return withFallback((currentModel) => {
      if (!isGoogleModel(currentModel)) {
        throw new Error('Content package generation is not supported with OpenRouter models');
      }
      return googleService.generateContentPackage(
          idea,
          brandFoundation,
          language,
          affiliateContentKit,
          currentModel,
          persona,
          pillarPlatform,
          options,
          selectedProduct
      );
    }, model);
  },
  
  generateFacebookTrends: async (
    industry: string,
    language: string,
    model: string
  ): Promise<Omit<FacebookTrend, 'id'|'brandId'>[]> => {
    return withFallback((currentModel) => {
      if (!isGoogleModel(currentModel)) {
        throw new Error('Facebook trend generation is not supported with OpenRouter models');
      }
      return googleService.generateFacebookTrends(industry, language, currentModel);
    }, model);
  },
  
  generatePostsForFacebookTrend: async (
    trend: FacebookTrend,
    language: string,
    model: string
  ): Promise<Omit<FacebookPostIdea, 'id' | 'trendId'>[]> => {
    return withFallback((currentModel) => {
      if (!isGoogleModel(currentModel)) {
        throw new Error('Facebook post generation is not supported with OpenRouter models');
      }
      return googleService.generatePostsForFacebookTrend(trend, language, currentModel);
    }, model);
  },
  
  generateIdeasFromProduct: async (
    product: AffiliateLink,
    language: string,
    model: string
  ): Promise<Omit<Idea, 'id' | 'trendId'>[]> => {
    return withFallback((currentModel) => {
      const service = isGoogleModel(currentModel) ? googleService : openRouterService;
      return service.generateIdeasFromProduct(product, language, currentModel);
    }, model);
  },

  generateInCharacterPost: async (objective: string, platform: string, personaId: string, model: string, keywords: string[], pillar: string): Promise<string> => {
    return withFallback((currentModel) => {
      if (!isGoogleModel(currentModel)) {
        throw new Error('In-character post generation is not supported with non-Google models');
      }
      // Note: We are not passing keywords to the service call yet.
      return googleService.generateInCharacterPost(objective, platform, personaId, currentModel, keywords, pillar);
    }, model);
  }
};