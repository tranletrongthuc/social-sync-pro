import type { 
  MediaPlan, 
  MediaPlanGroup, 
  MediaPlanPost, 
  Settings, 
  AffiliateLink, 
  Persona, 
  GeneratedAssets,
  BrandInfo,
  Idea,
  FacebookTrend,
  FacebookPostIdea,
  BrandFoundation,
  Trend // Add this import
} from '../../types';
import { sanitizeAndParseJson } from './utils';
import { initialGeneratedAssets } from '../reducers/assetsReducer';

/**
 * This service is responsible for processing and normalizing raw JSON
 * responses from AI services into structured, application-ready data types.
 */

// #region Response Validation Utilities
/**
 * Validates and corrects carousel media prompts to ensure they are arrays of strings
 * @param mediaPrompt The media prompt to validate and correct
 * @param contentType The content type of the post
 * @returns A properly formatted array of strings for carousel prompts
 */
export const validateAndCorrectCarouselPrompt = (mediaPrompt: string | string[], contentType: string): string | string[] => {
    // Only process if this is a carousel
    if (contentType !== 'Carousel') {
        return mediaPrompt;
    }

    // If it's already an array of strings, return as is
    if (Array.isArray(mediaPrompt) && mediaPrompt.every(item => typeof item === 'string')) {
        return mediaPrompt;
    }

    // If it's a string, try to parse it into an array
    if (typeof mediaPrompt === 'string') {
        // Try to extract individual prompts using regex
        const prompts: string[] = [];
        const regex = /Image \d+[:\-]?\s*(.*?)(?=(Image \d+[:\-]?\s*|$))/gsi;
        let match;
        while ((match = regex.exec(mediaPrompt)) !== null) {
            const promptText = match[1].trim();
            if (promptText) {
                prompts.push(promptText);
            }
        }

        // If we found prompts, return them
        if (prompts.length > 0) {
            return prompts;
        }

        // If we couldn't parse it, check if it contains multiple prompts separated by common delimiters
        const delimiters = [
            /\n\s*\n/g, // Double newlines
            /;\s*/g,   // Semicolons
            /\.\s+/g,  // Periods followed by space (if there are at least 3 sentences)
        ];

        for (const delimiter of delimiters) {
            const parts = mediaPrompt.split(delimiter).map(part => part.trim()).filter(part => part.length > 0);
            if (parts.length >= 2 && parts.length <= 10) { // Reasonable number of carousel images
                return parts;
            }
        }

        // If all else fails, return it as a single item array
        return [mediaPrompt];
    }

    // For any other case, return as a single item array
    return [String(mediaPrompt)];
};

/**
 * Validates and normalizes the contentType field
 * @param contentType The contentType to validate
 * @returns A normalized contentType value
 */
export const normalizeContentType = (contentType: string): MediaPlanPost['contentType'] => {
    // Strictly enforce the contentType values that our frontend expects
    switch (contentType) {
        case 'Carousel':
        case 'Image':
        case 'Video':
        case 'Reel':
        case 'Shorts':
        case 'Story':
            return contentType;
        default:
            // For any unrecognized contentType, default to 'Image' for single image posts
            // or 'Carousel' if we detect it should be a carousel based on other factors
            return 'Image';
    }
};

/**
 * Validates and corrects a media plan post
 * @param post The post to validate and correct
 * @returns A corrected post
 */
export const validateAndCorrectMediaPlanPost = (post: any): MediaPlanPost => {
    const { status, ...restOfPost } = post;
    
    // Normalize contentType
    const normalizedContentType = normalizeContentType(post.contentType);
    
    // Validate and correct carousel prompts
    let processedMediaPrompt: string | string[] = '';
    if (post.mediaPrompt) {
        processedMediaPrompt = validateAndCorrectCarouselPrompt(post.mediaPrompt, normalizedContentType);
    }
    
    return {
        ...restOfPost,
        contentType: normalizedContentType,
        status: 'draft',
        mediaPrompt: processedMediaPrompt,
    } as MediaPlanPost;
};
// #endregion

// #region Response Normalizers
export const normalizeMediaPlanGroupResponse = (data: any): { name: string; plan: MediaPlan } => {
    if (!data) throw new Error("Invalid or empty data provided to normalizeMediaPlanGroupResponse.");

    let effectiveData = data;
    let name = '';
    let plan: MediaPlan = [];

    if (data.result && typeof data.result === 'object') {
        effectiveData = data.result;
    }

    if (effectiveData.name && typeof effectiveData.name === 'string') {
        name = effectiveData.name;
    }

    if (Array.isArray(effectiveData)) {
        plan = effectiveData;
    } else if (typeof effectiveData === 'object') {
        const possiblePlanKeys = ['plan', 'weeks', 'mediaPlan'];
        for (const key of possiblePlanKeys) {
            if (effectiveData[key] && Array.isArray(effectiveData[key])) {
                plan = effectiveData[key];
                break;
            }
        }

        if (effectiveData.plan && typeof effectiveData.plan === 'object' && !Array.isArray(effectiveData.plan)) {
            if (effectiveData.plan.name) name = effectiveData.plan.name;
            const possibleNestedKeys = ['weeks', 'mediaPlan'];
            for (const key of possibleNestedKeys) {
                if (effectiveData.plan[key] && Array.isArray(effectiveData.plan[key])) {
                    plan = effectiveData.plan[key];
                    break;
                }
            }
        }
    }

    if (!Array.isArray(plan)) {
        console.warn("Could not find a valid 'plan' or 'weeks' array in the AI response.", data);
    }
    
    return { name: name || 'Untitled Plan', plan };
};
// #endregion

// #region Response Processors
export const processMediaPlanResponse = (jsonText: string, params: { userPrompt: string, pillar: string, settings: Settings, persona: Persona | null, selectedProduct: AffiliateLink | null }): MediaPlanGroup => {
  const { userPrompt, pillar, settings, persona, selectedProduct } = params;

  const parsedResult = sanitizeAndParseJson(jsonText);
  const { name: planName, plan: planWeeks } = normalizeMediaPlanGroupResponse(parsedResult);

  const planWithEnhancements = (planWeeks || []).map(week => ({
      ...week,
      posts: (week.posts || []).map((post: any) => {
          // Validate and correct the post
          const correctedPost = validateAndCorrectMediaPlanPost(post);
          
          return {
              ...correctedPost,
              pillar: pillar,
              promotedProductIds: selectedProduct ? [selectedProduct.id] : [],
          } as MediaPlanPost;
      }),
  }));

  const generateFallbackTitle = (userPrompt: string, selectedProduct: AffiliateLink | null, persona: Persona | null): string => {
      if (selectedProduct) {
          let title = `Promotion: ${selectedProduct.productName}`;
          if (persona) {
              title += ` ft. ${persona.nickName}`;
          }
          return title;
      }
      if (persona) {
          return `Plan for ${persona.nickName}: ${userPrompt.substring(0, 30)}...`;
      }
      return userPrompt.substring(0, 50);
  }

  return {
      name: (planName && planName !== 'Untitled Plan') ? planName : generateFallbackTitle(userPrompt, selectedProduct, persona),
      prompt: userPrompt,
      plan: planWithEnhancements,
      source: 'wizard',
      personaId: persona?.id,
  } as MediaPlanGroup;
};

export const processBrandKitResponse = (jsonText: string, language: string): Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'> => {
    const parsedJson = sanitizeAndParseJson(jsonText);

    // Normalize keys by checking for both camelCase and snake_case
    const brandFoundationData = parsedJson.brandFoundation || parsedJson.brand_foundation;
    const coreMediaAssetsData = parsedJson.coreMediaAssets || parsedJson.core_media_assets;
    const unifiedProfileAssetsData = parsedJson.unifiedProfileAssets || parsedJson.unified_profile_assets;
    const planData = parsedJson.mediaPlan || parsedJson.initial1MonthMediaPlan || parsedJson.initialMediaPlan || parsedJson.initial_1_month_media_plan;

    if (!brandFoundationData || !coreMediaAssetsData || !unifiedProfileAssetsData) {
        console.error("AI response is missing one or more root keys. Parsed JSON:", parsedJson);
        throw new Error("The AI returned a JSON object with a missing or incorrect structure. Please try again.");
    }
    
    // Fix brandFoundation mapping
    const brandFoundation: BrandFoundation = {
        brandName: brandFoundationData.brandName || brandFoundationData.name || '',
        mission: brandFoundationData.mission || '',
        usp: brandFoundationData.usp || brandFoundationData.uniqueSellingProposition || '',
        targetAudience: brandFoundationData.targetAudience || brandFoundationData.audience || '',
        values: Array.isArray(brandFoundationData.values) 
            ? brandFoundationData.values 
            : typeof brandFoundationData.values === 'string'
                ? brandFoundationData.values.split(',').map((v: string) => v.trim()).filter((v: string) => v)
                : [],
        personality: brandFoundationData.personality || '',
        keyMessaging: Array.isArray(brandFoundationData.keyMessaging) 
            ? brandFoundationData.keyMessaging 
            : typeof brandFoundationData.keyMessaging === 'string'
                ? [brandFoundationData.keyMessaging]
                : []
    };
    
    if (coreMediaAssetsData?.logoConcepts) {
        coreMediaAssetsData.logoConcepts = coreMediaAssetsData.logoConcepts.map((logo: any) => {
            const imageKey = `logo_${Math.random().toString(36).substring(2, 9)}`;
            return {
                ...logo,
                prompt: logo.prompt || logo.description || '',
                imageKey: imageKey
            };
        });
    }
    if (unifiedProfileAssetsData) {
        unifiedProfileAssetsData.profilePictureImageKey = `profile_${Math.random().toString(36).substring(2, 9)}`;
        unifiedProfileAssetsData.coverPhotoImageKey = `cover_${Math.random().toString(36).substring(2, 9)}`;
    }

    let mediaPlanGroup: MediaPlanGroup | null = null;
    if (planData && Array.isArray(planData)) {
        const planWithIds: MediaPlan = (planData as any[]).map(week => ({
            ...week,
            posts: (week.posts || []).map((post: any) => {
                const { status, ...restOfPost } = post;
                return {
                    ...restOfPost,
                    imageKey: post.mediaPrompt ? `media_plan_post_${Math.random().toString(36).substring(2, 9)}` : undefined,
                    status: 'draft',
                } as MediaPlanPost;
            }),
        }));
        
        mediaPlanGroup = {
            name: language === 'Việt Nam' ? 'Kế hoạch Ra mắt Thương hiệu' : 'Brand Launch Plan',
            prompt: language === 'Việt Nam' ? 'Kế hoạch ban đầu được tạo cho việc ra mắt thương hiệu.' : 'Initial plan generated for brand launch.',
            plan: planWithIds,
            source: 'brand-launch',
        } as MediaPlanGroup;
    }
    
    const assets: Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'> = {
        brandFoundation,
        coreMediaAssets: coreMediaAssetsData,
        unifiedProfileAssets: unifiedProfileAssetsData,
        mediaPlans: mediaPlanGroup ? [mediaPlanGroup] : [],
        settings: initialGeneratedAssets.settings,
    };
    return assets;
};

export const processBrandProfileResponse = (jsonText: string): BrandInfo => {
    const parsed = sanitizeAndParseJson(jsonText);
    return parsed as BrandInfo;
};

export const processGenerateMediaPromptForPostResponse = (responseText: string, postContentType: string, settings: Settings): string | string[] => {
    if (postContentType === 'Carousel Post' || postContentType === 'Carousel') {
        try {
            const parsedResponse = sanitizeAndParseJson(responseText);
            if (Array.isArray(parsedResponse)) {
                return parsedResponse.map((prompt: string) => {
                    // Validate each prompt to ensure it's a string
                    return typeof prompt === 'string' ? prompt + settings.mediaPromptSuffix : String(prompt) + settings.mediaPromptSuffix;
                });
            }
            
            // If parsing fails but we expect an array, try to convert the string to an array
            if (typeof parsedResponse === 'string') {
                return validateAndCorrectCarouselPrompt(parsedResponse + settings.mediaPromptSuffix, 'Carousel') as string[];
            }
        } catch (e) {
            console.error("Failed to parse carousel prompts, returning as single string:", responseText);
            // Try to correct the carousel prompt
            return validateAndCorrectCarouselPrompt(responseText + settings.mediaPromptSuffix, 'Carousel') as string[];
        }
    }
    return responseText + settings.mediaPromptSuffix;
};

export const processViralIdeasResponse = (jsonText: string, useSearch: boolean): Omit<Idea, 'id' | 'trendId'>[] => {
    if (typeof jsonText !== 'string' || !jsonText) {
        console.error("[processViralIdeasResponse] Received invalid or empty jsonText from AI service. Returning empty array.");
        return [];
    }

    // Use the existing sanitizeAndParseJson function to handle markdown extraction and JSON parsing
    let parsedData;
    try {
        parsedData = sanitizeAndParseJson(jsonText);
    } catch (e) {
        console.error("[processViralIdeasResponse] Failed to parse JSON:", jsonText);
        throw new Error("Failed to parse AI response as JSON");
    }

    // Handle the case where the response is wrapped in an object with a ViralIdeas key
    let ideasArray;
    if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
        // Check for ViralIdeas key (case insensitive)
        const viralIdeasKey = Object.keys(parsedData).find(key => 
            key.toLowerCase() === 'viralideas' || key.toLowerCase() === 'ideas'
        );
        
        if (viralIdeasKey) {
            ideasArray = parsedData[viralIdeasKey];
        } else if (parsedData.ViralIdeas) {
            ideasArray = parsedData.ViralIdeas;
        } else if (parsedData.ideas) {
            ideasArray = parsedData.ideas;
        } else {
            // If it's an object but doesn't have the expected keys, return it as a single-item array
            ideasArray = [parsedData];
        }
    } else {
        ideasArray = parsedData;
    }

    // Final safety check to ensure it's an array before returning
    if (!Array.isArray(ideasArray)) {
        console.error("[processViralIdeasResponse] Parsed result is not an array. Returning empty array. Parsed data:", ideasArray);
        return [];
    }

    return ideasArray;
};

export const processContentPackageResponse = (jsonText: string, params: { idea: Idea, pillarPlatform: 'YouTube', settings: Settings, persona: Persona | null, selectedProduct: AffiliateLink | null }): MediaPlanGroup => {
  const { idea, pillarPlatform, settings, persona, selectedProduct } = params;
  const rawResponse = sanitizeAndParseJson(jsonText);

  if (!rawResponse.pillarContent) {
      throw new Error('Missing pillar content in API response');
  }

  const pillarPost = validateAndCorrectMediaPlanPost({
      title: rawResponse.pillarContent.title || 'Untitled',
      content: rawResponse.pillarContent.content || '',
      ...(rawResponse.pillarContent.description && { description: rawResponse.pillarContent.description }),
      hashtags: Array.isArray(rawResponse.pillarContent.hashtags) ?
          rawResponse.pillarContent.hashtags :
          (typeof rawResponse.pillarContent.hashtags === 'string' ? [rawResponse.pillarContent.hashtags] : []),
      cta: rawResponse.pillarContent.cta || '',
      mediaPrompt: rawResponse.pillarContent.mediaPrompt 
          ? (Array.isArray(rawResponse.pillarContent.mediaPrompt) ? rawResponse.pillarContent.mediaPrompt.map((mp: string) => mp + settings.mediaPromptSuffix) 
          : rawResponse.pillarContent.mediaPrompt + settings.mediaPromptSuffix) : '',
      platform: pillarPlatform,
      isPillar: true,
  });

  // Check for both repurposedContent (singular) and repurposedContents (plural) to handle different AI responses
  const repurposedContentArray = rawResponse.repurposedContent || rawResponse.repurposedContents;
  
  if (!Array.isArray(repurposedContentArray)) {
      // If there's no repurposed content, create an empty array to avoid the error
      console.warn('Missing repurposed contents in API response, continuing with just pillar content');
  }

  const repurposedPlatforms = ['Facebook', 'Instagram', 'TikTok', 'Pinterest'];
  const repurposedPosts = Array.isArray(repurposedContentArray) 
    ? repurposedContentArray
        .filter((content: any) => repurposedPlatforms.includes(content.platform))
        .map((content: any) => validateAndCorrectMediaPlanPost({
            title: content.title || 'Untitled',
            content: content.content || '',
            contentType: content.contentType || 'text',
            hashtags: Array.isArray(content.hashtags) ?
                content.hashtags :
                (typeof content.hashtags === 'string' ? [content.hashtags] : []),
            cta: content.cta || '',
            mediaPrompt: content.mediaPrompt + settings.mediaPromptSuffix || '',
            platform: content.platform,
            isPillar: false,
        }))
    : [];

  const allPosts: MediaPlanPost[] = [
      pillarPost as MediaPlanPost,
      ...repurposedPosts
  ];

  const finalPosts = allPosts.map(p => ({
      ...p,
      status: 'draft',
      promotedProductIds: (selectedProduct && selectedProduct.id) ? [selectedProduct.id] : [],
  } as MediaPlanPost));

  const plan: MediaPlan = [{
      theme: `Content Package: ${idea.title}`,
      posts: finalPosts
  }];

  return {
      name: idea.title,
      prompt: idea.description || 'N/A',
      plan: plan,
      source: 'content-package',
      personaId: persona?.id || null,
  } as MediaPlanGroup;
};

export const processFacebookTrendsResponse = (jsonText: string): Omit<FacebookTrend, 'id' | 'brandId'>[] => {
    const trendsData = sanitizeAndParseJson(jsonText);
    return (trendsData || []).map((trend: any) => ({ ...trend, createdAt: new Date().toISOString() }));
};

export const processPostsForFacebookTrendResponse = (jsonText: string): Omit<FacebookPostIdea, 'id' | 'trendId'>[] => {
    return sanitizeAndParseJson(jsonText);
};

export const processIdeasFromProductResponse = (jsonText: string, product: AffiliateLink): Omit<Idea, 'id' | 'trendId'>[] => {
    if (!jsonText) {
        console.warn("Received empty response from AI when generating ideas from product. Returning empty array.");
        return [];
    }

    let ideas = sanitizeAndParseJson(jsonText);
    
    if (ideas && typeof ideas === 'object' && !Array.isArray(ideas) && ideas.ideas) {
        ideas = ideas.ideas;
    }
    
    if (ideas && typeof ideas === 'object' && !Array.isArray(ideas) && ideas.title) {
        ideas = [ideas];
    }
    
    if (!Array.isArray(ideas)) {
        throw new Error("Expected an array of ideas, but received: " + JSON.stringify(ideas));
    }
    
    for (let i = 0; i < ideas.length; i++) {
        const idea = ideas[i];
        if (!idea.title || !idea.description || !idea.targetAudience) {
            throw new Error(`Idea at index ${i} is missing required fields.`);
        }
    }
    
    return ideas.map((idea: any) => ({
        ...idea,
        productId: product.id
    }));
};

export const processAutoGeneratePersonaResponse = (jsonText: string): Partial<Persona>[] => {
    const personaData = sanitizeAndParseJson(jsonText);
    if (!personaData || !Array.isArray(personaData)) {
        throw new Error("Received invalid or empty array response from AI when generating persona profiles.");
    }
    return personaData as Partial<Persona>[];
};

export const processSuggestTrendsResponse = (jsonText: string): Omit<Trend, 'id' | 'brandId'>[] => {
    let trends = sanitizeAndParseJson(jsonText);
    
    // Handle different response formats
    if (trends && typeof trends === 'object' && !Array.isArray(trends) && trends.Trends) {
        trends = trends.Trends;
    }
    
    if (trends && typeof trends === 'object' && !Array.isArray(trends) && trends.topic) {
        trends = [trends];
    }
    
    if (!Array.isArray(trends)) {
        throw new Error("Expected an array of trends, but received: " + JSON.stringify(trends));
    }
    
    // Validate each trend object
    for (let i = 0; i < trends.length; i++) {
        const trend = trends[i];
        if (!trend.topic) {
            throw new Error(`Trend at index ${i} is missing required 'topic' field.`);
        }
        // Ensure keywords is an array
        if (trend.keywords && !Array.isArray(trend.keywords)) {
            trend.keywords = [trend.keywords];
        }
    }
    
    return trends.map((trend: any) => ({
        ...trend,
        createdAt: new Date().toISOString()
    }));
};

export const processSuggestGlobalTrendsResponse = (jsonText: string): Omit<Trend, 'id' | 'brandId'>[] => {
    return processSuggestTrendsResponse(jsonText);
};
// #endregion