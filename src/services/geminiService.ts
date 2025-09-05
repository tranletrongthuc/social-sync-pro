import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { generateContentWithBff, generateImageWithBff, autoGeneratePersonaWithBff, generateImageWithBananaBff } from './bffService';

export const generateImageWithBanana = async (
    model: string,
    prompt: string,
    promptSuffix: string
): Promise<string> => {
    // Use BFF for image generation to keep API keys secure
    const fullPrompt = `${prompt}${promptSuffix ? `, ${promptSuffix}` : ''}`;
    
    return await generateImageWithBananaBff(model, fullPrompt);
};
import type { BrandInfo, GeneratedAssets, MediaPlan, BrandFoundation, MediaPlanGroup, MediaPlanPost, AffiliateLink, Persona, Trend, Idea, FacebookTrend, FacebookPostIdea } from '../../types';


export const sanitizeAndParseJson = (jsonText: string) => {
    // This function attempts to fix common JSON errors produced by AI models.
    if (!jsonText) {
        throw new Error("Received empty JSON string from AI.");
    }

    let sanitized = jsonText.trim();

    // First, try to parse the JSON as is - if it works, return it immediately
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        // If it fails, continue with sanitization
    }

    // Remove any markdown code block markers if present
    const markdownRegex = /```(?:json)?\s*\n?([\s\S]*?)(?:\n?\s*```|$)/;
    const markdownMatch = sanitized.match(markdownRegex);
    if (markdownMatch && markdownMatch[1]) {
        sanitized = markdownMatch[1];
    }

    // The single-line comment removal was removed because it was corrupting
    // base64 strings in image generation which can contain "//".
    // The AI models should be trusted to return valid JSON when requested.

    // 2. Fix for observed error: `... ,"=value" ...` which should be `... ,"value" ...`
    // This regex looks for a comma or opening bracket, optional whitespace,
    // then the erroneous `="` followed by a string, and a closing `"`.
    // It reconstructs it as a valid JSON string.
    sanitized = sanitized.replace(/([,[\]]\s*)"=([^"]*)"/g, '$1"$2"');

    // 3. Fix for Pinterest posts generating "infographicContent" instead of "content".
    sanitized = sanitized.replace(/"infographicContent":/g, '"content":');
    
    // 4. Fix for hashtags missing an opening quote, e.g., [... , #tag"] or [#tag"]
    // This looks for a comma/bracket followed by whitespace, then a #, then captures the tag content, and the closing quote.
    // It then reconstructs it with the opening quote.
    sanitized = sanitized.replace(/([,[\]\s])#([^"\]\s]+)(")/g, '$1"#$2$3');

    // 5. Removed risky unescaped quote sanitizer. Relying on responseMimeType: "application/json".
    // sanitized = sanitized.replace(/(?<![[\]{\s:,])"(?![\]s,}\]:])/g, '"');

    // 6. Remove trailing commas, which are valid in JS but not in strict JSON.
    // e.g., `{"key":"value",}` or `["item1",]`
    sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');
    
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        console.error("Failed to parse AI JSON response for product-based ideas:", jsonText);
        throw new Error("The AI returned a malformed or unexpected response. This may be a temporary issue with the model. Please try again later or configure a different model in Settings.");
    }
};

export const normalizeMediaPlanGroupResponse = (data: any): { name: string; plan: MediaPlan } => {
    if (!data) throw new Error("Invalid or empty data provided to normalizeMediaPlanGroupResponse.");

    let effectiveData = data;
    let name = '';
    let plan: MediaPlan = [];

    // Handle wrapped responses (e.g., from OpenRouter models)
    if (data.result && typeof data.result === 'object') {
        effectiveData = data.result;
    }

    // Extract name if present at the root level
    if (effectiveData.name && typeof effectiveData.name === 'string') {
        name = effectiveData.name;
    }

    // Try to find the plan array in various possible locations
    if (Array.isArray(effectiveData)) {
        // If the root is an array, assume it's the plan
        plan = effectiveData;
    } else if (typeof effectiveData === 'object') {
        // Check for common keys that might contain the plan
        const possiblePlanKeys = ['plan', 'weeks', 'mediaPlan'];
        for (const key of possiblePlanKeys) {
            if (effectiveData[key] && Array.isArray(effectiveData[key])) {
                plan = effectiveData[key];
                break;
            }
        }

        // Also check for nested structures
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
        console.warn("Could not find a valid 'plan' or 'weeks' array in the AI response.", data); // Log original data for debugging
    }
    
    return { name: name || 'Untitled Plan', plan };
};

export const normalizePillarContent = (data: any): Omit<MediaPlanPost, 'id'|'platform'|'status'|'isPillar'> => {
    if (!data || typeof data !== 'object') {
        throw new Error("Invalid data for pillar content normalization.");
    }
    
    const pillarPost = { ...data };

    // Handle cases where the AI returns a structured array for 'content'.
    if (Array.isArray(pillarPost.content)) {
        pillarPost.content = (pillarPost.content as { section?: string, script?: string }[])
            .map(part => `${part.section ? `## ${part.section}\
\
` : ''}${part.script || ''}`)
            .join('\n\n');
    }

    // Handle cases where the AI returns a string for 'hashtags'.
    if (typeof pillarPost.hashtags === 'string') {
        pillarPost.hashtags = pillarPost.hashtags.split(/[, ]+/) 
            .map((h: string) => h.trim())
            .filter(Boolean)
            .map((h: string) => h.startsWith('#') ? h : `#${h}`);
    } else if (!Array.isArray(pillarPost.hashtags)) {
        pillarPost.hashtags = [];
    }
    
    return pillarPost;
};

export const normalizeArrayResponse = <T>(data: any, keyHint: string): T[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as T[];

    if (typeof data === 'object' && data !== null) {
        // First try the specific hint
        if (data[keyHint] && Array.isArray(data[keyHint])) {
            return data[keyHint] as T[];
        }
        // Then try a generic hint
        const genericHint = `${keyHint}s`; // e.g., idea -> ideas, post -> posts
        if (data[genericHint] && Array.isArray(data[genericHint])) {
            return data[genericHint] as T[];
        }
        // Fallback: find the first key that holds an array
        const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
        if (arrayKey) {
            return data[arrayKey] as T[];
        }

        // NEW FALLBACK: If all else fails and we have a non-array object, wrap it in an array.
        // This handles cases where the AI was supposed to return an array but returned a single object instead.
        if (Object.keys(data).length > 0) { // Ensure it's not an empty object {}
             return [data as T];
        }
    }
    
    console.warn(`Could not find a valid array in the response with hint "${keyHint}".`, data);
    return [];
};


export const geminiFetchWithRetry = async <T extends GenerateContentResponse>(apiCall: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> => {
    let lastError: Error | null = null;
    let delay = initialDelay;

    for (let i = 0; i < retries; i++) {
        try {
            const result = await apiCall();
            console.log("Raw Gemini API response (result object):", result);
            if (result.candidates && result.candidates.length > 0) {
                console.log("Gemini candidate content:", result.candidates[0].content);
            }
            window.dispatchEvent(new CustomEvent('rateLimitWaitClear'));
            return result;
        } catch (e: any) {
            lastError = e;
            if (e.message && (e.message.includes('RESOURCE_EXHAUSTED') || e.message.includes('429'))) {
                 console.warn(`Gemini API rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
                 window.dispatchEvent(new CustomEvent('rateLimitWait', { 
                     detail: { service: 'Gemini', seconds: delay / 1000, attempt: i + 1, total: retries } 
                 }));
                 await new Promise(res => setTimeout(res, delay));
                 delay *= 2;
                 continue;
            } else {
                throw e;
            }
        }
    }
    
    window.dispatchEvent(new CustomEvent('rateLimitWaitClear'));
    throw new Error(`Gemini API request failed after ${retries} attempts. Last error: ${lastError?.message}`);
};

const colorInfoSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        hex: { type: Type.STRING },
    },
    required: ['name', 'hex']
};

const brandInfoSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "A creative and fitting brand name." },
        mission: { type: Type.STRING, description: "A powerful, one-sentence mission statement." },
        values: { type: Type.STRING, description: "A comma-separated string of 4-5 core brand values." },
        audience: { type: Type.STRING, description: "A brief description of the target audience." },
        personality: { type: Type.STRING, description: "3-4 keywords describing the brand's personality." },
    },
    required: ['name', 'mission', 'values', 'audience', 'personality']
};


const mediaPlanSchema = {
    type: Type.ARRAY,
    description: "A 4-week media plan.",
    items: {
        type: Type.OBJECT,
        properties: {
            week: { type: Type.INTEGER },
            theme: { type: Type.STRING },
            posts: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING, description: "Platform for the post. Must be one of: 'YouTube', 'Facebook', 'Instagram', 'TikTok', 'Pinterest'." },
                        contentType: { type: Type.STRING },
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        cta: { type: Type.STRING },
                        mediaPrompt: {
                            oneOf: [
                                { type: Type.STRING },
                                { type: Type.ARRAY, items: { type: Type.STRING } }
                            ],
                            description: "A detailed prompt for the media content. Can be a string or an array of strings for carousels."
                        }, 
                        script: { type: Type.STRING, description: "A detailed script for video content." }
                    },
                    required: ['platform', 'contentType', 'title', 'content', 'hashtags', 'cta', 'mediaPrompt']
                }
            }
        },
        required: ['week', 'theme', 'posts']
    }
};

const brandKitResponseSchema = {
  type: Type.OBJECT,
  properties: {
    brandFoundation: {
      type: Type.OBJECT,
      properties: {
        brandName: { type: Type.STRING },
        mission: { type: Type.STRING },
        values: { type: Type.ARRAY, items: { type: Type.STRING } },
        targetAudience: { type: Type.STRING },
        personality: { type: Type.STRING },
        keyMessaging: { type: Type.ARRAY, items: { type: Type.STRING } },
        usp: { type: Type.STRING },
      },
      required: ['brandName', 'mission', 'values', 'targetAudience', 'personality', 'keyMessaging', 'usp']
    },
    coreMediaAssets: {
      type: Type.OBJECT,
      properties: {
        logoConcepts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              style: { type: Type.STRING },
              prompt: { type: Type.STRING },
            },
            required: ['style', 'prompt']
          },
        },
        colorPalette: {
          type: Type.OBJECT,
          properties: {
            primary: colorInfoSchema,
            secondary: colorInfoSchema,
            accent: colorInfoSchema,
            text: colorInfoSchema,
          },
          required: ['primary', 'secondary', 'accent', 'text']
        },
        fontRecommendations: {
          type: Type.OBJECT,
          properties: {
            headlines: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, weight: { type: Type.STRING } } },
            body: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, weight: { type: Type.STRING } } },
          },
          required: ['headlines', 'body']
        },
      },
      required: ['logoConcepts', 'colorPalette', 'fontRecommendations']
    },
    unifiedProfileAssets: {
      type: Type.OBJECT,
      properties: {
        accountName: { type: Type.STRING },
        username: { type: Type.STRING },
        profilePicturePrompt: { type: Type.STRING },
        coverPhoto: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            designConcept: { type: Type.STRING },
          },
          required: ['prompt', 'designConcept']
        },
      },
      required: ['accountName', 'username', 'profilePicturePrompt', 'coverPhoto']
    },
    mediaPlan: mediaPlanSchema,
  },
  required: ['brandFoundation', 'coreMediaAssets', 'unifiedProfileAssets', 'mediaPlan']
};

export const refinePostContentWithGemini = async (postText: string, model: string): Promise<string> => {
    // Use BFF for content generation to keep API keys secure
    const prompt = `You are a world-class social media copywriter. Refine the following post content to maximize engagement and impact, while preserving its core message. The output should ONLY be the refined text, without any introductory phrases, explanations, or quotes.

Original content:
"""${postText}"""`;

    return await generateContentWithBff(model, prompt);
};

export const generateBrandProfile = async (idea: string, language: string, model: string): Promise<BrandInfo> => {
    // Use BFF for content generation to keep API keys secure
    const prompt = `
You are an expert brand strategist. Based on the user's business idea, generate a concise and compelling brand profile IN ${language}.
Business Idea:
"${idea}"

Generate a JSON object with the following fields in ${language}:
- name: A creative and fitting brand name.
- mission: A powerful, one-sentence mission statement.
- values: A comma-separated string of 4-5 core brand values.
- audience: A brief description of the target audience.
- personality: 3-4 keywords describing the brand's personality.
`;
    // console.log("Prompt for generateBrandProfile:", prompt);
    
    const jsonText = await generateContentWithBff(model, prompt);
    if (!jsonText) throw new Error("Received empty response from AI.");
    return sanitizeAndParseJson(jsonText) as BrandInfo;
};

export const generateBrandKit = async (brandInfo: BrandInfo, language: string, model: string): Promise<Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'>> => {
    const prompt = `
You are SocialSync Pro, an AI-powered brand launch assistant. Your task is to generate a complete and professional set of branding and social media assets IN ${language}, based on the user's input.

Brand Input (in ${language}):
- Brand Name: ${brandInfo.name}
- Brand Mission: ${brandInfo.mission}
- Brand Values: ${brandInfo.values}
- Target Audience: ${brandInfo.audience}
- Brand Personality: ${brandInfo.personality}

Generate the following assets IN ${language}:
1.  **Brand Foundation**
: Summarize the core identity. All subsequent generations must be perfectly aligned with this foundation.
2.  **Core Media Assets**
: Create logo concepts (prompts for an image generation model), a 4-color palette, and font recommendations. Logo prompts must be in English.
3.  **Unified Profile Assets**
: Create a single set of assets for use across all platforms (account name, username, profile picture prompt, cover photo prompt). Image prompts must be in English.
4.  **Initial 1-Month Media Plan**
: Generate a 4-week media plan designed for a brand launch. It should have a clear theme for each week. Create 4 posts per week, distributed across YouTube, Facebook, Instagram, TikTok, and Pinterest. For each post, provide a detailed, English media prompt appropriate for the content type (e.g., image prompt, video script, carousel prompts). For video content, provide a separate 'script' field. The 'content' field should always be the post caption.
`;
    const jsonText = await generateContentWithBff(
        model,
        prompt,
        { responseMimeType: "application/json", responseSchema: brandKitResponseSchema }
    );
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

export const generateMediaPlanGroup = async (
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
    const personaInstruction = persona ? `
**KOL/KOC Persona (Crucial):**
All content MUST be generated from the perspective of the following KOL/KOC. They are the face of this campaign.
- **Nickname:** ${persona.nickName}
- **Main Style:** ${persona.mainStyle}
- **Field of Activity:** ${persona.activityField}
- **Detailed Description (for media generation):** ${persona.outfitDescription}
- **Tone:** The content's tone must perfectly match this persona's style.
- **Media Prompts (VERY IMPORTANT):** For any post that requires an image, the 'mediaPrompt' MUST start with the exact "Detailed Description" provided above, followed by a comma and then a description of the scene. The structure must be: "${persona.outfitDescription}, [description of the scene]".
` : '';

    const prompt = `You are SocialSync Pro, an AI-powered brand launch assistant. Your task is to generate a 1-Month Media Plan IN ${language} based on the provided Brand Foundation and User Goal.
The output must be a single, valid JSON object that strictly adheres to the provided schema. Do not add any commentary or text outside of the JSON structure.

**Brand Foundation (Use this as your guide):**
- Brand Name: ${brandFoundation.brandName}
- Mission: ${brandFoundation.mission}
- USP: ${brandFoundation.usp}
- Values: ${(brandFoundation.values || []).join(', ')}
- Target Audience: ${brandFoundation.targetAudience}
- Personality: ${brandFoundation.personality}

${personaInstruction}

**User's Goal for the Plan:**
"${userPrompt}"

**Content Customization Instructions:**
- **Tone of Voice**
: Generate all content with a '${options.tone}' tone.
- **Writing Style**
: The primary style should be '${options.style}'.
- **Post Length**
: Adhere to a '${options.length}' post length. For example, 'Short' is suitable for Instagram captions (2-4 sentences), 'Medium' for Facebook (1-2 paragraphs), and 'Long' could be a detailed script or a mini-blog post.
- **Emojis**
: ${options.includeEmojis ? "Use emojis appropriately to enhance engagement and match the brand personality." : "Do not use any emojis."}

Based on the Brand Foundation, User's Goal, and Customization Instructions, generate a complete 4-week media plan group.
- **Name**
: Create a concise, meaningful, and easy-to-understand title for this entire plan. The title should summarize the main goal of the plan. For example: "Q3 Product Launch for Eco-Friendly Sneakers", "Summer Skincare Campaign for Oily Skin", "Engagement Boost for YouTube Channel".
- **Plan Structure**
: The plan must have 4 weekly objects. Each week must have a clear 'theme' (e.g., "Week 1: Brand Introduction & Values").
- **Content**
: The entire 4-week plan must contain a total of approximately ${totalPosts} posts, distributed logically across the 4 weeks. The number of posts per week can vary if it makes thematic sense, but the total must be close to ${totalPosts}. The posts should be distributed *only* across the following selected platforms: ${selectedPlatforms.join(', ')}. Do not generate content for any other platform not in this list.
- **Post Details (CRITICAL):
    -   **contentType**: e.g., "Image Post", "Video Idea", "Story", "Carousel Post", "Shorts Idea".
    -   **content**: This is ALWAYS the user-facing text caption for the post.
    -   **script**: For video contentTypes ("Video Idea", "Shorts Idea", "Story"), this field MUST contain the video script, storyboard, or detailed scene-by-scene description. For non-video posts, this should be null.
    -   **mediaPrompt**: This is the prompt for the visual media. It MUST be in English.
        -   For "Image Post": A single, detailed DALL-E prompt to generate the image.
        -   For "Video Idea", "Shorts Idea", "Story": A concise, one-paragraph summary of the visual concept, suitable for a text-to-video model.
        -   For "Carousel Post": An array of detailed, English DALL-E prompts, one for each image in the carousel (2-5 prompts).
- **Consistency**
: The entire media plan must be thematically consistent with the Brand Foundation.
`;

    const config: any = {
        systemInstruction: affiliateContentKitSystemInstruction,
    };
    if (useSearch) {
        config.tools = [{googleSearch: {}}];
    } else {
        config.responseMimeType = "application/json";
        config.responseSchema = mediaPlanSchema;
    }

    const jsonText = await generateContentWithBff(model, prompt, config);
    
    let extractedJson = jsonText.trim();
    if (useSearch) {
        const markdownMatch = extractedJson.match(/```json\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
            extractedJson = markdownMatch[1];
        } else {
            // Find the first valid JSON object.
            const startIndex = extractedJson.indexOf('{');
            if (startIndex !== -1) {
                let balance = 0;
                let endIndex = -1;
                for (let i = startIndex; i < extractedJson.length; i++) {
                    if (extractedJson[i] === '{') balance++;
                    else if (extractedJson[i] === '}') balance--;
                    if (balance === 0) {
                        endIndex = i;
                        break;
                    }
                }
                if (endIndex !== -1) {
                    extractedJson = extractedJson.substring(startIndex, endIndex + 1);
                }
            }
        }
    }

    const parsedResult = sanitizeAndParseJson(extractedJson);
    const { name: planName, plan: planWeeks } = normalizeMediaPlanGroupResponse(parsedResult);

    const planWithEnhancements = (planWeeks || []).map(week => ({
        ...week,
        posts: (week.posts || []).map((post: any) => {
            const { status, ...restOfPost } = post;
            return {
                ...restOfPost,
                id: crypto.randomUUID(),
                status: 'draft',
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
        sources: [], // This would need to be implemented if grounding metadata is needed
        personaId: persona?.id,
    };
};


export const generateImage = async (
    prompt: string,
    promptSuffix: string,
    model: string,
    aspectRatio: "1:1" | "16:9" = "1:1",
    productImages: File[] = []
): Promise<string> => {
    // Use BFF for image generation to keep API keys secure
    const fullPrompt = `${prompt}${promptSuffix ? `, ${promptSuffix}` : ''}`;
    
    return await generateImageWithBff(model, fullPrompt, {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
    });
};

export const generateMediaPromptForPost = async (
    postContent: { title: string; content: string, contentType: string },
    brandFoundation: BrandFoundation,
    language: string,
    model: string,
    persona: Persona | null,
    mediaPromptSuffix: string
): Promise<string | string[]> => {
    const personaInstruction = persona ? `
The media MUST feature the following persona:
- Nickname: ${persona.nickName}
- Main Style: ${persona.mainStyle}
- Field of Activity: ${persona.activityField}
- Detailed Description: ${persona.outfitDescription}

IMPORTANT: For image prompts, the prompt you generate MUST start with the exact "Detailed Description" provided above, followed by a comma, then the scene description. The structure must be: "${persona.outfitDescription}, [description of the scene]"
` : '';

    let prompt = `
You are a creative visual director for the brand "${brandFoundation.brandName}".
The brand's personality is: ${brandFoundation.personality}.
${personaInstruction}
Based on the following social media post content (in ${language}), generate a detailed and compelling media prompt.
The prompt MUST BE IN ENGLISH.
Do not add any explanations, labels, or extra text. Output ONLY the prompt.

Post Title: "${postContent.title}"
Post Content: "${postContent.content}"
`;

    switch (postContent.contentType) {
        case 'Image Post':
            prompt += `Generate a single, detailed DALL-E prompt to generate the image.`
            break
        case 'Video Idea':
        case 'Shorts Idea':
        case 'Story':
            prompt += `Generate a concise, one-paragraph summary of the visual concept, suitable for a text-to-video model.`
            break
        case 'Carousel Post':
            prompt += `Generate an array of detailed, English DALL-E prompts, one for each image in the carousel (2-5 prompts). The output should be a JSON array of strings.`
            break
        default:
            prompt += `Generate a single, detailed DALL-E prompt to generate the image.`
            break
    }

    const response = await generateContentWithBff(model, prompt);
    const textResponse = response;

    if (postContent.contentType === 'Carousel Post') {
        try {
            const parsedResponse = JSON.parse(textResponse);
            // For carousel posts, append suffix to each prompt in the array
            if (Array.isArray(parsedResponse)) {
                return parsedResponse.map((prompt: string) => prompt + mediaPromptSuffix);
            }
        } catch (e) {
            console.error("Failed to parse carousel prompts, returning as single string:", textResponse);
            return textResponse;
        }
    }

    // For single prompts, append the suffix
    return textResponse + mediaPromptSuffix;
};


// NgoSiLien - Enhanced Affiliate Comment Generation
// This function generates engaging comments for social media posts that promote affiliate products.
// It dynamically includes available product information like ratings, sales volume, and customer reviews
// to make the comments more appealing and encourage clicks on the affiliate links.
export const generateAffiliateComment = async (
    post: MediaPlanPost,
    products: AffiliateLink[],
    brandFoundation: BrandFoundation,
    language: string,
    model: string
): Promise<string> => {
     if (products.length === 0) {
        throw new Error("Cannot generate a comment without at least one affiliate product.");
    }
    
    const formatProductDetails = (p: AffiliateLink) => {
        const details = [`- Product Name: ${p.productName}`];
        
        // Add price
        details.push(`  - Price: ${p.price}`);
        
        // Add product rating if available
        if (p.product_rating !== undefined && p.product_rating !== null) {
            details.push(`  - Rating: ${p.product_rating}/5`);
        }
        
        // Add sales volume if available
        if (p.salesVolume > 0) {
            details.push(`  - Sales Volume: ${p.salesVolume}`);
        }
        
        // Add customer reviews if available
        if (p.customer_reviews && p.customer_reviews.trim() !== '') {
            // If customer_reviews contains multiple reviews, we'll extract the best one
            // For now, we'll just use the provided reviews as is
            details.push(`  - Customer Reviews: ${p.customer_reviews}`);
        }
        
        // Always add the promotion link (or product link as fallback)
        details.push(`  - Product Link: ${p.promotionLink || p.productLink}`);
        
        return details.join('\n');
    };

    const productDetails = products.map(formatProductDetails).join('\n');

    const prompt = `
You are the creator who wrote the social media post. Your task is to write a follow-up comment on your own post, from your perspective as the post author. This simulates you posting content and then engaging with your own post to promote affiliate products.

**Primary Goal:** Write a natural, human-like comment that subtly promotes one or more affiliate products related to your post. The comment must encourage clicks on the affiliate link while sounding like a genuine self-comment on your own post.

**Rules:**
1.  **Natural Tone:** The comment must sound like you're genuinely engaging with your own content. It should match the tone of the original post and sound like a real person talking to their audience. Avoid overly salesy language.
2.  **Two-Part Structure:** The comment MUST consist of two parts, separated by a blank line:
    *   **Part 1 (Caption):** A short, engaging caption. This caption must cleverly connect your original post's topic with the product(s) being promoted. It should add value, share a personal tip about how you use the product, or ask a question to spark conversation and make people curious about the link. If product details like ratings, sales volume, or customer reviews are provided, you should naturally incorporate these details to make the product more appealing.
    *   **Part 2 (Links):** The affiliate link(s) for the product(s). If there is more than one product, list each link on a new line. Do not add any text before or after the links in this part.
3.  **Language:** The entire comment MUST be in ${language}.

**Original Post Content:**
- Title: ${post.title}
- Content: ${post.content}

**Affiliate Product(s) to Promote:**
${productDetails}

**Example Output:**
Tôi vừa thử em này sau khi làm theo hướng dẫn trong bài và thấy hiệu quả bất ngờ! Bạn nào muốn thử thì xem link bên dưới nha.

https://your-affiliate-link.com

---
Now, generate the comment based on the provided post and product d...`;
    
    return await generateContentWithBff(model, prompt);
};

export const generateViralIdeas = async (
    trend: { topic: string; keywords: string[] },
    language: string,
    useSearch: boolean,
    model: string
): Promise<Omit<Idea, 'id' | 'trendId'>[]> => {
    let prompt = `You are a viral marketing expert and a world-class creative strategist.
Your task is to generate 5 highly engaging and potentially viral content ideas based on a given topic and related keywords.
The ideas must be in ${language}.
Each idea must have:
1.  A catchy, curiosity-driven 'title'.
2.  A short but comprehensive 'description' of the idea.
3.  A specific 'targetAudience' that this idea would appeal to.

Topic: "${trend.topic}"
Keywords: ${trend.keywords.join(', ')}
`;
    const ideasSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                targetAudience: { type: Type.STRING },
            },
            required: ['title', 'description', 'targetAudience'],
        },
    };

    const config: any = {};
    if (useSearch) {
        config.tools = [{googleSearch: {}}];
        prompt += '\n\nYour response MUST be a valid JSON array of objects. Do not include any text or markdown formatting before or after the JSON array.';
    } else {
        config.responseMimeType = "application/json";
        config.responseSchema = ideasSchema;
    }

    const jsonText = await generateContentWithBff(model, prompt, config);
    
    let extractedJson = jsonText.trim();
    if (useSearch) {
        const markdownMatch = extractedJson.match(/```json\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
            extractedJson = markdownMatch[1];
        } else {
            const startIndex = extractedJson.indexOf('[');
            if (startIndex !== -1) {
                let balance = 0;
                let endIndex = -1;
                for (let i = startIndex; i < extractedJson.length; i++) {
                    if (extractedJson[i] === '[') balance++;
                    else if (extractedJson[i] === ']') balance--;
                    if (balance === 0) {
                        endIndex = i;
                        break;
                    }
                }
                if (endIndex !== -1) {
                    extractedJson = extractedJson.substring(startIndex, endIndex + 1);
                }
            }
        }
    }
    
    // Fix malformed JSON responses that are missing array brackets
    let fixedJsonText = extractedJson.trim();
    if (fixedJsonText.startsWith('{')) {
        fixedJsonText = `[${fixedJsonText}]`;
    }

    return sanitizeAndParseJson(fixedJsonText);
};

export const generateContentPackage = async (
    idea: Idea,
    brandFoundation: BrandFoundation,
    language: string,
    affiliateContentKit: string,
    model: string,
    persona: Persona | null,
    pillarPlatform: 'YouTube',
    options: { tone: string; style: string; length: string; includeEmojis: boolean; },
    selectedProduct: AffiliateLink | null
): Promise<MediaPlanGroup> => {

    
    // Validate selectedProduct
    console.log('Selected product for content package:', selectedProduct);

    if (selectedProduct && !selectedProduct.id) {
        selectedProduct = null;
        console.log('Invalid selectedProduct provided. Resetting to null.');
    }
    
    // const pillarPlatform = 'YouTube';
    
    // Sanitize user inputs to prevent prompt injection
    const sanitizedIdeaTitle = idea.title.replace(/[\"\`\;]+/g, '') || 'N/A';
    const personaInstruction = persona ? `
**KOL/KOC Persona (Crucial):**
All content MUST be generated from the perspective of the following KOL/KOC.
- **Nickname:** ${persona.nickName.replace(/[\"\`\;]+/g, '') || 'N/A'}
- **Main Style:** ${persona.mainStyle.replace(/[\"\`\;]+/g, '') || 'N/A'}
- **Field of Activity:** ${persona.activityField.replace(/[\"\`\;]+/g, '') || 'N/A'}
- **Detailed Description (for image generation):** ${persona.outfitDescription.replace(/[\"\`\;]+/g, '') || 'N/A'}
- **Tone:** The content's tone must perfectly match this persona's style.
- **Image Prompts (VERY IMPORTANT):** Every single 'mediaPrompt' value you generate MUST start with the exact "Detailed Description" provided above, followed by a comma and then a description of the scene. The structure must be: "${persona?.outfitDescription || 'N/A'}, [description of the scene]". For example: "${persona?.outfitDescription || 'N/A'}, unboxing a product in a minimalist apartment...".
` : '';

    const productInstruction = selectedProduct ? `
**Affiliate Product to Feature (Crucial):**
- **Product Name:** ${selectedProduct.productName || 'N/A'}
- **Product ID:** ${selectedProduct.id || 'N/A'}
- **Instruction:** This entire content package is designed to subtly promote this specific product. All generated posts (both pillar and repurposed) MUST be related to this product and its benefits. For every single post you generate, you MUST include a 'promotedProductIds' field in the JSON object, and its value MUST be an array containing the string "${selectedProduct.id || 'N/A'}".
` : '';

    const customizationInstruction = `
**Content Customization Instructions:**
- **Tone of Voice**: Generate all content with a '${options.tone}' tone.
- **Writing Style**: The primary style should be '${options.style}'.
- **Post Length**: Adhere to a '${options.length}' post length.
- **Include Emojis**: ${options.includeEmojis ? 'Yes' : 'No'}
`;

    // Get all platforms
    const allPlatforms: ('YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest')[] = ['YouTube', 'Facebook', 'Instagram', 'TikTok', 'Pinterest'];
    const repurposedPlatforms = allPlatforms.filter(p => p !== pillarPlatform);

    // Single comprehensive prompt with media prompt generation
    const combinedPrompt = `
    ${personaInstruction}
    ${productInstruction}
    ${customizationInstruction}
    Based on the idea "${sanitizedIdeaTitle}", create a comprehensive content package including:

    1. PILLAR CONTENT FOR ${pillarPlatform}:
    Create a detailed, authoritative piece for ${pillarPlatform} that provides significant value to the target audience: ${idea.targetAudience || 'N/A'}.
    - If ${pillarPlatform} is YouTube, provide a detailed video script and a separate, SEO-optimized 'description' for the YouTube description box.
    - If ${pillarPlatform} is Facebook, provide a long-form, engaging post like a mini-article.
    - If ${pillarPlatform} is Instagram, provide a detailed multi-slide carousel post concept, including content for each slide and a main caption.
    - If ${pillarPlatform} is Pinterest, provide a concept for a detailed infographic or a guide pin, including all text content needed.
    - If ${pillarPlatform} is TikTok, provide a script for a multi-part (2-3 videos) series.

    2. REPURPOSED CONTENT FOR OTHER PLATFORMS: ${repurposedPlatforms.join(', ')}
    Repurpose the core message into one smaller, standalone post for EACH of the following platforms: ${repurposedPlatforms.join(', ')}.
    Each new piece must be completely rewritten and tailored for its specific platform's format and audience.
    - For short-form video platforms (TikTok, Instagram), create a concise video script or reel idea.
    - For image-based platforms (Instagram, Pinterest), create a compelling caption for an image or carousel.
    - For text-based platforms (Facebook), create an engaging post that summarizes or expands on a key point from the pillar content.
    - If the pillar content is a long text post and you need to generate a YouTube idea, create a script outline for a short video based on the text.

    3. MEDIA PROMPTS
    For EACH generated post (both pillar and repurposed), generate a media prompt that:
    - MUST start with the persona's "Detailed Description": "${persona?.outfitDescription || 'N/A'},"
    - Followed by a comma and then a description of the scene
    - Be highly specific and visually descriptive
    - Match the content's theme and the platform's style
    - Align with the persona's style and tone

    The output MUST be a JSON object with:
    {
      "pillarContent": {
        "title": "string",
        "content": "string",
        "description"?: "string",  // Only for YouTube
        "hashtags": "string[]",
        "cta": "string",
        "mediaPrompt": "string"  // New field for media prompt
      },
      "repurposedContents": [
        {
          "platform": "string",  // Must be one of ${repurposedPlatforms.join(', ')}
          "contentType": "string",
          "title": "string",
          "content": "string",
          "hashtags": "string[]",
          "cta": "string",
          "mediaPrompt": "string"  // New field for media prompt
        }
      ]
    }
    Language: ${language}.
    `;

    try {
        // Single API call for all content and media prompt generation
        const response = await generateContentWithBff(
            model,
            combinedPrompt,
            { systemInstruction: affiliateContentKit, responseMimeType: 'application/json' }
        );

        const rawResponse = sanitizeAndParseJson(response);
        
        // Extract and validate pillar content with media prompt
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
            mediaPrompt: rawResponse.pillarContent.mediaPrompt || '',
            platform: pillarPlatform,
            isPillar: true,
        };

        // Extract and validate repurposed contents with media prompts
        if (!Array.isArray(rawResponse.repurposedContents)) {
            throw new Error('Missing repurposed contents in API response');
        }

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
                mediaPrompt: content.mediaPrompt || '',
                platform: content.platform,
                isPillar: false,
            }));

        // Combine all posts
        const allPosts: Omit<MediaPlanPost, 'id'|'status'>[] = [
            pillarPost,
            ...repurposedPosts
        ];

        // Final posts with metadata
        const finalPosts = allPosts.map(p => ({
            ...p,
            id: crypto.randomUUID(),
            status: 'draft',
            promotedProductIds: (selectedProduct && selectedProduct.id) ? [selectedProduct.id] : [],
        } as MediaPlanPost));

        // Create plan structure
        const plan: MediaPlan = [{
            week: 1,
            theme: `Content Package: ${sanitizedIdeaTitle}`,
            posts: finalPosts
        }];

        // Return the media plan group
        return {
            id: crypto.randomUUID(),
            name: sanitizedIdeaTitle,
            prompt: idea.description || 'N/A',
            plan: plan,
            source: 'content-package',
            personaId: persona?.id || null,
        };

    } catch (error) {
        throw new Error(`Failed to generate content package: ${error.message}`);
    }
};

// --- NEW FACEBOOK STRATEGY FUNCTIONS ---

export const generateFacebookTrends = async (
    industry: string,
    language: string,
    model: string
): Promise<Omit<FacebookTrend, 'id'|'brandId'>[]> => {
    const prompt = `You are a Facebook marketing expert. Analyze Google Search results for the query "trending topics and content formats in ${industry} on Facebook for ${language}".
Identify 3-5 distinct, current trends. For each trend, provide:
1.  A concise 'topic'.
2.  An array of relevant 'keywords'.
3.  A brief 'analysis' explaining why it's trending for the target audience on Facebook and what content formats (e.g., Reels, Carousels, Long-form posts) are performing best.
4.  The top 3 most relevant 'links' from the search results that support your analysis. Each link must be an object with "uri" and "title" keys.

Your response must be a single, valid JSON array of objects. Each object should have the keys: "topic", "keywords", "analysis", and "links". Do not add any text or explanation before or after the JSON array.`;

    const jsonText = await generateContentWithBff(
        model,
        prompt,
        {
            tools: [{googleSearch: {}}],
        }
    );
    
    let extractedJson = jsonText.trim();
    const markdownMatch = extractedJson.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        extractedJson = markdownMatch[1];
    } else {
        const startIndex = extractedJson.indexOf('[');
        if (startIndex !== -1) {
            let balance = 0;
            let endIndex = -1;
            // A simple bracket counter. Not perfect for strings with brackets, but better than a greedy lastIndexOf.
            for (let i = startIndex; i < extractedJson.length; i++) {
                if (extractedJson[i] === '[') {
                    balance++;
                } else if (extractedJson[i] === ']') {
                    balance--;
                }
                if (balance === 0) {
                    endIndex = i;
                    break;
                }
            }
            if (endIndex !== -1) {
                extractedJson = extractedJson.substring(startIndex, endIndex + 1);
            }
        }
    }

    const trendsData = sanitizeAndParseJson(extractedJson);
    return (trendsData || []).map((trend: any) => ({ ...trend, createdAt: new Date().toISOString() }));
};

export const generatePostsForFacebookTrend = async (
    trend: FacebookTrend,
    language: string,
    model: string
): Promise<Omit<FacebookPostIdea, 'id' | 'trendId'>[]> => {
    const prompt = `You are a creative Facebook content strategist. Based on the following trend, generate 5 engaging Facebook post ideas in ${language}.
For each idea, provide:
1.  A catchy 'title'.
2.  The main 'content' for the post, optimized for Facebook's platform.
3.  A detailed English 'mediaPrompt' for an accompanying visual.
4.  A strong 'cta' (call to action).

Trend Topic: "${trend.topic}"
Trend Keywords: ${trend.keywords.join(', ')}
Trend Analysis: ${trend.analysis}
`;
    const postsSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                mediaPrompt: { type: Type.STRING },
                cta: { type: Type.STRING },
            },
            required: ['title', 'content', 'mediaPrompt', 'cta'],
        },
    };

    const jsonText = await generateContentWithBff(
        model,
        prompt,
        {
            responseMimeType: "application/json",
            responseSchema: postsSchema,
        }
    );
    
    return sanitizeAndParseJson(jsonText);
};

// --- NEW FUNCTION FOR GENERATING CONTENT IDEAS FROM A PRODUCT ---

export const generateIdeasFromProduct = async (
    product: AffiliateLink,
    language: string,
    model: string
): Promise<Omit<Idea, 'id' | 'trendId'>[]> => {
    // Build a detailed product description
    const productDetails = [
        `Product Name: ${product.productName}`,
        `Product ID: ${product.productId}`,
        `Price: ${product.price}`,
        `Provider: ${product.providerName}`,
        `Commission Rate: ${product.commissionRate}%`,
        `Commission Value: ${product.commissionValue}`,
        product.product_description ? `Description: ${product.product_description}` : '',
        product.features && product.features.length > 0 ? `Features: ${product.features.join(', ')}` : '',
        product.use_cases && product.use_cases.length > 0 ? `Use Cases: ${product.use_cases.join(', ')}` : '',
        product.customer_reviews ? `Customer Reviews: ${product.customer_reviews}` : '',
        product.product_rating ? `Product Rating: ${product.product_rating}/5` : ''
    ].filter(Boolean).join('\n');
    
    const prompt = `You are a creative marketing strategist. Based on the following affiliate product details, generate 5 unique and engaging content ideas in ${language} that can be used to promote this product effectively.

For each idea, provide:
1.  A catchy 'title' that would grab attention.
2.  A detailed 'description' explaining the concept and how it would showcase the product.
3.  A specific 'targetAudience' that this idea would appeal to.
4.  The 'productId' of the product, which MUST be exactly this value: "${product.id}".

Product Details:
${productDetails}

Make sure each idea is distinct and highlights different aspects of the product. Consider various content formats like tutorials, reviews, comparisons, lifestyle content, unboxings, etc.
`;

    const ideasSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                targetAudience: { type: Type.STRING },
                productId: { type: Type.STRING },
            },
            required: ['title', 'description', 'targetAudience', 'productId'],
        },
    };

    const jsonText = await generateContentWithBff(
        model,
        prompt,
        {
            responseMimeType: "application/json",
            responseSchema: ideasSchema,
        }
    );
    
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

// Platform-specific purposes from user requirements
const facebookPurpose = "Leverage community and sharing features to create discussion and provide a direct path to your main video. Create compelling short clips, thought-provoking quote graphics, or key highlights that spark conversation in comments and encourage shares. Caption should act as a hook, introducing the problem/main idea and directing users to 'click the link to watch the full video'.";

const instagramPurpose = "Capture immediate visual attention and generate curiosity through aesthetically pleasing, bite-sized content. Create visually striking Reels with dynamic 60-90 second clips, trending audio, or informative carousel posts that break down key tips. Primary goal is to be a 'scroll-stopper' that provides instant value and directs users to the 'link in bio' for deeper content.";

const tiktokPurpose = "Hijack attention within the first three seconds with high-energy, trend-centric, easily digestible video clips. Extract the most surprising fact, controversial point, or quickest 'hack' to create an 'information gap' or emotional reaction that drives viewers to your profile to find the YouTube channel link for the complete breakdown.";

const pinterestPurpose = "Create long-lasting, searchable resources that funnel users seeking solutions or inspiration. Convert core message into vertical Idea Pins or infographics with keyword-rich titles (e.g., 'How to Achieve X in 5 Easy Steps'). Serve as a visual bookmark solving part of the user's problem, with a direct outbound link to the YouTube video.";

export const autoGeneratePersonaProfile = async (mission: string, usp: string, model: string): Promise<Partial<Persona>[]> => {
    const personaProfiles = await autoGeneratePersonaWithBff(mission, usp, model);

    if (!personaProfiles || !Array.isArray(personaProfiles)) {
        throw new Error("Received invalid or empty array response from AI when generating persona profiles.");
    }

    // The bffFetch service already parses the JSON array.
    return personaProfiles as Partial<Persona>[];
};
