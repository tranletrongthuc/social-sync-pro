import type { MediaPlan, MediaPlanGroup, MediaPlanPost, Settings, AffiliateLink, Persona, GeneratedAssets, BrandInfo, Idea, FacebookTrend, FacebookPostIdea, PostInfo } from '../../types';
import { sanitizeAndParseJson } from './utils';

/**
 * This service is responsible for processing and normalizing raw JSON
 * responses from AI services into structured, application-ready data types.
 */

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
          const { status, ...restOfPost } = post;
          return {
              ...restOfPost,
              id: crypto.randomUUID(),
              status: 'draft',
              pillar: pillar,
              mediaPrompt: post.mediaPrompt ? (Array.isArray(post.mediaPrompt) ? post.mediaPrompt.map((mp: string) => mp + settings.mediaPromptSuffix) : post.mediaPrompt + settings.mediaPromptSuffix) : '',
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
      id: crypto.randomUUID(),
      name: (planName && planName !== 'Untitled Plan') ? planName : generateFallbackTitle(userPrompt, selectedProduct, persona),
      prompt: userPrompt,
      plan: planWithEnhancements,
      source: 'wizard',
      personaId: persona?.id,
  };
};

export const processBrandKitResponse = (jsonText: string, language: string): Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'> => {
    const parsedJson = sanitizeAndParseJson(jsonText);

    if (!parsedJson.brandFoundation || !parsedJson.coreMediaAssets || !parsedJson.unifiedProfileAssets || (!parsedJson.mediaPlan && !parsedJson.initial1MonthMediaPlan)) {
        console.error("AI response is missing one or more root keys. Parsed JSON:", parsedJson);
        throw new Error("The AI returned a JSON object with a missing or incorrect structure. Please try again.");
    }
    
    if (parsedJson.coreMediaAssets?.logoConcepts) {
        parsedJson.coreMediaAssets.logoConcepts = parsedJson.coreMediaAssets.logoConcepts.map((logo: any) => {
            const logoId = crypto.randomUUID();
            return {
                ...logo,
                id: logoId,
                imageKey: `logo_${logoId}`
            };
        });
    }
    if (parsedJson.unifiedProfileAssets) {
        const profilePictureId = crypto.randomUUID();
        parsedJson.unifiedProfileAssets.profilePictureId = profilePictureId;
        parsedJson.unifiedProfileAssets.profilePictureImageKey = `profile_${profilePictureId}`;
        
        const coverPhotoId = crypto.randomUUID();
        parsedJson.unifiedProfileAssets.coverPhotoId = coverPhotoId;
        parsedJson.unifiedProfileAssets.coverPhotoImageKey = `cover_${coverPhotoId}`;
    }

    let mediaPlanGroup: MediaPlanGroup | null = null;
    if (parsedJson.mediaPlan) {
        const planWithIds: MediaPlan = (parsedJson.mediaPlan as any[]).map(week => ({
            ...week,
            posts: (week.posts || []).map((post: any) => {
                const postId = crypto.randomUUID();
                const { status, ...restOfPost } = post;
                return {
                    ...restOfPost,
                    id: postId,
                    imageKey: post.mediaPrompt ? `media_plan_post_${postId}` : undefined,
                    status: 'draft',
                } as MediaPlanPost;
            }),
        }));
        
        mediaPlanGroup = {
            id: crypto.randomUUID(),
            name: language === 'Việt Nam' ? 'Kế hoạch Ra mắt Thương hiệu' : 'Brand Launch Plan',
            prompt: language === 'Việt Nam' ? 'Kế hoạch ban đầu được tạo cho việc ra mắt thương hiệu.' : 'Initial plan generated for brand launch.',
            plan: planWithIds,
            source: 'brand-launch',
        };
    }
    
    const assets: Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'> = {
        brandFoundation: parsedJson.brandFoundation,
        coreMediaAssets: parsedJson.coreMediaAssets,
        unifiedProfileAssets: parsedJson.unifiedProfileAssets,
        mediaPlans: mediaPlanGroup ? [mediaPlanGroup] : [],
    };
    return assets;
};

export const processBrandProfileResponse = (jsonText: string): BrandInfo => {
    const parsed = sanitizeAndParseJson(jsonText);
    return parsed as BrandInfo;
};

export const processGenerateMediaPromptForPostResponse = (responseText: string, postContentType: string, settings: Settings): string | string[] => {
    if (postContentType === 'Carousel Post') {
        try {
            const parsedResponse = sanitizeAndParseJson(responseText);
            if (Array.isArray(parsedResponse)) {
                return parsedResponse.map((prompt: string) => prompt + settings.mediaPromptSuffix);
            }
        } catch (e) {
            console.error("Failed to parse carousel prompts, returning as single string:", responseText);
            return responseText;
        }
    }
    return responseText + settings.mediaPromptSuffix;
};

export const processViralIdeasResponse = (jsonText: string, useSearch: boolean): Omit<Idea, 'id' | 'trendId'>[] => {
    let extractedJson = jsonText.trim();
    if (useSearch) {
        // Let sanitizeAndParseJson handle the markdown extraction
        return sanitizeAndParseJson(jsonText);
    }
    
    let fixedJsonText = extractedJson.trim();
    if (fixedJsonText.startsWith('{')) {
        fixedJsonText = `[${fixedJsonText}]`;
    }

    return sanitizeAndParseJson(fixedJsonText);
};

export const processContentPackageResponse = (jsonText: string, params: { idea: Idea, pillarPlatform: 'YouTube', settings: Settings, persona: Persona | null, selectedProduct: AffiliateLink | null }): MediaPlanGroup => {
  const { idea, pillarPlatform, settings, persona, selectedProduct } = params;
  const rawResponse = sanitizeAndParseJson(jsonText);

  if (!rawResponse.pillarContent) {
      throw new Error('Missing pillar content in API response');
  }

  const pillarPost = {
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
  };

  if (!Array.isArray(rawResponse.repurposedContents)) {
      throw new Error('Missing repurposed contents in API response');
  }

  const repurposedPlatforms = ['Facebook', 'Instagram', 'TikTok', 'Pinterest'];
  const repurposedPosts = rawResponse.repurposedContents
      .filter((content: any) => repurposedPlatforms.includes(content.platform))
      .map((content: any) => ({
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
      }));

  const allPosts: Omit<MediaPlanPost, 'id'|'status'>[] = [
      pillarPost,
      ...repurposedPosts
  ];

  const finalPosts = allPosts.map(p => ({
      ...p,
      id: crypto.randomUUID(),
      status: 'draft',
      promotedProductIds: (selectedProduct && selectedProduct.id) ? [selectedProduct.id] : [],
  } as MediaPlanPost));

  const plan: MediaPlan = [{
      theme: `Content Package: ${idea.title}`,
      posts: finalPosts
  }];

  return {
      id: crypto.randomUUID(),
      name: idea.title,
      prompt: idea.description || 'N/A',
      plan: plan,
      source: 'content-package',
      personaId: persona?.id || null,
  };
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
// #endregion