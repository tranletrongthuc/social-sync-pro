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
  generateIdeasFromProduct
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
} from '../types';

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
    selectedProduct: AffiliateLink | null
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
    options: { tone: string; style: string; length: string; purpose?: string; },
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
  generateIdeasFromProduct
};

const openRouterService: TextGenerationService = {
  refinePostContent: refinePostContentWithOpenRouter,
  generateBrandProfile: generateBrandProfileWithOpenRouter,
  generateBrandKit: generateBrandKitWithOpenRouter,
  generateMediaPlanGroup: (brandFoundation, userPrompt, language, totalPosts, useSearch, selectedPlatforms, options, affiliateContentKitSystemInstruction, model, persona, selectedProduct) => {
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
      selectedProduct
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
  generateIdeasFromProduct: generateIdeasFromProductWithOpenRouter
};

// Unified service that selects the appropriate implementation based on the model
export const textGenerationService: TextGenerationService = {
  refinePostContent: async (postText: string, model: string): Promise<string> => {
    const service = isGoogleModel(model) ? googleService : openRouterService;
    return service.refinePostContent(postText, model);
  },
  
  generateBrandProfile: async (idea: string, language: string, model: string): Promise<BrandInfo> => {
    const service = isGoogleModel(model) ? googleService : openRouterService;
    return service.generateBrandProfile(idea, language, model);
  },
  
  generateBrandKit: async (brandInfo: BrandInfo, language: string, model: string): Promise<Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'>> => {
    const service = isGoogleModel(model) ? googleService : openRouterService;
    return service.generateBrandKit(brandInfo, language, model);
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
    selectedProduct: AffiliateLink | null
  ): Promise<MediaPlanGroup> => {
    // Google models can use search functionality, OpenRouter models cannot
    const service = isGoogleModel(model) ? googleService : openRouterService;
    const actualUseSearch = isGoogleModel(model) ? useSearch : false;
    
    // Add type checking to ensure selectedPlatforms is an array
    if (!Array.isArray(selectedPlatforms)) {
      throw new Error(`selectedPlatforms must be an array, got ${typeof selectedPlatforms}: ${JSON.stringify(selectedPlatforms)}`);
    }
    
    if (isGoogleModel(model)) {
      return service.generateMediaPlanGroup(
        brandFoundation,
        userPrompt,
        language,
        totalPosts,
        actualUseSearch,
        selectedPlatforms,
        options,
        affiliateContentKitSystemInstruction,
        model,
        persona,
        selectedProduct
      );
    } else {
      // For OpenRouter, we need to include the useSearch parameter (even though it's not used)
      return (service as any).generateMediaPlanGroup(
        brandFoundation,
        userPrompt,
        language,
        totalPosts,
        false, // useSearch - OpenRouter doesn't use this parameter
        selectedPlatforms,
        options,
        affiliateContentKitSystemInstruction,
        model,
        persona,
        selectedProduct
      );
    }
  },
  
  generateMediaPromptForPost: async (
    postContent: { title: string; content: string; contentType: string },
    brandFoundation: BrandFoundation,
    language: string,
    model: string,
    persona: Persona | null,
    mediaPromptSuffix: string
  ): Promise<string | string[]> => {
    const service = isGoogleModel(model) ? googleService : openRouterService;
    return service.generateMediaPromptForPost(postContent, brandFoundation, language, model, persona, mediaPromptSuffix);
  },
  
  generateAffiliateComment: async (
    post: MediaPlanPost,
    products: AffiliateLink[],
    brandFoundation: BrandFoundation,
    language: string,
    model: string
  ): Promise<string> => {
    const service = isGoogleModel(model) ? googleService : openRouterService;
    return service.generateAffiliateComment(post, products, brandFoundation, language, model);
  },
  
  generateViralIdeas: async (
    trend: { topic: string; keywords: string[] },
    language: string,
    useSearch: boolean,
    model: string
  ): Promise<Omit<Idea, 'id' | 'trendId'>[]> => {
    // Google models can use search functionality, OpenRouter models cannot
    const service = isGoogleModel(model) ? googleService : openRouterService;
    const actualUseSearch = isGoogleModel(model) ? useSearch : false;
    
    if (isGoogleModel(model)) {
      return service.generateViralIdeas(trend, language, actualUseSearch, model);
    } else {
      // For OpenRouter, we need to pass all arguments, but useSearch is ignored.
      return service.generateViralIdeas(trend, language, false, model);
    }
  },
  
  generateContentPackage: async (
    idea: Idea,
    brandFoundation: BrandFoundation,
    language: string,
    affiliateContentKit: string,
    model: string,
    persona: Persona | null,
    options: { tone: string; style: string; length: string; includeEmojis: boolean; },
    selectedProduct: AffiliateLink | null
  ): Promise<MediaPlanGroup> => {
    // Use BFF for content generation to keep API keys secure
    return googleService.generateContentPackage(
        idea,
        brandFoundation,
        language,
        affiliateContentKit,
        model,
        persona,
        options,
        selectedProduct
    );
  },
  
  generateFacebookTrends: async (
    industry: string,
    language: string,
    model: string
  ): Promise<Omit<FacebookTrend, 'id'|'brandId'>[]> => {
    // Only Google models support Facebook trend generation
    if (!isGoogleModel(model)) {
      throw new Error('Facebook trend generation is not supported with OpenRouter models');
    }
    return googleService.generateFacebookTrends(industry, language, model);
  },
  
  generatePostsForFacebookTrend: async (
    trend: FacebookTrend,
    language: string,
    model: string
  ): Promise<Omit<FacebookPostIdea, 'id' | 'trendId'>[]> => {
    // Only Google models support Facebook post generation
    if (!isGoogleModel(model)) {
      throw new Error('Facebook post generation is not supported with OpenRouter models');
    }
    return googleService.generatePostsForFacebookTrend(trend, language, model);
  },
  
  generateIdeasFromProduct: async (
    product: AffiliateLink,
    language: string,
    model: string
  ): Promise<Omit<Idea, 'id' | 'trendId'>[]> => {
    const service = isGoogleModel(model) ? googleService : openRouterService;
    return service.generateIdeasFromProduct(product, language, model);
  }
};