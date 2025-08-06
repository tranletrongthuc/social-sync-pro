import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { BrandInfo, GeneratedAssets, MediaPlan, BrandFoundation, MediaPlanGroup, MediaPlanPost, AffiliateLink, Persona, Trend, Idea, FacebookTrend, FacebookPostIdea } from '../types';

export const sanitizeAndParseJson = (jsonText: string) => {
    // This function attempts to fix common JSON errors produced by AI models.
    if (!jsonText) {
        throw new Error("Received empty JSON string from AI.");
    }

    let sanitized = jsonText;

    // The single-line comment removal was removed because it was corrupting
    // base64 strings in image generation which can contain "//".
    // The AI models should be trusted to return valid JSON when requested.

    // 2. Fix for observed error: `... ,"=value" ...` which should be `... ,"value" ...`
    // This regex looks for a comma or opening bracket, optional whitespace,
    // then the erroneous `="` followed by a string, and a closing "`.
    // It reconstructs it as a valid JSON string.
    sanitized = sanitized.replace(/([,\[])\s*=\s*"([^"]*)"/g, '$1"$2"');

    // 3. Fix for Pinterest posts generating "infographicContent" instead of "content".
    sanitized = sanitized.replace(/"infographicContent":/g, '"content":');
    
    // 4. Fix for hashtags missing an opening quote, e.g., [... , #tag"] or [#tag"]
    // This looks for a comma/bracket followed by whitespace, then a #, then captures the tag content, and the closing quote.
    // It then reconstructs it with the opening quote.
    sanitized = sanitized.replace(/([\[,]\s*)#([^"]+)(")/g, '$1"#$2$3');

    // 5. Removed risky unescaped quote sanitizer. Relying on responseMimeType: "application/json".
    // sanitized = sanitized.replace(/(?<![\[{\s:,])"(?![\s,}\]:])/g, '\"');

    // 6. Remove trailing commas, which are valid in JS but not in strict JSON.
    // e.g., `{"key":"value",}` or `["item1",]`
    sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');
    
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        console.error("Failed to parse sanitized AI JSON response:", sanitized);
        console.error("Original text was:", jsonText);
        throw e; // rethrow the original error after logging
    }
};

export const normalizeMediaPlanGroupResponse = (data: any): { name: string; plan: MediaPlan } => {
    if (!data) throw new Error("Invalid or empty data provided to normalizeMediaPlanGroupResponse.");

    let effectiveData = data;

    // Check for common wrapping keys
    if (data.mediaPlanGroup && typeof data.mediaPlanGroup === 'object') {
        effectiveData = data.mediaPlanGroup;
    } else if (data.mediaPlan && typeof data.mediaPlan === 'object') {
        effectiveData = data.mediaPlan;
    }

    let name = effectiveData.name;
    let plan = effectiveData.plan;

    // Handle nested structures like { "plan": { "name": "...", "weeks": [...] } }
    if (effectiveData.plan && typeof effectiveData.plan === 'object' && !Array.isArray(effectiveData.plan)) {
        if (effectiveData.plan.name) name = effectiveData.plan.name;
        if (effectiveData.plan.weeks && Array.isArray(effectiveData.plan.weeks)) {
            plan = effectiveData.plan.weeks;
        }
    }

    if (!Array.isArray(plan)) {
        console.warn("Could not find a valid 'plan' or 'weeks' array in the AI response.", data); // Log original data for debugging
        plan = [];
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
            .map(part => `${part.section ? `## ${part.section}\n\n` : ''}${part.script || ''}`)
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
                        imagePrompt: { type: Type.STRING, description: "A detailed prompt in English for an image generation model." }
                    },
                    required: ['platform', 'contentType', 'title', 'content', 'hashtags', 'cta', 'imagePrompt']
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
    const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);
    const prompt = `You are a world-class social media copywriter. Refine the following post content to maximize engagement and impact, while preserving its core message. The output should ONLY be the refined text, without any introductory phrases, explanations, or quotes.\n\nOriginal content:\n"""${postText}"""`;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    return response.text;
};

export const generateBrandProfile = async (idea: string, language: string, model: string): Promise<BrandInfo> => {
    const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);
    const prompt = `\nYou are an expert brand strategist. Based on the user's business idea, generate a concise and compelling brand profile IN ${language}.\nBusiness Idea:\n"${idea}"\n\nGenerate a JSON object with the following fields in ${language}:\n- name: A creative and fitting brand name.\n- mission: A powerful, one-sentence mission statement.\n- values: A comma-separated string of 4-5 core brand values.\n- audience: A brief description of the target audience.\n- personality: 3-4 keywords describing the brand's personality.\n`;
    const response = await geminiFetchWithRetry(() =>
        ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: brandInfoSchema }
        })
    );
    const jsonText = response.text;
    if (!jsonText) throw new Error("Received empty response from AI.");
    return sanitizeAndParseJson(jsonText) as BrandInfo;
};

export const generateBrandKit = async (brandInfo: BrandInfo, language: string, model: string): Promise<Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'>> => {
    const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);
     const prompt = `\nYou are SocialSync Pro, an AI-powered brand launch assistant. Your task is to generate a complete and professional set of branding and social media assets IN ${language}, based on the user's input.\n\nBrand Input (in ${language}):\n- Brand Name: ${brandInfo.name}\n- Brand Mission: ${brandInfo.mission}\n- Brand Values: ${brandInfo.values}\n- Target Audience: ${brandInfo.audience}\n- Brand Personality: ${brandInfo.personality}\n\nGenerate the following assets IN ${language}:\n1.  **Brand Foundation**\n: Summarize the core identity. All subsequent generations must be perfectly aligned with this foundation.\n2.  **Core Media Assets**\n: Create logo concepts (prompts for an image generation model), a 4-color palette, and font recommendations. Logo prompts must be in English.\n3.  **Unified Profile Assets**\n: Create a single set of assets for use across all platforms (account name, username, profile picture prompt, cover photo prompt). Image prompts must be in English.\n4.  **Initial 1-Month Media Plan**\n: Generate a 4-week media plan designed for a brand launch. It should have a clear theme for each week. Create 4 posts per week, distributed across YouTube, Facebook, Instagram, TikTok, and Pinterest. Ensure every post includes a detailed, English image prompt.\n`;
    const response = await geminiFetchWithRetry(() =>
        ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: brandKitResponseSchema }
        })
    );
    const jsonText = response.text;
    if (!jsonText) throw new Error("Received empty response from AI.");
    const parsedJson = sanitizeAndParseJson(jsonText);

    if (!parsedJson.brandFoundation || !parsedJson.coreMediaAssets || !parsedJson.unifiedProfileAssets || !parsedJson.mediaPlan) {
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
                    imageKey: post.imagePrompt ? `media_plan_post_${postId}` : undefined,
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
    persona: Persona | null
): Promise<MediaPlanGroup> => {
    const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);

    const personaInstruction = persona ? `\n**KOL/KOC Persona (Crucial):**\nAll content MUST be generated from the perspective of the following KOL/KOC. They are the face of this campaign.\n- **Nickname:** ${persona.nickName}\n- **Main Style:** ${persona.mainStyle}\n- **Field of Activity:** ${persona.activityField}\n- **Detailed Description (for image generation):** ${persona.outfitDescription}\n- **Tone:** The content's tone must perfectly match this persona's style.\n- **Image Prompts (VERY IMPORTANT):** Every single 'imagePrompt' value you generate MUST start with the exact "Detailed Description" provided above, followed by a comma and then a description of the scene. The structure must be: "${persona.outfitDescription}, [description of the scene]". For example: "${persona.outfitDescription}, unboxing a product in a minimalist apartment...".\n` : '';

    const prompt = `You are SocialSync Pro, an AI-powered brand launch assistant. Your task is to generate a 1-Month Media Plan IN ${language} based on the provided Brand Foundation and User Goal.\nThe output must be a single, valid JSON object that strictly adheres to the provided schema. Do not add any commentary or text outside of the JSON structure.\n\n**Brand Foundation (Use this as your guide):**\n- Brand Name: ${brandFoundation.brandName}\n- Mission: ${brandFoundation.mission}\n- USP: ${brandFoundation.usp}\n- Values: ${(brandFoundation.values || []).join(', ')}\n- Target Audience: ${brandFoundation.targetAudience}\n- Personality: ${brandFoundation.personality}\n\n${personaInstruction}\n\n**User's Goal for the Plan:**\n"${userPrompt}"\n\n**Content Customization Instructions:**\n- **Tone of Voice**\n: Generate all content with a '${options.tone}' tone.\n- **Writing Style**\n: The primary style should be '${options.style}'.\n- **Post Length**\n: Adhere to a '${options.length}' post length. For example, 'Short' is suitable for Instagram captions (2-4 sentences), 'Medium' for Facebook (1-2 paragraphs), and 'Long' could be a detailed script or a mini-blog post.\n- **Emojis**\n: ${options.includeEmojis ? "Use emojis appropriately to enhance engagement and match the brand personality." : "Do not use any emojis."}\n\nBased on the Brand Foundation, User's Goal, and Customization Instructions, generate a complete 4-week media plan group.\n- **Name**\n: First, create a short, descriptive title for this entire plan based on the User's Goal (e.g., "Q3 Product Launch", "Summer Eco-Friendly Campaign").\n- **Plan Structure**\n: The plan must have 4 weekly objects. Each week must have a clear 'theme' (e.g., "Week 1: Brand Introduction & Values").\n- **Content**\n: The entire 4-week plan must contain a total of approximately ${totalPosts} posts, distributed logically across the 4 weeks. The number of posts per week can vary if it makes thematic sense, but the total must be close to ${totalPosts}. The posts should be distributed *only* across the following selected platforms: ${selectedPlatforms.join(', ')}. Do not generate content for any other platform not in this list.\n- **Post Details**\n: Each post object must be complete and ready-to-use, containing:\n    -   platform: The target platform. It MUST be one of the selected platforms: ${selectedPlatforms.map(p => `'${p}'`).join(', ')}.\n    -   contentType: e.g., "Image Post", "Video Idea", "Story", "Carousel Post".\n    -   title: An SEO-friendly title or headline.\n    -   content: The full caption, description, or script. This must be engaging and reflect the brand personality and customization instructions.\n    -   hashtags: An array of relevant and trending hashtags.\n    -   cta: A clear call-to-action (e.g., "Shop Now", "Learn More", "Comment below").\n    -   imagePrompt: A detailed, English-language prompt for an image generation model.\n- **Important Content Formatting Rules**\n:\n    - The 'content' field for any post must be the final, user-facing text (e.g., a caption, script, or description).\n    - For Instagram 'Carousel Post' types, the 'content' field should be a single, cohesive caption for the entire carousel. It must NOT include markers like "Slide 1:", "Slide 2:", etc. The caption should introduce the carousel and encourage users to swipe.\n    - The 'content' field must be clean and ready for publishing. It must NOT contain any extraneous data, especially numerical arrays or references like "[3, 6, 8]".\n- **Consistency**\n: The entire media plan must be thematically consistent with the Brand Foundation.\n`;

    const config: any = {
        systemInstruction: affiliateContentKitSystemInstruction,
    };
    if (useSearch) {
        config.tools = [{googleSearch: {}}];
    } else {
        config.responseMimeType = "application/json";
    }

    const response = await geminiFetchWithRetry(() =>
        ai.models.generateContent({
            model: model,
            contents: prompt,
            config,
        })
    );
    let jsonText = response.text;
    if (!jsonText) throw new Error("Received empty response from AI.");

    if (useSearch) {
        let extractedJson = jsonText.trim();
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
        jsonText = extractedJson;
    }

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
            } as MediaPlanPost;
        }),
    }));

    return {
        id: crypto.randomUUID(),
        name: planName || userPrompt.substring(0, 30),
        prompt: userPrompt,
        plan: planWithEnhancements,
        source: 'wizard',
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || [],
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
    const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);
    const fullPrompt = `${prompt}${promptSuffix ? `, ${promptSuffix}` : ''}`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateImagePromptForPost = async (
    postContent: { title: string; content: string },
    brandFoundation: BrandFoundation,
    language: string,
    model: string,
    persona: Persona | null
): Promise<string> => {
    const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);

    const personaInstruction = persona ? `\nThe image MUST feature the following persona:\n- Nickname: ${persona.nickName}\n- Main Style: ${persona.mainStyle}\n- Field of Activity: ${persona.activityField}\n- Detailed Description: ${persona.outfitDescription}\n\nIMPORTANT: The prompt you generate MUST start with the exact "Detailed Description" above, followed by a comma, then the scene description. The structure must be: "${persona.outfitDescription}, [description of the scene]".\n` : '';

    const prompt = `\nYou are a creative visual director for the brand "${brandFoundation.brandName}".\nThe brand's personality is: ${brandFoundation.personality}.\n${personaInstruction}\nBased on the following social media post content (in ${language}), generate a single, detailed, and compelling image generation prompt.\nThe prompt MUST BE IN ENGLISH.\nThe prompt should be a single paragraph describing a visual scene that captures the essence of the post.\nDo not add any explanations, labels, or extra text. Output ONLY the prompt.\n\nPost Title: "${postContent.title}"\nPost Content: "${postContent.content}"\n`;
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    return response.text;
};

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
    
    const productDetails = products.map(p => 
        `- Product Name: ${p.productName}\n  - Price: ${p.price}\n  - Promotion Link: ${p.promotionLink || p.productLink}`
    ).join('\n');

    const prompt = `\nYou are the social media manager for the brand "${brandFoundation.brandName}", which has a "${brandFoundation.personality}" personality. Your task is to write a comment for a social media post, from the perspective of the page admin.\n\n**Primary Goal:** Write a natural, human-like comment that subtly promotes one or more affiliate products related to the post. The comment must encourage clicks on the affiliate link.\n\n**Rules:**\n1.  **Natural Tone:** The comment must sound like a real person, not an ad. It should match the tone of the original post. Avoid overly salesy language.\n2.  **Two-Part Structure:** The comment MUST consist of two parts, separated by a blank line:\n    *   **Part 1 (Caption):** A short, engaging caption. This caption must cleverly connect the original post's topic with the product(s) being promoted. It should add value, share a personal tip, or ask a question to spark conversation and make people curious about the link.\n    *   **Part 2 (Links):** The affiliate link(s) for the product(s). If there is more than one product, list each link on a new line. Do not add any text before or after the links in this part.\n3.  **Language:** The entire comment MUST be in ${language}.\n\n**Original Post Content:**\n- Title: ${post.title}\n- Content: ${post.content}\n\n**Affiliate Product(s) to Promote:**\n${productDetails}\n\n**Example Output:**\nMình thấy nhiều bạn hỏi về [related_topic], em này đúng là chân ái luôn, giải quyết được đúng vấn đề đó. Dùng cực thích!\n\nhttps://your-affiliate-link.com\n\n---\nNow, generate the comment based on the provided post and product details. Output ONLY the comment text.\n`;
    const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    return response.text;
};

export const generateViralIdeas = async (
    trend: { topic: string; keywords: string[] },
    language: string,
    useSearch: boolean,
    model: string
): Promise<Omit<Idea, 'id' | 'trendId'>[]> => {
    const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);
    let prompt = `You are a viral marketing expert and a world-class creative strategist.\nYour task is to generate 5 highly engaging and potentially viral content ideas based on a given topic and related keywords.\nThe ideas must be in ${language}.\nEach idea must have:\n1.  A catchy, curiosity-driven 'title'.\n2.  A short but comprehensive 'description' of the idea.\n3.  A specific 'targetAudience' that this idea would appeal to.\n\nTopic: "${trend.topic}"\nKeywords: ${trend.keywords.join(', ')}\n`;
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

    const response = await geminiFetchWithRetry(() =>
        ai.models.generateContent({
            model: model,
            contents: prompt,
            config,
        })
    );
    let jsonText = response.text;
    if (!jsonText) throw new Error("Received empty response from AI for viral ideas.");

    if (useSearch) {
        let extractedJson = jsonText.trim();
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
        jsonText = extractedJson;
    }
    
    return sanitizeAndParseJson(jsonText);
};

export const generateContentPackage = async (
    idea: Idea,
    brandFoundation: BrandFoundation,
    language: string,
    affiliateContentKit: string,
    model: string,
    persona: Persona | null,
    pillarPlatform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest',
    options: { tone: string; style: string; length: string; }
): Promise<MediaPlanGroup> => {
    const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);

    const personaInstruction = persona ? `\n**KOL/KOC Persona (Crucial):**\nAll content MUST be generated from the perspective of the following KOL/KOC.\n- **Nickname:** ${persona.nickName}\n- **Main Style:** ${persona.mainStyle}\n- **Field of Activity:** ${persona.activityField}\n- **Tone:** The content's tone must perfectly match this persona's style.\n` : '';

    const customizationInstruction = `\n**Content Customization Instructions:**\n- **Tone of Voice**\n: Generate all content with a '${options.tone}' tone.\n- **Writing Style**\n: The primary style should be '${options.style}'.\n- **Post Length**\n: Adhere to a '${options.length}' post length.\n`;

    // 1. Generate Pillar Content
    const pillarPrompt = `\n    ${personaInstruction}\n    ${customizationInstruction}\n    Based on the idea "${idea.title}", create a comprehensive, 'pillar' content piece for ${pillarPlatform}.\n    This should be a detailed, authoritative piece that provides significant value to the target audience: ${idea.targetAudience}.\n    - If ${pillarPlatform} is YouTube, provide a detailed video script and a separate, SEO-optimized 'description' for the YouTube description box.\n    - If ${pillarPlatform} is Facebook, provide a long-form, engaging post like a mini-article.\n    - If ${pillarPlatform} is Instagram, provide a detailed multi-slide carousel post concept, including content for each slide and a main caption.\n    - If ${pillarPlatform} is Pinterest, provide a concept for a detailed infographic or a guide pin, including all text content needed.\n    - If ${pillarPlatform} is TikTok, provide a script for a multi-part (2-3 videos) series.\n    The output must be a single JSON object with: title, content, ${pillarPlatform === 'YouTube' ? 'description, ' : ''}hashtags, and cta.\n    Language: ${language}.\n    `;
    const pillarResponse = await ai.models.generateContent({
        model, contents: pillarPrompt,
        config: { systemInstruction: affiliateContentKit, responseMimeType: 'application/json' }
    });
    const rawPillarPost = sanitizeAndParseJson(pillarResponse.text);
    const pillarPost = normalizePillarContent(rawPillarPost);


    // 2. Generate Repurposed Content
    const allPlatforms: ('YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest')[] = ['YouTube', 'Facebook', 'Instagram', 'TikTok', 'Pinterest'];
    const repurposedPlatforms = allPlatforms.filter(p => p !== pillarPlatform);

    const repurposedPrompt = `\n    ${personaInstruction}\n    ${customizationInstruction}\n    **Context:** The following is a large "pillar" content piece about "${idea.title}" created for ${pillarPlatform}.\n    Pillar Content: "${pillarPost.content}"\n    **Your Task:** Repurpose the core message of the pillar content into one smaller, standalone post for EACH of the following platforms: ${repurposedPlatforms.join(', ')}.\n    Each new piece must be completely rewritten and tailored for its specific platform's format and audience. They must be relevant to the original pillar content.\n    - For short-form video platforms (TikTok, Instagram), create a concise video script or reel idea.\n    - For image-based platforms (Instagram, Pinterest), create a compelling caption for an image or carousel.\n    - For text-based platforms (Facebook), create an engaging post that summarizes or expands on a key point from the pillar content.\n    - If the pillar content is a long text post and you need to generate a YouTube idea, create a script outline for a short video based on the text.\n    The output must be an array of ${repurposedPlatforms.length} JSON objects, each with: platform (must be one of ${repurposedPlatforms.join(', ')}), contentType, title, content, hashtags, and cta.\n    Language: ${language}.\n    `;
    const repurposedResponse = await ai.models.generateContent({
        model, contents: repurposedPrompt,
        config: { systemInstruction: affiliateContentKit, responseMimeType: 'application/json' }
    });
    const rawRepurposed = sanitizeAndParseJson(repurposedResponse.text);
    let repurposedPosts: Omit<MediaPlanPost, 'id'|'status'>[] = normalizeArrayResponse(rawRepurposed, 'post');

    // Normalize hashtags for each repurposed post
    repurposedPosts = repurposedPosts.map(post => {
        const p = { ...post };
        if (typeof p.hashtags === 'string') {
            p.hashtags = (p.hashtags as any).split(/[, ]+/)
                .map((h: string) => h.trim())
                .filter(Boolean)
                .map((h: string) => h.startsWith('#') ? h : `#${h}`);
        } else if (!Array.isArray(p.hashtags)) {
            p.hashtags = [];
        }
        return p;
    });


    // 3. Assemble the package into a MediaPlanGroup
    const allPosts: Omit<MediaPlanPost, 'id'|'status'>[] = [
        {
            ...(pillarPost as any),
            platform: pillarPlatform,
            isPillar: true,
        },
        ...repurposedPosts.map(p => ({
            ...p,
            isPillar: false,
        }))
    ];

    // 4. Generate image prompts for all posts
    const postsWithPrompts = await Promise.all(
        allPosts.map(async (post) => {
            try {
                const newPrompt = await generateImagePromptForPost(
                    { title: post.title, content: post.content },
                    brandFoundation,
                    language,
                    model,
                    persona
                );
                return { ...post, imagePrompt: newPrompt };
            } catch (e) {
                console.error(`Failed to generate image prompt for post: ${post.title}`, e);
                return post; // Return original post on error
            }
        })
    );


    const finalPosts = postsWithPrompts.map(p => ({
        ...p,
        id: crypto.randomUUID(),
        status: 'draft',
    } as MediaPlanPost));


    const plan: MediaPlan = [{
        week: 1,
        theme: `Content Package: ${idea.title}`,
        posts: finalPosts
    }];

    return {
        id: crypto.randomUUID(),
        name: idea.title,
        prompt: idea.description,
        plan: plan,
        source: 'content-package',
        personaId: persona?.id,
    };
};

// --- NEW FACEBOOK STRATEGY FUNCTIONS ---

export const generateFacebookTrends = async (
    industry: string,
    language: string,
    model: string
): Promise<Omit<FacebookTrend, 'id'|'brandId'>[]> => {
    const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);
    const prompt = `You are a Facebook marketing expert. Analyze Google Search results for the query "trending topics and content formats in ${industry} on Facebook for ${language}".\nIdentify 3-5 distinct, current trends. For each trend, provide:\n1.  A concise 'topic'.\n2.  An array of relevant 'keywords'.\n3.  A brief 'analysis' explaining why it's trending for the target audience on Facebook and what content formats (e.g., Reels, Carousels, Long-form posts) are performing best.\n4.  The top 3 most relevant 'links' from the search results that support your analysis. Each link must be an object with "uri" and "title" keys.\n\nYour response must be a single, valid JSON array of objects. Each object should have the keys: "topic", "keywords", "analysis", and "links". Do not add any text or explanation before or after the JSON array.`;

    const response = await geminiFetchWithRetry(() =>
        ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        })
    );
    let jsonText = response.text;
    if (!jsonText) throw new Error("Received empty response from AI for Facebook trends.");

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
    jsonText = extractedJson;

    const trendsData = sanitizeAndParseJson(jsonText);
    return (trendsData || []).map((trend: any) => ({ ...trend, createdAt: new Date().toISOString() }));
};

export const generatePostsForFacebookTrend = async (
    trend: FacebookTrend,
    language: string,
    model: string
): Promise<Omit<FacebookPostIdea, 'id' | 'trendId'>[]> => {
    const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);
    const prompt = `You are a creative Facebook content strategist. Based on the following trend, generate 5 engaging Facebook post ideas in ${language}.\nFor each idea, provide:\n1.  A catchy 'title'.\n2.  The main 'content' for the post, optimized for Facebook's platform.\n3.  A detailed English 'imagePrompt' for an accompanying visual.\n4.  A strong 'cta' (call to action).\n\nTrend Topic: "${trend.topic}"\nTrend Keywords: ${trend.keywords.join(', ')}\nTrend Analysis: ${trend.analysis}\n`;
    const postsSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                cta: { type: Type.STRING },
            },
            required: ['title', 'content', 'imagePrompt', 'cta'],
        },
    };

    const response = await geminiFetchWithRetry(() =>
        ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: postsSchema,
            }
        })
    );
    const jsonText = response.text;
    if (!jsonText) throw new Error("Received empty response from AI for Facebook post ideas.");
    return sanitizeAndParseJson(jsonText);
};