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
    let rateLimitRetries = 3; // Max 3 rate limit waits

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
                    const waitSeconds = 61; // Wait 61 seconds to be safe
                    lastError = new Error(`OpenRouter rate limit hit (1 req/min).`);
                    console.warn(`${lastError.message} Waiting ${waitSeconds}s before retrying. (${rateLimitRetries} waits remaining)`);
                    
                    window.dispatchEvent(new CustomEvent('rateLimitWait', { 
                        detail: { service: 'OpenRouter', seconds: waitSeconds, attempt: (3 - rateLimitRetries), total: 3 } 
                    }));

                    await new Promise(res => setTimeout(res, waitSeconds * 1000));
                    i--; // This was a rate limit wait, not a failure retry, so don't increment i.
                    continue;
                } else {
                    lastError = new Error('OpenRouter rate limit persisted for over 3 minutes.');
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

        // Try to extract content within \`\`\`json...``` markdown blocks
        const jsonMatch = content.match(/\`\`\`json\s*([\s\S]*?)\s*```/);
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
    const prompt = `You are a world-class social media copywriter. Refine the following post content to maximize engagement and impact, while preserving its core message. The output should ONLY be the refined text, without any introductory phrases, explanations, or quotes.\n\nOriginal content:\n"""${postText}"""`;

    // This function now only handles non-Gemini (i.e., OpenRouter) models
    const response = await openrouterFetch({
        model: model,
        messages: [
            { role: "user", content: prompt }
        ]
    });

    if (response.choices && response.choices.length > 0 && response.choices[0].message?.content) {
        let content = response.choices[0].message.content;

        const thinkTagEnd = content.indexOf('<\/think>');
        if (thinkTagEnd !== -1) {
            content = content.substring(thinkTagEnd + '<\/think>'.length);
        }
        
        return content.trim();
    }

    throw new Error("Received an invalid response from OpenRouter.");
};

export const generateBrandProfileWithOpenRouter = async (idea: string, language: string, model: string): Promise<BrandInfo> => {
    const prompt = `\nYou are an expert brand strategist. Based on the user's business idea, generate a concise and compelling brand profile IN ${language}.\nThe output must be a single, valid JSON object. Do not add any commentary or text outside of the JSON structure.\n\nBusiness Idea:\n"${idea}"\n\nGenerate the following brand profile fields in ${language}:\n- **name**: A creative and fitting brand name.\n- **mission**: A powerful, one-sentence mission statement.\n- **values**: A comma-separated string of 4-5 core brand values.\n- **audience**: A brief description of the target audience.\n- **personality**: 3-4 keywords describing the brand's personality.\n`;
    const openRouterPrompt = `${prompt}\n\nYou MUST respond with a single, valid JSON object. Do not add any text or explanation before or after the JSON object.`;
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
    const prompt = `\nYou are SocialSync Pro, an AI-powered brand launch assistant. Your task is to generate a complete and professional set of branding and social media assets IN ${language}, based on the user's input.\nThe output must be a single, valid JSON object that strictly adheres to the provided schema. Do not add any commentary or text outside of the JSON structure.\n\nBrand Input (in ${language}):\n- Brand Name: ${brandInfo.name}\n- Brand Mission: ${brandInfo.mission}\n- Brand Values: ${brandInfo.values}\n- Target Audience: ${brandInfo.audience}\n- Brand Personality: ${brandInfo.personality}\n\nGenerate the following assets IN ${language}:\n1.  **Brand Foundation**: Summarize the core identity. All subsequent generations must be perfectly aligned with this foundation.\n2.  **Core Media Assets**: Create logo concepts (prompts for an image generation model), a 4-color palette, and font recommendations. Logo prompts must be in English.\n3.  **Unified Profile Assets**: Create a single set of assets for use across all platforms (account name, username, profile picture prompt, cover photo prompt). Image prompts must be in English.\n4.  **Initial 1-Month Media Plan**: Generate a 4-week media plan designed for a brand launch. It should have a clear theme for each week. Create 4 posts per week, distributed across YouTube, Facebook, Instagram, TikTok, and Pinterest. Ensure every post includes a detailed, English image prompt.\n`;
    const openRouterPrompt = `${prompt}\n\nYou MUST respond with a single, valid JSON object. Do not add any text or explanation before or after the JSON object.`;
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
    persona: Persona | null
): Promise<MediaPlanGroup> => {
    
    const personaInstruction = persona ? `\n**KOL/KOC Persona (Crucial):**\nAll content MUST be generated from the perspective of the following KOL/KOC. They are the face of this campaign.\n- **Nickname:** ${persona.nickName}\n- **Main Style:** ${persona.mainStyle}\n- **Field of Activity:** ${persona.activityField}\n- **Detailed Description (for image generation):** ${persona.outfitDescription}\n- **Tone:** The content's tone must perfectly match this persona's style.\n- **Image Prompts (VERY IMPORTANT):** Every single 'imagePrompt' value you generate MUST start with the exact "Detailed Description" provided above, followed by a comma and then a description of the scene. The structure must be: "${persona.outfitDescription}, [description of the scene]". For example: "${persona.outfitDescription}, unboxing a product in a minimalist apartment...".\n` : '';

    const openRouterPrompt = `You are SocialSync Pro, an AI-powered brand launch assistant. Your task is to generate a 1-Month Media Plan IN ${language} based on the provided Brand Foundation and User Goal.\nYou MUST strictly follow the rules provided in the system instruction.\nThe output must be a single, valid JSON object that strictly adheres to the provided schema. Do not add any commentary or text outside of the JSON structure.\n\n**Brand Foundation (Use this as your guide):**\n- Brand Name: ${brandFoundation.brandName}\n- Mission: ${brandFoundation.mission}\n- USP: ${brandFoundation.usp}\n- Values: ${(brandFoundation.values || []).join(', ')}\n- Target Audience: ${brandFoundation.targetAudience}\n- Personality: ${brandFoundation.personality}\n\n${personaInstruction}\n\n**User's Goal for the Plan:**\n"${userPrompt}"\n\n**Content Customization Instructions:**\n- **Tone of Voice**: Generate all content with a '${options.tone}' tone.\n- **Writing Style**: The primary style should be '${options.style}'.\n- **Post Length**: Adhere to a '${options.length}' post length. For example, 'Short' is suitable for Instagram captions (2-4 sentences), 'Medium' for Facebook (1-2 paragraphs), and 'Long' could be a detailed script or a mini-blog post.\n- **Emojis**: ${options.includeEmojis ? "Use emojis appropriately to enhance engagement and match the brand personality." : "Do not use any emojis."}\n\nBased on the Brand Foundation, User's Goal, and Customization Instructions, generate a complete 4-week media plan group.\n- **Name**: First, create a short, descriptive title for this entire plan based on the User's Goal (e.g., "Q3 Product Launch", "Summer Eco-Friendly Campaign").\n- **Plan Structure**: The plan must have 4 weekly objects. Each week must have a clear 'theme' (e.g., "Week 1: Brand Introduction & Values").\n- **Content**: The entire 4-week plan must contain a total of approximately ${totalPosts} posts, distributed logically across the 4 weeks. The number of posts per week can vary if it makes thematic sense, but the total must be close to ${totalPosts}. The posts should be distributed *only* across the following selected platforms: ${selectedPlatforms.join(', ')}. Do not generate content for any other platform not in this list.\n- **Post Details**: Each post object must be complete and ready-to-use, containing:\n    -   platform: The target platform. It MUST be one of the selected platforms: ${selectedPlatforms.map(p => `'${p}'`).join(', ')}.\n    -   contentType: e.g., "Image Post", "Video Idea", "Story", "Carousel Post".\n    -   title: An SEO-friendly title or headline.\n    -   content: The full caption, description, or script. This must be engaging and reflect the brand personality and customization instructions.\n    -   hashtags: An array of relevant and trending hashtags.\n    -   cta: A clear call-to-action (e.g., "Shop Now", "Learn More", "Comment below").\n    -   imagePrompt: A detailed, English-language prompt for an image generation model.\n- **Important Content Formatting Rules**:\n    - The 'content' field for any post must be the final, user-facing text (e.g., a caption, script, or description).\n    - For Instagram 'Carousel Post' types, the 'content' field should be a single, cohesive caption for the entire carousel. It must NOT include markers like "Slide 1:", "Slide 2:", etc. The caption should introduce the carousel and encourage users to swipe.\n    - The 'content' field must be clean and ready for publishing. It must NOT contain any extraneous data, especially numerical arrays or references like "[3, 6, 8]".\n- **Consistency**: The entire media plan must be thematically consistent with the Brand Foundation.\n\n**JSON Schema for Media Plan Group (Strictly Adhere to This):**\n\`\`\`json\n{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string", "description": "A short, descriptive title for the media plan." },\n    "plan": {\n      "type": "array",\n      "description": "An array of weekly media plan objects.",\n      "items": {\n        "type": "object",\n        "properties": {\n          "week": { "type": "integer", "description": "The week number (1-4)." },\n          "theme": { "type": "string", "description": "The thematic focus for the week." },\n          "posts": {\n            "type": "array",\n            "description": "An array of social media posts for the week.",\n            "items": {\n              "type": "object",\n              "properties": {\n                "platform": { "type": "string", "enum": ["YouTube", "Facebook", "Instagram", "TikTok", "Pinterest"] },\n                "contentType": { "type": "string" },\n                "title": { "type": "string" },\n                "content": { "type": "string" },\n                "hashtags": { "type": "array", "items": { "type": "string" } },\n                "cta": { "type": "string" },\n                "imagePrompt": { "type": "string", "description": "Detailed English prompt for image generation." }\n              },\n              "required": ["platform", "contentType", "title", "content", "hashtags", "cta", "imagePrompt"]\n            }\n          }\n        },\n        "required": ["week", "theme", "posts"]\n      }\n    }\n  },\n  "required": ["name", "plan"]\n}\n\`\`\`\n`;
    
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
            name: planName,
            prompt: userPrompt,
            plan: planWithEnhancements,
            personaId: persona?.id
        };
    } catch(e) {
        console.error("Failed to parse AI JSON response:", jsonText);
        throw new Error("The AI returned a malformed or unexpected response. Please try again.");
    }
};

export const generateImagePromptForPostWithOpenRouter = async (
    postContent: { title: string; content: string },
    brandFoundation: BrandFoundation,
    language: string,
    model: string,
    persona: Persona | null
): Promise<string> => {
    const personaInstruction = persona ? `\n**KOL/KOC Persona (Crucial):**\nAll content MUST be generated from the perspective of the following KOL/KOC. They are the face of this campaign.\n- **Nickname:** ${persona.nickName}\n- **Main Style:** ${persona.mainStyle}\n- **Field of Activity:** ${persona.activityField}\n- **Detailed Description:** ${persona.outfitDescription}\n\nIMPORTANT: The prompt you generate MUST start with the exact "Detailed Description" above, followed by a comma, then the scene description. The structure must be: "${persona.outfitDescription}, [description of the scene]".\n\n` : '';

    const prompt = `\nYou are a creative visual director for the brand "${brandFoundation.brandName}".\nThe brand's personality is: ${brandFoundation.personality}.\n${personaInstruction}\nBased on the following social media post content (in ${language}), generate a single, detailed, and compelling image generation prompt.\nThe prompt MUST BE IN ENGLISH.\nThe prompt should be a single paragraph describing a visual scene that captures the essence of the post.\nDo not add any explanations, labels, or extra text. Output ONLY the prompt.\n\nPost Title: "${postContent.title}"\nPost Content: "${postContent.content}"\n`;
    const response = await openrouterFetch({
        model: model,
        messages: [{ role: 'user', content: prompt }]
    });
    const text = parseOpenRouterResponse(response);
    
    if (!text) {
        return `A visually appealing image representing the concept of "${postContent.title}" in a style that is ${brandFoundation.personality}.`;
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
        `- Product Name: ${p.productName}\n  - Price: ${p.price}\n  - Promotion Link: ${p.promotionLink || p.productLink}`
    ).join('\n');

    const prompt = `\nYou are the social media manager for the brand "${brandFoundation.brandName}", which has a "${brandFoundation.personality}" personality. Your task is to write a comment for a social media post, from the perspective of the page admin.\n\n**Primary Goal:** Write a natural, human-like comment that subtly promotes one or more affiliate products related to the post. The comment must encourage clicks on the affiliate link.\n\n**Rules:**\n1.  **Natural Tone:** The comment must sound like a real person, not an ad. It should match the tone of the original post. Avoid overly salesy language.\n2.  **Two-Part Structure:** The comment MUST consist of two parts, separated by a blank line:\n    *   **Part 1 (Caption):** A short, engaging caption. This caption must cleverly connect the original post's topic with the product(s) being promoted. It should add value, share a personal tip, or ask a question to spark conversation and make people curious about the link.\n    *   **Part 2 (Links):** The affiliate link(s) for the product(s). If there is more than one product, list each link on a new line. Do not add any text before or after the links in this part.\n3.  **Language:** The entire comment MUST be in ${language}.\n\n**Original Post Content:**\n- Title: ${post.title}\n- Content: ${post.content}\n\n**Affiliate Product(s) to Promote:**\n${productDetails}\n\n**Example Output:**\nMình thấy nhiều bạn hỏi về [related_topic], em này đúng là chân ái luôn, giải quyết được đúng vấn đề đó. Dùng cực thích!\n\nhttps://your-affiliate-link.com\n\n---\nNow, generate the comment based on the provided post and product details. Output ONLY the comment text.\n`;

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
    const instructionText = `Generate a single, high-quality image based on the following description. The response must be a valid JSON object containing one key: "b64_json", which holds the base64 encoded string of the generated JPEG image.\n\nDescription (aspect ratio ${aspectRatio}): "${prompt}${promptSuffix ? `, ${promptSuffix}` : ''}${NEGATIVE_PROMPT}"`;
    
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
    const prompt = `You are a viral marketing expert and a world-class creative strategist.\nYour task is to generate 5 highly engaging and potentially viral content ideas based on a given topic and related keywords.\nThe ideas must be in ${language}.\nYour response MUST be a valid JSON array of objects. Each object must have the following keys:\n- "title": A catchy, curiosity-driven 'title'.\n- "description": A short but comprehensive 'description' of the idea.\n- "targetAudience": A specific 'targetAudience' that this idea would appeal to.\n\nTopic: "${trend.topic}"\nKeywords: ${trend.keywords.join(', ')}\n`;
    
    const openRouterPrompt = `${prompt}\n\nYou MUST respond with a single, valid JSON array, containing 5 idea objects. Do not add any text or explanation before or after the JSON object. The root of your response must be an array, like this: [ { "title": ... }, ... ]`;
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
        const parsedJson = sanitizeAndParseJson(jsonText);
        const validatedIdeas = normalizeArrayResponse<Omit<Idea, 'id'|'trendId'>>(parsedJson, 'idea');
        
        if (validatedIdeas.length === 0) {
            console.error("Failed to extract a valid array of ideas from OpenRouter response:", parsedJson);
            throw new Error("The AI from OpenRouter returned data in an unexpected structure.");
        }
        
        return validatedIdeas.slice(0, 5);
    } catch (e) {
        console.error("Failed to parse AI JSON response for viral ideas:", jsonText);
        throw new Error("The AI returned a malformed or unexpected response for viral ideas from OpenRouter.");
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
    options: { tone: string; style: string; length: string; }
): Promise<MediaPlanGroup> => {

    const personaInstruction = persona ? `\n**KOL/KOC Persona (Crucial):**\nAll content MUST be generated from the perspective of the following KOL/KOC.\n- **Nickname:** ${persona.nickName}\n- **Main Style:** ${persona.mainStyle}\n- **Field of Activity:** ${persona.activityField}\n- **Detailed Description (for image generation):** ${persona.outfitDescription}\n- **Tone:** The content's tone must perfectly match this persona's style.\n- **Image Prompts (VERY IMPORTANT):** Every single 'imagePrompt' value you generate MUST start with the exact "Detailed Description" provided above, followed by a comma and then a description of the scene. The structure must be: "${persona.outfitDescription}, [description of the scene]". For example: "${persona.outfitDescription}, unboxing a product in a minimalist apartment...".\n` : '';

    const customizationInstruction = `\n**Content Customization Instructions:**\n- **Tone of Voice**: Generate all content with a '${options.tone}' tone.\n- **Writing Style**: The primary style should be '${options.style}'.\n- **Post Length**: Adhere to a '${options.length}' post length.\n`;

    // 1. Generate Pillar Content
    const pillarPrompt = `\n    ${personaInstruction}\n    ${customizationInstruction}\n    Based on the idea "${idea.title}", create a comprehensive, long-form 'pillar' content piece for ${pillarPlatform}.\n    This should be a detailed, authoritative piece that provides significant value to the target audience: ${idea.targetAudience}.\n    - If ${pillarPlatform} is YouTube, provide a detailed video script and a separate, SEO-optimized 'description' for the YouTube description box.\n    - If ${pillarPlatform} is Facebook, provide a long-form, engaging post like a mini-article.\n    - If ${pillarPlatform} is Instagram, provide a detailed multi-slide carousel post concept, including content for each slide and a main caption.\n    - If ${pillarPlatform} is Pinterest, provide a concept for a detailed infographic or a guide pin, including all text content needed.\n    - If ${pillarPlatform} is TikTok, provide a script for a multi-part (2-3 videos) series.\n    The output must be a single JSON object with: title, content, ${pillarPlatform === 'YouTube' ? 'description, ' : ''}hashtags, and cta. Do NOT include an imagePrompt.\n    Language: ${language}.\n    You MUST respond with a single, valid JSON object.\n    `;
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

    const repurposedPrompt = `\n    ${personaInstruction}\n    ${customizationInstruction}\n    **Context:** The following is a large "pillar" content piece about "${idea.title}" created for ${pillarPlatform}.\n    Pillar Content: "${pillarPost.content}"\n    **Your Task:** Repurpose the core message of the pillar content into one smaller, standalone post for EACH of the following platforms: ${repurposedPlatforms.join(', ')}.\n    Each new piece must be completely rewritten and tailored for its specific platform's format and audience. They must be relevant to the original pillar content.\n    - For short-form video platforms (TikTok, Instagram), create a concise video script or reel idea.\n    - For image-based platforms (Instagram, Pinterest), create a compelling caption for an image or carousel.\n    - For text-based platforms (Facebook), create an engaging post that summarizes or expands on a key point from the pillar content.\n    - If the pillar content is a long text post and you need to generate a YouTube idea, create a script outline for a short video based on the text.\n    Language: ${language}.\n\n    **Output Format (Strictly Enforced):**\n    Your response MUST be a single, valid JSON object. The root of this object must be a key named "posts", which contains an array of ${repurposedPlatforms.length} JSON objects.\n    Each object in the "posts" array must have these keys: "platform" (must be one of ${repurposedPlatforms.join(', ')}), "contentType", "title", "content", "hashtags", and "cta". Do NOT include an "imagePrompt" key.\n    \n    Example structure:\n    {\n      "posts": [\n        {\n          "platform": "YouTube",\n          "contentType": "Shorts Idea",\n          "title": "...",\n          "content": "...",\n          "hashtags": ["...", "..."],\n          "cta": "..."\n        },\n        {\n          "platform": "Instagram",\n          ...\n        }\n      ]\n    }\n\n    **Crucial Instructions:**\n    - Do NOT respond with just a JSON array.\n    - Do NOT respond with just a single post object.\n    - The root of your response MUST be an object with a "posts" key.\n    `;
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

    // 4. Generate image prompts for all posts
    const postsWithPrompts = await Promise.all(
        allPosts.map(async (post) => {
            try {
                const newPrompt = await generateImagePromptForPostWithOpenRouter(
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