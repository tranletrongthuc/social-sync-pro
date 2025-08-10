import { GoogleGenAI } from "@google/genai";
import { sanitizeAndParseJson, normalizeMediaPlanGroupResponse, normalizePillarContent, normalizeArrayResponse } from './geminiService';
import type { BrandInfo, GeneratedAssets, MediaPlan, BrandFoundation, MediaPlanGroup, MediaPlanPost, AffiliateLink, Persona, Idea, PostStatus } from '../types';

const openrouterFetch = async (body: object, retries = 3, initialDelay = 1000) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OpenRouter API key is not configured. Please set it in the Integrations panel.");
    }

    const siteUrl = window.location.href;
    const siteTitle = document.title || "SocialSync Pro";
    
    let lastError: Error | null = null;
    let delay = initialDelay;
    let rateLimitRetries = 1; // Set to 1 rate limit wait
    const baseWaitSeconds = 61; // Base wait time

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": siteUrl,
                    "X-Title": siteTitle,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                window.dispatchEvent(new CustomEvent('rateLimitWaitClear'));
                return await response.json(); // Success! 
            }
            
            // Handle non-OK responses
            let errorData;
            let message = response.statusText;
            try {
                errorData = await response.json();
                message = errorData.error?.message || message;
            } catch (e) {
                // The error response wasn't valid JSON. Use the status text.
                console.warn("OpenRouter error response was not valid JSON.");
            }

            // Handle 429 Rate Limit specifically
            if (response.status === 429) {
                if (rateLimitRetries > 0) {
                    rateLimitRetries--;
                    // Add some randomization to avoid consistent rate limiting
                    const waitSeconds = baseWaitSeconds + Math.floor(Math.random() * 30); // 61-90 seconds
                    lastError = new Error(`OpenRouter rate limit hit (1 req/min).`);
                    console.warn(`${lastError.message} Waiting ${waitSeconds}s before retrying. (${rateLimitRetries} waits remaining)`);
                    
                    window.dispatchEvent(new CustomEvent('rateLimitWait', { 
                        detail: { service: 'OpenRouter', seconds: waitSeconds, attempt: (5 - rateLimitRetries), total: 5 } 
                    }));

                    await new Promise(res => setTimeout(res, waitSeconds * 1000));
                    i--; // This was a rate limit wait, not a failure retry, so don't increment i.
                    continue;
                } else {
                    lastError = new Error('OpenRouter rate limit persisted for over 5 minutes.');
                    break; // Exit the loop if we've been rate-limited too many times.
                }
            }

            const isProviderError = message.includes("Provider returned error");
            const isRetryableStatus = response.status >= 500;

            if (isProviderError || isRetryableStatus) {
                lastError = new Error(`OpenRouter returned a retryable error: ${response.status} ${message}`);
                console.warn(`${lastError.message}. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
                continue; // Next retry
            }

            // For non-retryable client-side errors (4xx), fail immediately.
            lastError = new Error(`OpenRouter API Error: ${message}`);
            throw lastError;

        } catch (error) {
            // This catches network errors or errors thrown from the non-retryable handler.
            lastError = error instanceof Error ? error : new Error('An unknown network error occurred');
            
            // If it was a non-retryable API error that we chose to throw, don't retry, just re-throw.
            if (lastError.message.startsWith('OpenRouter API Error:')) {
                throw lastError;
            }

            // Otherwise, it was a network error, so we can retry.
            if (i < retries - 1) {
                console.warn(`A network error occurred during OpenRouter fetch: ${lastError.message}. Retrying in ${delay / 1000}s...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            }
        }
    }

    // If all retries fail, clear any waiting message and throw the last captured error.
    window.dispatchEvent(new CustomEvent('rateLimitWaitClear'));
    throw new Error(`OpenRouter request failed after multiple attempts. Last error: ${lastError?.message}`);
};

const parseOpenRouterResponse = (response: any): string => {
    if (response.choices && response.choices.length > 0 && response.choices[0].message?.content) {
        let content = response.choices[0].message.content;

        // Remove any <think>...</think> tags and their content
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '');

        // Try to extract content within ```json...``` markdown blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            return jsonMatch[1].trim();
        }

        // If no markdown block, try to find the first { and last } to extract JSON
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            return content.substring(firstBrace, lastBrace + 1).trim();
        }
        
        // Fallback to trimming the content if no JSON structure is clearly found
        return content.trim();
    }
    throw new Error("Received an invalid or empty response from OpenRouter.");
};

export const refinePostContentWithOpenRouter = async (postText: string, model: string): Promise<string> => {
    const prompt = `You are a world-class social media copywriter. Refine the following post content to maximize engagement and impact, while preserving its core message. The output should ONLY be the refined text, without any introductory phrases, explanations, or quotes.

Original content:
"""${postText}"""`;

    // This function now only handles non-Gemini (i.e., OpenRouter) models
    const response = await openrouterFetch({
        model: model,
        messages: [
            { role: "user", content: prompt }
        ]
    });

    if (response.choices && response.choices.length > 0 && response.choices[0].message?.content) {
        let content = response.choices[0].message.content;

        const thinkTagEnd = content.indexOf('</think>');
        if (thinkTagEnd !== -1) {
            content = content.substring(thinkTagEnd + '</think>'.length);
        }
        
        return content.trim();
    }

    throw new Error("Received an invalid response from OpenRouter.");
};

export const generateBrandProfileWithOpenRouter = async (idea: string, language: string, model: string): Promise<BrandInfo> => {
    const prompt = `
You are an expert brand strategist. Based on the user's business idea, generate a concise and compelling brand profile IN ${language}.
The output must be a single, valid JSON object. Do not add any commentary or text outside of the JSON structure.

Business Idea:
"${idea}"

Generate the following brand profile fields in ${language}:
- **name**: A creative and fitting brand name.
- **mission**: A powerful, one-sentence mission statement.
- **values**: A comma-separated string of 4-5 core brand values.
- **audience**: A brief description of the target audience.
- **personality**: 3-4 keywords describing the brand's personality.
`;
    const openRouterPrompt = `${prompt}

You MUST respond with a single, valid JSON object. Do not add any text or explanation before or after the JSON object.`;
    const response = await openrouterFetch({
        model: model,
        messages: [{ role: 'user', content: openRouterPrompt }],
        response_format: { "type": "json_object" },
    });
    const jsonText = parseOpenRouterResponse(response);
    
    if (!jsonText) {
        throw new Error("Received an empty response from the AI. This could be due to content filtering or an internal error. Please try adjusting your prompt.");
    }

    try {
        return sanitizeAndParseJson(jsonText) as BrandInfo;
    } catch (e) {
        console.error("Failed to parse AI JSON response:", jsonText);
        throw new Error("The AI returned a malformed or unexpected response. Please try again.");
    }
};

export const generateBrandKitWithOpenRouter = async (brandInfo: BrandInfo, language: string, model: string): Promise<Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'>> => {
    const prompt = `
You are SocialSync Pro, an AI-powered brand launch assistant. Your task is to generate a complete and professional set of branding and social media assets IN ${language}, based on the user's input.
The output must be a single, valid JSON object that strictly adheres to the provided schema. Do not add any commentary or text outside of the JSON structure.

Brand Input (in ${language}):
- Brand Name: ${brandInfo.name}
- Brand Mission: ${brandInfo.mission}
- Brand Values: ${brandInfo.values}
- Target Audience: ${brandInfo.audience}
- Brand Personality: ${brandInfo.personality}

Generate the following assets IN ${language}:
1.  **Brand Foundation**: Summarize the core identity. All subsequent generations must be perfectly aligned with this foundation.
2.  **Core Media Assets**: Create logo concepts (prompts for an image generation model), a 4-color palette, and font recommendations. Logo prompts must be in English.
3.  **Unified Profile Assets**: Create a single set of assets for use across all platforms (account name, username, profile picture prompt, cover photo prompt). Image prompts must be in English.
4.  **Initial 1-Month Media Plan**: Generate a 4-week media plan designed for a brand launch. It should have a clear theme for each week. Create 4 posts per week, distributed across YouTube, Facebook, Instagram, TikTok, and Pinterest. Ensure every post includes a detailed, English image prompt.
`;
    const openRouterPrompt = `${prompt}

You MUST respond with a single, valid JSON object. Do not add any text or explanation before or after the JSON object.`;
    const response = await openrouterFetch({
        model: model,
        messages: [{ role: 'user', content: openRouterPrompt }],
        response_format: { "type": "json_object" },
    });
    const jsonText = parseOpenRouterResponse(response);
    
    if (!jsonText) {
        throw new Error("Received an empty response from the AI. This could be due to content filtering or an internal error. Please try adjusting your prompt.");
    }

    try {
        const parsedJson = sanitizeAndParseJson(jsonText);

        if (!parsedJson.brandFoundation || !parsedJson.coreMediaAssets || !parsedJson.unifiedProfileAssets || !parsedJson.mediaPlan) {
            console.error("AI response from OpenRouter is missing one or more root keys. Parsed JSON:", parsedJson);
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
        if(parsedJson.unifiedProfileAssets){
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
            };
        }
        
        const assets: Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'> = {
            brandFoundation: parsedJson.brandFoundation,
            coreMediaAssets: parsedJson.coreMediaAssets,
            unifiedProfileAssets: parsedJson.unifiedProfileAssets,
            mediaPlans: mediaPlanGroup ? [mediaPlanGroup] : [],
        };
        return assets;
    } catch (e) {
        console.error("Failed to parse AI JSON response:", jsonText);
        throw new Error("The AI returned a malformed or unexpected response. Please try again.");
    }
};

export const generateMediaPlanGroupWithOpenRouter = async (
    brandFoundation: BrandFoundation,
    userPrompt: string,
    language: string,
    totalPosts: number,
    selectedPlatforms: string[],
    options: { tone: string; style: string; length: string; includeEmojis: boolean; },
    affiliateContentKitSystemInstruction: string,
    model: string,
    persona: Persona | null,
    selectedProduct: AffiliateLink | null // Added this line
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

    const openRouterPrompt = `You are SocialSync Pro, an AI-powered brand launch assistant. Your task is to generate a 1-Month Media Plan IN ${language} based on the provided Brand Foundation and User Goal.
You MUST strictly follow the rules provided in the system instruction.
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
- **Tone of Voice**: Generate all content with a '${options.tone}' tone.
- **Writing Style**: The primary style should be '${options.style}'.
- **Post Length**: Adhere to a '${options.length}' post length. For example, 'Short' is suitable for Instagram captions (2-4 sentences), 'Medium' for Facebook (1-2 paragraphs), and 'Long' could be a detailed script or a mini-blog post.
            - **Emojis**: ${options.includeEmojis ? "Use emojis appropriately to enhance engagement and match the brand personality." : "Do not use any emojis."} 

Based on the Brand Foundation, User's Goal, and Customization Instructions, generate a complete 4-week media plan group.
- **Name**: First, create a short, descriptive title for this entire plan based on the User's Goal (e.g., "Q3 Product Launch", "Summer Eco-Friendly Campaign").
- **Plan Structure**: The plan must have 4 weekly objects. Each week must have a clear 'theme' (e.g., "Week 1: Brand Introduction & Values").
- **Content**: The entire 4-week plan must contain a total of approximately ${totalPosts} posts, distributed logically across the 4 weeks. The number of posts per week can vary if it makes thematic sense, but the total must be close to ${totalPosts}. The posts should be distributed *only* across the following selected platforms: ${selectedPlatforms.join(', ')}. Do not generate content for any other platform not in this list.
- **Post Details (CRITICAL):
    -   **contentType**: e.g., "Image Post", "Video Idea", "Story", "Carousel Post", "Shorts Idea".
    -   **content**: This is ALWAYS the user-facing text caption for the post.
    -   **script**: For video contentTypes ("Video Idea", "Shorts Idea", "Story"), this field MUST contain the video script, storyboard, or detailed scene-by-scene description. For non-video posts, this should be null.
    -   **mediaPrompt**: This is the prompt for the visual media. It MUST be in English.
        -   For "Image Post": A single, detailed DALL-E prompt to generate the image.
        -   For "Video Idea", "Shorts Idea", "Story": A concise, one-paragraph summary of the visual concept, suitable for a text-to-video model.
        -   For "Carousel Post": An array of detailed, English DALL-E prompts, one for each image in the carousel (2-5 prompts).
- **Consistency**: The entire media plan must be thematically consistent with the Brand Foundation.

**JSON Schema for Media Plan Group (Strictly Adhere to This:)**
\\\`\\\`\\\`json
{
  "type": "object",
  "properties": {
    "name": { "type": "string", "description": "A short, descriptive title for the media plan." },
    "plan": {
      "type": "array",
      "description": "An array of weekly media plan objects.",
      "items": {
        "type": "object",
        "properties": {
          "week": { "type": "integer", "description": "The week number (1-4)." },
          "theme": { "type": "string", "description": "The thematic focus for the week." },
          "posts": {
            "type": "array",
            "description": "An array of social media posts for the week.",
            "items": {
              "type": "object",
              "properties": {
                "platform": { "type": "string", "enum": ["YouTube", "Facebook", "Instagram", "TikTok", "Pinterest"] },
                "contentType": { "type": "string" },
                "title": { "type": "string" },
                "content": { "type": "string" },
                "hashtags": { "type": "array", "items": { "type": "string" } },
                "cta": { "type": "string" },
                "mediaPrompt": { "type": ["string", "array"], "items": { "type": "string" }, "description": "A detailed prompt for the media content. Can be a string or an array of strings for carousels." },
                "script": { "type": "string", "description": "A detailed script for video content." }
              },
              "required": ["platform", "contentType", "title", "content", "hashtags", "cta", "mediaPrompt"]
            }
          }
        },
        "required": ["week", "theme", "posts"]
      }
    }
  },
  "required": ["name", "plan"]
}
\\\`\\\`\\\`

**KOL/KOC Persona (Crucial):
All content MUST be generated from the perspective of the following KOL/KOC. They are the face of this campaign.
- **Nickname:** ${persona.nickName}
- **Main Style:** ${persona.mainStyle}
- **Field of Activity:** ${persona.activityField}
- **Detailed Description:** ${persona.outfitDescription}

IMPORTANT: For image prompts, the prompt you generate MUST start with the exact "Detailed Description" above, followed by a comma, then the scene description. The structure must be: "${persona.outfitDescription}, [description of the scene]" 
- **Tone:** The content's tone must perfectly match this persona's style.
`;

    const response = await openrouterFetch({
        model: model,
        messages: [
            { role: 'system', content: affiliateContentKitSystemInstruction },
            { role: 'user', content: openRouterPrompt }
        ],
        response_format: { "type": "json_object" },
    });
    
    const jsonText = parseOpenRouterResponse(response);
    if (!jsonText) throw new Error("Received empty response from OpenRouter.");
    
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
                promotedProductIds: selectedProduct ? [selectedProduct.id] : [],
            } as MediaPlanPost;
        }),
    }));

    return {
        id: crypto.randomUUID(),
        name: (planName && planName !== 'Untitled Plan') ? planName : (selectedProduct ? `Promotion Plan: ${selectedProduct.productName}` : userPrompt.substring(0, 30)),
        prompt: userPrompt,
        plan: planWithEnhancements,
        source: 'wizard',
        sources: groundedContent?.map((c: any) => ({ uri: c.url, title: c.title })) || [],
        personaId: persona?.id,
    };
};

export const generateMediaPromptForPostWithOpenRouter = async (
    postContent: { title: string; content: string; contentType: string },
    brandFoundation: BrandFoundation,
    language: string,
    model: string,
    persona: Persona | null
): Promise<string | string[]> => {
    
    const personaInstruction = persona ? `
**KOL/KOC Persona (Crucial):**
All content MUST be generated from the perspective of the following KOL/KOC.
- **Nickname:** ${persona.nickName}
- **Main Style:** ${persona.mainStyle}
- **Field of Activity:** ${persona.activityField}
- **Detailed Description (for image generation):** ${persona.outfitDescription}
- **Tone:** The content's tone must perfectly match this persona's style.
- **Image Prompts (VERY IMPORTANT):** Every single 'imagePrompt' value you generate MUST start with the exact "Detailed Description" provided above, followed by a comma and then a description of the scene. The structure must be: "${persona.outfitDescription}, [description of the scene]".
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
            prompt += `Generate a single, detailed DALL-E prompt to generate the image.`;
            break;
        case 'Video Idea':
        case 'Shorts Idea':
        case 'Story':
            prompt += `Generate a concise, one-paragraph summary of the visual concept, suitable for a text-to-video model.`;
            break;
        case 'Carousel Post':
            prompt += `Generate an array of detailed, English DALL-E prompts, one for each image in the carousel (2-5 prompts). The output should be a JSON array of strings.`;
            break;
        default:
            prompt += `Generate a single, detailed DALL-E prompt to generate the image.`;
            break;
    }

    const response = await openrouterFetch({
        model: model,
        messages: [{ role: 'user', content: prompt }]
    });
    const text = parseOpenRouterResponse(response);
    
    if (!text) {
        return `A visually appealing image representing the concept of "${postContent.title}" in a style that is ${brandFoundation.personality}.`;
    }

    if (postContent.contentType === 'Carousel Post') {
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse carousel prompts, returning as single string:", text);
            return text;
        }
    }

    return text;
};

export const generateAffiliateCommentWithOpenRouter = async (
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
        `- Product Name: ${p.productName}
  - Price: ${p.price}
  - Product Link: ${p.productLink}`
    ).join('\n');

    const prompt = `
You are the social media manager for the brand "${brandFoundation.brandName}", which has a "${brandFoundation.personality}" personality. Your task is to write a comment for a social media post, from the perspective of the page admin.

**Primary Goal:** Write a natural, human-like comment that subtly promotes one or more affiliate products related to the post. The comment must encourage clicks on the affiliate link.

**Rules:**
1.  **Natural Tone:** The comment must sound like a real person, not an ad. It should match the tone of the original post. Avoid overly salesy language.
2.  **Two-Part Structure:** The comment MUST consist of two parts, separated by a blank line:
    *   **Part 1 (Caption):** A short, engaging caption. This caption must cleverly connect the original post's topic with the product(s) being promoted. It should add value, share a personal tip, or ask a question to spark conversation and make people curious about the link.
    *   **Part 2 (Links):** The affiliate link(s) for the product(s). If there is more than one product, list each link on a new line. Do not add any text before or after the links in this part.
3.  **Language:** The entire comment MUST be in ${language}.

**Original Post Content:**
- Title: ${post.title}
- Content: ${post.content}

**Affiliate Product(s) to Promote:**
${productDetails}

**Example Output:**
Mình thấy nhiều bạn hỏi về [related_topic], em này đúng là chân ái luôn, giải quyết được đúng vấn đề đó. Dùng cực thích!

https://your-affiliate-link.com

---
Now, generate the comment based on the provided post and product details. Output ONLY the comment text.
`;

    const response = await openrouterFetch({
        model: model,
        messages: [{ role: 'user', content: prompt }]
    });
    const text = parseOpenRouterResponse(response);
    
    if (!text) {
        throw new Error("AI failed to generate a comment.");
    }
    return text;
};

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const generateImageWithOpenRouter = async (
    prompt: string, 
    promptSuffix: string,
    model: string,
    aspectRatio: "1:1" | "16:9" = "1:1",
    productImages: File[] = []
): Promise<string> => {
    if (!prompt || prompt.trim() === '') {
        throw new Error("Prompt cannot be empty for OpenRouter image generation.");
    }
    if (!(window as any).process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY not set. Please set it in the Integrations panel.");
    }
    
    const messages: any[] = [];
    const userContent: any[] = [];
    
    const NEGATIVE_PROMPT = ', no text, text-free, no typography, no writing, no letters, no words, text overlay';
    const instructionText = `Generate a single, high-quality image based on the following description. The response must be a valid JSON object containing one key: "b64_json", which holds the base64 encoded string of the generated JPEG image.

Description (aspect ratio ${aspectRatio}): "${prompt}${promptSuffix ? `, ${promptSuffix}` : ''}${NEGATIVE_PROMPT}"`;
    
    userContent.push({ type: 'text', text: instructionText });
    
    if (productImages.length > 0) {
        const imagePromises = productImages.map(async (file) => {
            const dataUrl = await fileToDataUrl(file);
            return { type: 'image_url', image_url: { url: dataUrl } };
        });
        const imageContentParts = await Promise.all(imagePromises);
        userContent.push(...imageContentParts);
    }

    messages.push({ role: 'user', content: userContent });
    
    const response = await openrouterFetch({
        model: model,
        messages: messages,
        response_format: { "type": "json_object" },
    });
    
    const jsonText = parseOpenRouterResponse(response);
    
    try {
        const parsed = sanitizeAndParseJson(jsonText);
        if (parsed.b64_json) {
            return `data:image/jpeg;base64,${parsed.b64_json}`;
        } else {
            console.error("OpenRouter image gen response missing b64_json:", parsed);
            throw new Error("OpenRouter model did not return a base64 image in the expected format.");
        }
    } catch (e) {
        console.error("Failed to parse JSON response from OpenRouter for image generation:", jsonText);
        throw new Error("Failed to get a valid image from OpenRouter model.");
    }
};

export const generateViralIdeasWithOpenRouter = async (
    trend: { topic: string; keywords: string[] },
    language: string,
    model: string
): Promise<Omit<Idea, 'id' | 'trendId'>[]> => {
    if (!model || typeof model !== 'string' || model.trim() === '') {
        throw new Error("Cannot generate viral ideas with OpenRouter: No valid model was provided.");
    }
    const prompt = `You are a viral marketing expert and a world-class creative strategist.
Your task is to generate 5 highly engaging and potentially viral content ideas based on a given topic and related keywords.
The ideas must be in ${language}.
Your response MUST be a valid JSON array of objects. Each object must have the following keys:
- "title": A catchy, curiosity-driven 'title'.
- "description": A short but comprehensive 'description' of the idea.
- "targetAudience": A specific 'targetAudience' that this idea would appeal to.

Topic: "${trend.topic}"
Keywords: ${trend.keywords.join(', ')}
`;
    
    const openRouterPrompt = `${prompt}

You MUST respond with a single, valid JSON array, containing 5 idea objects. Do not add any text or explanation before or after the JSON object. The root of your response must be an array, like this: [ { "title": ... }, ... ]`;
    const response = await openrouterFetch({
        model: model,
        messages: [{ role: 'user', content: openRouterPrompt }],
        response_format: { "type": "json_object" },
    });
    const jsonText = parseOpenRouterResponse(response);
    
    if (!jsonText) {
        throw new Error("Received an empty response from OpenRouter for viral ideas.");
    }

    try {
        let fixedJsonText = jsonText.trim();
        if (fixedJsonText.startsWith('{')) {
            fixedJsonText = `[${fixedJsonText}]`;
        }
        const parsedJson = sanitizeAndParseJson(fixedJsonText);
        const validatedIdeas = normalizeArrayResponse<Omit<Idea, 'id'|'trendId'>>(parsedJson, 'idea');
        
        if (validatedIdeas.length === 0) {
            console.error("Failed to extract a valid array of ideas from OpenRouter response:", parsedJson);
            throw new Error("The AI from OpenRouter returned data in an unexpected structure.");
        }
        
        return validatedIdeas.slice(0, 5);
    } catch (e) {
        console.error("Failed to parse AI JSON response for viral ideas:", jsonText);
        throw new Error("The AI returned a malformed or unexpected response. This may be a temporary issue with the model. Please try again later or configure a different model in Settings.");
    }
};


export const generateContentPackageWithOpenRouter = async (
    idea: Idea,
    brandFoundation: BrandFoundation,
    language: string,
    affiliateContentKit: string,
    model: string,
    persona: Persona | null,
    pillarPlatform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest',
    options: { tone: string; style: string; length: string; },
    selectedProduct: AffiliateLink | null
): Promise<MediaPlanGroup> => {

    const personaInstruction = persona ? `
**KOL/KOC Persona (Crucial):**
All content MUST be generated from the perspective of the following KOL/KOC.
- **Nickname:** ${persona.nickName}
- **Main Style:** ${persona.mainStyle}
- **Field of Activity:** ${persona.activityField}
- **Detailed Description (for image generation):** ${persona.outfitDescription}
- **Tone:** The content's tone must perfectly match this persona's style.
- **Image Prompts (VERY IMPORTANT):** Every single 'imagePrompt' value you generate MUST start with the exact "Detailed Description" provided above, followed by a comma and then a description of the scene. The structure must be: "${persona.outfitDescription}, [description of the scene]". For example: "${persona.outfitDescription}, unboxing a product in a minimalist apartment...".
` : '';

    const productInstruction = selectedProduct ? `
**Affiliate Product to Feature (Crucial):**
- **Product Name:** ${selectedProduct.productName}
- **Product ID:** ${selectedProduct.id}
- **Instruction:** This entire content package is designed to subtly promote this specific product. All generated posts (both pillar and repurposed) MUST be related to this product and its benefits. For every single post you generate, you MUST include a 'promotedProductIds' field in the JSON object, and its value MUST be an array containing the string "${selectedProduct.id}".
` : '';

    const customizationInstruction = `
**Content Customization Instructions:**
- **Tone of Voice**: Generate all content with a '${options.tone}' tone.
- **Writing Style**: The primary style should be '${options.style}'.
- **Post Length**: Adhere to a '${options.length}' post length.
`;

    // 1. Generate Pillar Content
    const pillarPrompt = `
    ${personaInstruction}
    ${productInstruction}
    ${customizationInstruction}
    Based on the idea "${idea.title}", create a comprehensive, long-form 'pillar' content piece for ${pillarPlatform}.
    This should be a detailed, authoritative piece that provides significant value to the target audience: ${idea.targetAudience}.
    - If ${pillarPlatform} is YouTube, provide a detailed video script and a separate, SEO-optimized 'description' for the YouTube description box.
    - If ${pillarPlatform} is Facebook, provide a long-form, engaging post like a mini-article.
    - If ${pillarPlatform} is Instagram, provide a detailed multi-slide carousel post concept, including content for each slide and a main caption.
    - If ${pillarPlatform} is Pinterest, provide a concept for a detailed infographic or a guide pin, including all text content needed.
    - If ${pillarPlatform} is TikTok, provide a script for a multi-part (2-3 videos) series.
    The output must be a single JSON object with: title, content, ${pillarPlatform === 'YouTube' ? 'description, ' : ''}hashtags, and cta. Do NOT include an imagePrompt.
    Language: ${language}.
    You MUST respond with a single, valid JSON object.
    `;
    const pillarResponse = await openrouterFetch({
        model, 
        messages: [{ role: 'system', content: affiliateContentKit }, { role: 'user', content: pillarPrompt }],
        response_format: { "type": "json_object" },
    });
    const rawPillar = sanitizeAndParseJson(parseOpenRouterResponse(pillarResponse));
    const pillarPost = normalizePillarContent(rawPillar);

    // 2. Generate Repurposed Content
    const allPlatforms: ('YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Pinterest')[] = ['YouTube', 'Facebook', 'Instagram', 'TikTok', 'Pinterest'];
    const repurposedPlatforms = allPlatforms.filter(p => p !== pillarPlatform);

    const repurposedPrompt = `
    ${personaInstruction}
    ${productInstruction}
    ${customizationInstruction}
    **Context:** The following is a large "pillar" content piece about "${idea.title}" created for ${pillarPlatform}.
    Pillar Content: "${pillarPost.content}"
    **Your Task:** Repurpose the core message of the pillar content into one smaller, standalone post for EACH of the following platforms: ${repurposedPlatforms.join(', ')}.
    Each new piece must be completely rewritten and tailored for its specific platform's format and audience. They must be relevant to the original pillar content.
    - For short-form video platforms (TikTok, Instagram), create a concise video script or reel idea.
    - For image-based platforms (Instagram, Pinterest), create a compelling caption for an image or carousel.
    - For text-based platforms (Facebook), create an engaging post that summarizes or expands on a key point from the pillar content.
    - If the pillar content is a long text post and you need to generate a YouTube idea, create a script outline for a short video based on the text.
    Language: ${language}.

    **Output Format (Strictly Enforced):**
    Your response MUST be a single, valid JSON object. The root of this object must be a key named "posts", which contains an array of ${repurposedPlatforms.length} JSON objects.
    Each object in the "posts" array must have these keys: "platform" (must be one of ${repurposedPlatforms.join(', ')}), "contentType", "title", "content", "hashtags", and "cta". Do NOT include an "imagePrompt" key.
    
    Example structure:
    {
      "posts": [
        {
          "platform": "YouTube",
          "contentType": "Shorts Idea",
          "title": "...",
          "content": "...",
          "hashtags": ["...", "..."],
          "cta": "..."
        },
        {
          "platform": "Instagram",
          ...
        }
      ]
    }

    **Crucial Instructions:**
    - Do NOT respond with just a JSON array.
    - Do NOT respond with just a single post object.
    - The root of your response MUST be an object with a "posts" key.
    `;
    const repurposedResponse = await openrouterFetch({
        model, 
        messages: [{ role: 'system', content: affiliateContentKit }, { role: 'user', content: repurposedPrompt }],
        response_format: { "type": "json_object" },
    });
    
    const rawRepurposed = sanitizeAndParseJson(parseOpenRouterResponse(repurposedResponse));
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

    // 3. Assemble the package
    const allPosts: Omit<MediaPlanPost, 'id' | 'status'>[] = [
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

    // 4. Generate media prompts for all posts
    const postsWithPrompts = await Promise.all(
        allPosts.map(async (post) => {
            try {
                const newPrompt = await generateMediaPromptForPostWithOpenRouter(
                    { title: post.title, content: post.content, contentType: post.contentType },
                    brandFoundation,
                    language,
                    model,
                    persona
                );
                return { ...post, mediaPrompt: newPrompt };
            } catch (e) {
                console.error(`Failed to generate media prompt for post: ${post.title}`, e);
                return post; // Return original post on error
            }
        })
    );

    const finalPosts = postsWithPrompts.map(p => ({
        ...p,
        id: crypto.randomUUID(),
        status: 'draft',
        promotedProductIds: selectedProduct ? [selectedProduct.id] : [],
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

// --- NEW FUNCTION FOR GENERATING CONTENT IDEAS FROM A PRODUCT ---

export const generateIdeasFromProductWithOpenRouter = async (
    product: AffiliateLink,
    language: string,
    model: string
): Promise<Omit<Idea, 'id' | 'trendId'>[]> => {
    if (!model || typeof model !== 'string' || model.trim() === '') {
        throw new Error("Cannot generate ideas from product with OpenRouter: No valid model was provided.");
    }
    
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
    
    const openRouterPrompt = `You are a creative marketing strategist. Based on the following affiliate product details, generate 5 unique and engaging content ideas in ${language} that can be used to promote this product effectively.

For each idea, provide:
1.  A catchy 'title' that would grab attention.
2.  A detailed 'description' explaining the concept and how it would showcase the product.
3.  A specific 'targetAudience' that this idea would appeal to.

Product Details:
${productDetails}

Make sure each idea is distinct and highlights different aspects of the product. Consider various content formats like tutorials, reviews, comparisons, lifestyle content, unboxings, etc.

You MUST respond with a single, valid JSON array containing 5 idea objects. Do not add any text or explanation before or after the JSON array.`;
    
    const response = await openrouterFetch({
        model: model,
        messages: [{ role: 'user', content: openRouterPrompt }],
        response_format: { "type": "json_object" },
    });
    
    const jsonText = parseOpenRouterResponse(response);
    if (!jsonText) throw new Error("Received empty response from OpenRouter for product-based ideas.");
    
    // Log the raw response for debugging
    console.log("Raw OpenRouter response for product ideas:", jsonText);
    
    // Fix malformed JSON responses that are missing array brackets
    let fixedJsonText = jsonText.trim();
    if (fixedJsonText.startsWith('{') && fixedJsonText.includes('title') && fixedJsonText.includes('description') && fixedJsonText.includes('targetAudience')) {
        // This looks like individual idea objects separated by commas
        // Wrap them in an array
        fixedJsonText = '[' + fixedJsonText + ']';
    } else if (fixedJsonText.startsWith('"') && fixedJsonText.endsWith('"')) {
        // This might be a JSON string that needs to be parsed twice
        try {
            fixedJsonText = JSON.parse(fixedJsonText);
        } catch (e) {
            // If parsing fails, continue with original text
        }
    }
    
    try {
        let ideas = sanitizeAndParseJson(fixedJsonText);
        
        // Handle case where ideas might be wrapped in an object with an "ideas" property
        if (ideas && typeof ideas === 'object' && !Array.isArray(ideas) && ideas.ideas) {
            ideas = ideas.ideas;
        }
        
        // Special handling for malformed responses that are missing the opening bracket
        if (ideas && typeof ideas === 'object' && !Array.isArray(ideas) && ideas.title) {
            // This looks like a single idea object instead of an array
            ideas = [ideas];
        }
        
        // Ensure we have an array of ideas
        if (!Array.isArray(ideas)) {
            console.error("Invalid ideas format received from OpenRouter:", ideas);
            throw new Error("Expected an array of ideas, but received: " + JSON.stringify(ideas));
        }
        
        // Validate each idea has the required fields
        for (let i = 0; i < ideas.length; i++) {
            const idea = ideas[i];
            if (!idea.title || !idea.description || !idea.targetAudience) {
                console.error("Invalid idea structure at index", i, ":", idea);
                throw new Error(`Idea at index ${i} is missing required fields. Title: ${!!idea.title}, Description: ${!!idea.description}, TargetAudience: ${!!idea.targetAudience}`);
            }
        }
        
        // Add the productId to each idea
        return ideas.map((idea: any) => ({
            ...idea,
            productId: product.id
        }));
    } catch (e) {
        console.error("Failed to parse AI JSON response for product-based ideas:", jsonText);
        throw new Error("The AI returned a malformed or unexpected response. This may be a temporary issue with the model. Please try again later or configure a different model in Settings.");
    }
};
