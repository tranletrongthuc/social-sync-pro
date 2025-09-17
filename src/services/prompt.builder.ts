import type { BrandFoundation, Persona, Settings, AffiliateLink, MediaPlanPost } from '../../types';


// --- Helper Functions for Rule Application ---

/**
 * Builds the image prompt rules instruction
 */
function buildImagePromptRules(rules: string[]): string {
    return `IF 'contentType' is 'Image', the 'mediaPrompt' MUST be a detailed visual description for an AI image generator, and you MUST apply these rules: ${rules.join(', ')}.`;
}

/**
 * Builds the carousel prompt rules instruction
 */
function buildCarouselPromptRules(rules: string[]): string {
    return `IF 'contentType' is 'Carousel', the 'mediaPrompt' MUST be an ARRAY of strings (string[]), where EACH string is a detailed visual description for an AI image generator for ONE carousel image, and you MUST apply these rules to EACH prompt: ${rules.join(', ')}. IMPORTANT: Each carousel image should be described individually in its own string element of the array.`;
}

/**
 * Builds the short video script rules instruction
 */
function buildShortVideoScriptRules(rules: string[]): string {
    return `IF 'contentType' is 'Reel' or 'Shorts', the 'mediaPrompt' MUST be a short video script, and you MUST apply these rules: ${rules.join(', ')}.`;
}

/**
 * Builds the long video script rules instruction
 */
function buildLongVideoScriptRules(rules: string[]): string {
    return `IF 'contentType' is 'Video' or 'Story', the 'mediaPrompt' MUST be a long video script, and you MUST apply these rules: ${rules.join(', ')}.`;
}

/**
 * Builds the default video rules instruction
 */
function buildDefaultVideoRules(): string {
    return `IF 'contentType' is 'Video', 'Reel', 'Shorts', or 'Story', the 'mediaPrompt' MUST be a detailed prompt for generating a video script.`;
}

/**
 * Builds the post caption rules instruction
 */
function buildPostCaptionRules(rules: string[]): string {
    return `For the 'content' field, you MUST apply the following rules: ${rules.join(', ')}`;
}


// --- The PromptBuilder Class ---

export class PromptBuilder {
    private components: string[] = [];

    /**
     * Adds a generic instruction or piece of text to the prompt.
     */
    addInstruction(text: string): this {
        if (text) {  // Only add non-empty text
            this.components.push(text);
        }
        return this;
    }

    /**
     * Adds the standardized Brand Foundation block.
     */
    addBrandInfo(brandFoundation: BrandFoundation): this {
        this.components.push(buildBrandInfoComponent(brandFoundation));
        return this;
    }

    /**
     * Adds the standardized Persona block.
     */
    addPersona(persona: Persona): this {
        this.components.push(buildPersonaComponent(persona));
        return this;
    }

    /**
     * Adds the final, strict JSON output requirement.
     */
    addJsonOutput(name: string, structure: object): this {
        this.components.push(buildJsonOutputComponent(name, structure));
        return this;
    }

    /**
     * Assembles all components into the final prompt string.
     */
    build(): string {
        return this.components.join('\n\n');
    }
}

// This file implements the "Modular Generation Toolkit"

// --- Reusable Prompt Components ---

/**
 * Creates a standardized block of text describing the brand's foundation.
 */
function buildBrandInfoComponent(brandFoundation: BrandFoundation): string {
    const { brandName, mission, usp, targetAudience, values, personality } = brandFoundation;
    let result = "Brand Foundation:\n";
    result += "- Name: " + brandName + "\n";
    result += "- Mission: " + mission + "\n";
    result += "- Unique Selling Proposition: " + usp + "\n";
    result += "- Target Audience: " + targetAudience + "\n";
    result += "- Personality: " + personality + "\n";
    result += "- Core Values: " + (values || []).join(', ');
    return result;
}

/**
 * Creates a standardized block of text describing the persona.
 */
function buildPersonaComponent(persona: Persona): string {
    // This can be expanded to include more persona details as needed.
    let result = "Persona Profile to Embody:\n";
    result += "- Nickname: " + persona.nickName + "\n";
    result += "- Background: " + persona.background + "\n";
    result += "- Voice & Style: " + (persona.voice?.communicationStyle?.voice || '');
    return result;
}

/**
 * Creates a standardized, hardcoded instruction for the AI to return a JSON object.
 */
function buildJsonOutputComponent(name: string, structure: object): string {
    // If the structure is an array, wrap it in an object with the specified name as the key.
    // This ensures the AI returns { "name": [...] } which the backend can parse.
    const finalStructure = Array.isArray(structure) ? { [name]: structure } : structure;
    const jsonStructureString = JSON.stringify(finalStructure, null, 2);

    let result = "Response Format Requirement:\n";
    result += "You MUST respond with a single, valid JSON object. Do NOT include any markdown formatting (like ```json), commentary, or any other text outside the JSON object.\n";
    result += "The JSON object's structure must strictly adhere to the following schema AND all MANDATORY rules within fields named '_rule_for_...':\n";
    result += "```json\n";
    result += jsonStructureString + "\n";
    result += "```";
    return result;
}

// --- Prompt Builder Functions for Each Feature ---

export const BRAND_KIT_JSON_STRUCTURE = {
    brandFoundation: {
        brandName: "string",
        mission: "string",
        usp: "string",
        targetAudience: "string",
        values: ["string"],
        personality: "string"
    },
    coreMediaAssets: {
        logoConcepts: [
            {
                id: "string",
                prompt: "string",
                imageKey: "string"
            }
        ],
        colorPalette: [
            {
                name: "string",
                hex: "string"
            }
        ],
        fontRecommendations: [
            {
                name: "string",
                type: "heading or body"
            }
        ]
    },
    unifiedProfileAssets: {
        accountName: "string",
        username: "string",
        profilePicturePrompt: "string",
        profilePictureId: "string",
        profilePictureImageKey: "string",
        coverPhotoPrompt: "string",
        coverPhotoId: "string",
        coverPhotoImageKey: "string"
    }
};

export const MEDIA_PLAN_JSON_STRUCTURE = {
    plan: [
        {
            theme: "string",
            posts: [
                {
                    id: "string",
                    title: "string",
                    content: "string or string[]",
                    platform: "string",
                    contentType: "Carousel | Image | Video | Reel | Shorts | Story",
                    status: "draft",
                    hashtags: ["string"],
                    cta: "string",
                    mediaPrompt: "IF contentType is 'Carousel', MUST be string[] (array of strings, one for each image) | IF contentType is 'Image', MUST be string"
                }
            ]
        }
    ]
};

export const BRAND_PROFILE_JSON_STRUCTURE = {
    name: "string",
    mission: "string",
    values: "string",
    audience: "string",
    personality: "string"
};

export const VIRAL_IDEAS_JSON_STRUCTURE = [
    {
        title: "",
        description: "",
        targetAudience: ""
    }
];

export const CONTENT_PACKAGE_JSON_STRUCTURE = {
    pillarContent: {
            id: "string",
            title: "string",
            content: "string or string[]",
            platform: "string",
            contentType: "Carousel | Image | Video | Reel | Shorts | Story",
            status: "draft",
            hashtags: ["string"],
            cta: "string",
            mediaPrompt: "IF contentType is 'Carousel', MUST be string[] (array of strings, one for each image) | IF contentType is 'Image', MUST be string"
        },
    repurposedContent: [
        {
            id: "string",
            title: "string",
            content: "string or string[]",
            platform: "string",
            contentType: "Carousel | Image | Video | Reel | Shorts | Story",
            status: "draft",
            hashtags: ["string"],
            cta: "string",
            mediaPrompt: "IF contentType is 'Carousel', MUST be string[] (array of strings, one for each image) | IF contentType is 'Image', MUST be string"
        }
    ]
};

export const FACEBOOK_TRENDS_JSON_STRUCTURE = [
    {
        topic: "string",
        keywords: ["string"],
        analysis: "string"
    }
];

export const FACEBOOK_POST_IDEAS_JSON_STRUCTURE = [
    {
        title: "string",
        content: "string",
        cta: "string"
    }
];

export const PRODUCT_IDEAS_JSON_STRUCTURE = [
    {
        title: "string",
        description: "string",
        targetAudience: "string"
    }
];

export const PERSONAS_JSON_STRUCTURE = [
    {
        nickName: "string",
        fullName: "string",
        background: "Detailed origin story and background of the persona.",
        backstory: "Key life events and experiences that shaped the persona.",
        outfitDescription: "Detailed description of their typical clothing and style.",
        visualCharacteristics: "Detailed description of their physical appearance, mannerisms, and overall visual presence.",
        mainStyle: "The primary aesthetic or style they embody (e.g., 'Minimalist', 'Bohemian', 'Techwear').",
        activityField: "The main industry or field of activity they are involved in (e.g., 'Technology', 'Fashion', 'Music').",
        demographics: {
            age: 0,
            gender: "'Male' | 'Female' | 'Non-binary'",
            location: "string",
            occupation: "string",
            incomeLevel: "string"
        },
        voice: {
            personalityTraits: ["string"],
            linguisticRules: ["Specific rules for how the persona communicates, e.g., 'Avoids slang', 'Uses emojis frequently'"],
            communicationStyle: {
                tone: "string",
                voice: "string",
                preferredChannels: ["string"]
            }
        },
        goalsAndMotivations: ["string"],
        painPoints: ["string"],
        contentTone: "The specific tone to be used when creating content as this persona.",
        coreCharacteristics: "The most fundamental and defining characteristics of the persona.",
        keyMessages: "The key messages or themes this persona should consistently communicate.",
        interestsAndHobbies: ["string"],
        knowledgeBase: ["string"],
        brandRelationship: {
            awareness: "How the persona became aware of the brand.",
            perception: "What the persona thinks and feels about the brand.",
            engagement: "How the persona interacts with the brand."
        }
    }
];

export const SUGGEST_TRENDS_JSON_STRUCTURE = [
    {
        topic: "string",
        keywords: ["string"],
        analysis: "string",
        // Enhanced search metadata fields
        searchVolume: "number",
        competitionLevel: "'Low' | 'Medium' | 'High'",
        peakTimeFrame: "string",
        geographicDistribution: "object",
        relatedQueries: ["string"],
        trendingScore: "number",
        sourceUrls: ["string"],
        category: "string",
        sentiment: "'Positive' | 'Negative' | 'Neutral'",
        predictedLifespan: "string"
    }
];

/**
 * Builds a prompt for generating a media plan
 */
export function buildMediaPlanPrompt(params: { 
    brandFoundation: BrandFoundation, 
    userPrompt: string, 
    language: string, 
    totalPosts: number, 
    useSearch: boolean, 
    selectedPlatforms: string[], 
    options: any, 
    brandSettings: Settings, 
    adminSettings: Settings, 
    persona: Persona | null, 
    selectedProduct: AffiliateLink | null, 
    pillar: string 
}): string {
    const { brandFoundation, userPrompt, language, totalPosts, selectedPlatforms, options, brandSettings, adminSettings, persona, selectedProduct, pillar } = params;
    
    const template = adminSettings.prompts?.mediaPlanGeneration?.systemInstruction || `You are an expert social media strategist and content creator. Your task is to create a comprehensive media plan based on the provided information.`;
    const rules = brandSettings.prompts?.rules;

    const promptBuilder = new PromptBuilder()
        .addInstruction(template)
        .addBrandInfo(brandFoundation)
        .addInstruction(`Content Pillar: ${pillar}`)
        .addInstruction(`User's specific request: ${userPrompt}`)
        .addInstruction(`Language: ${language}`)
        .addInstruction(`Total number of posts to generate: ${totalPosts}`)
        .addInstruction(`Selected platforms: ${selectedPlatforms.join(', ')}`)
        .addInstruction(`Content generation options: Tone: ${options.tone}, Style: ${options.style}, Length: ${options.length}, Include Emojis: ${options.includeEmojis}`)
        .addInstruction(selectedProduct ? `Focus Product: ${selectedProduct.productName} - ${selectedProduct.product_description}` : '')
        .addInstruction(persona ? buildPersonaComponent(persona) : '');

    // --- NEW EXPLICIT RULES BLOCK ---
    if (rules) {
        let rulesInstruction = "\n--- CRITICAL RULES --- You must follow these rules when generating the fields in the JSON response:";
        let hasRules = false;

        if (rules.postCaption && rules.postCaption.length > 0) {
            rulesInstruction += `\n- ${buildPostCaptionRules(rules.postCaption)}`;
            hasRules = true;
        }

        const mediaRules = [];
        if (rules.imagePrompt && rules.imagePrompt.length > 0) {
            mediaRules.push(buildImagePromptRules(rules.imagePrompt));
            mediaRules.push(buildCarouselPromptRules(rules.imagePrompt));
        }
        if (rules.shortVideoScript && rules.shortVideoScript.length > 0) {
            mediaRules.push(buildShortVideoScriptRules(rules.shortVideoScript));
        }
        if (rules.longVideoScript && rules.longVideoScript.length > 0) {
            mediaRules.push(buildLongVideoScriptRules(rules.longVideoScript));
        }

        // Add a default instruction for video if no specific rules are provided.
        if ((!rules.shortVideoScript || rules.shortVideoScript.length === 0) && (!rules.longVideoScript || rules.longVideoScript.length === 0)) {
            mediaRules.push(buildDefaultVideoRules());
        }

        if (mediaRules.length > 0) {
            rulesInstruction += `\n- For the 'contentType' field, you MUST ONLY use one of these exact values: 'Carousel', 'Image', 'Video', 'Reel', 'Shorts', 'Story'.`;
            rulesInstruction += `\n- ${mediaRules.join('\n- ')}`;
            hasRules = true;
        }

        if (hasRules) {
            promptBuilder.addInstruction(rulesInstruction);
        }
    }
    // --- END NEW RULES BLOCK ---

    promptBuilder.addJsonOutput("MediaPlan", MEDIA_PLAN_JSON_STRUCTURE);
        
    return promptBuilder.build();
}

/**
 * Builds a prompt for generating a brand kit
 */
export function buildBrandKitPrompt(params: { 
    brandInfo: any, 
    language: string, 
    brandSettings: Settings, 
    adminSettings: Settings 
}): string {
    const { brandInfo, language, brandSettings, adminSettings } = params;
    
    const template = adminSettings.prompts?.simple?.generateBrandKit || `You are an expert brand strategist. Your task is to create a comprehensive brand kit based on the provided information.`

    const prompt = new PromptBuilder()
        .addInstruction(template)
        .addInstruction(`Brand Information:\n- Name: ${brandInfo.name}\n- Mission: ${brandInfo.mission}\n- Values: ${brandInfo.values}\n- Target Audience: ${brandInfo.audience}\n- Personality: ${brandInfo.personality}`)
        .addInstruction(`Language: ${language}`)
        .addJsonOutput("BrandKit", BRAND_KIT_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for refining post content
 */
export function buildRefinePostPrompt(params: { 
    postText: string, 
    settings: Settings 
}): string {
    const { postText, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert content editor. Your task is to refine and improve the provided social media post text.`)
        .addInstruction(`Original post text:\n${postText}`)
        .addInstruction("Improve the text while maintaining its core message and intent.")
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for generating a brand profile
 */
export function buildGenerateBrandProfilePrompt(params: { 
    idea: string, 
    language: string, 
    settings: Settings 
}): string {
    const { idea, language, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert brand strategist. Your task is to create a brand profile based on the provided business idea.`)
        .addInstruction(`Business Idea: ${idea}`)
        .addInstruction(`Language: ${language}`)
        .addJsonOutput("BrandProfile", BRAND_PROFILE_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for generating an in-character post
 */
export function buildGenerateInCharacterPostPrompt(params: { 
    objective: string, 
    platform: string, 
    persona: Persona, 
    keywords: string[], 
    pillar: string, 
    brandSettings: Settings, 
    adminSettings: Settings, 
    options: any 
}): string {
    const { objective, platform, persona, keywords, pillar, brandSettings, adminSettings, options } = params;
    
    const template = adminSettings.prompts?.generateInCharacterPost?.taskInstruction || `You are ${persona.nickName}, a persona for a brand. Your task is to create a social media post in your character.`;

    const prompt = new PromptBuilder()
        .addInstruction(template)
        .addPersona(persona)
        .addInstruction(`Content Pillar: ${pillar}`)
        .addInstruction(`Platform: ${platform}`)
        .addInstruction(`Objective: ${objective}`)
        .addInstruction(`Keywords to include: ${keywords.join(', ')}`)
        .addInstruction(`Content generation options: Tone: ${options.tone}, Style: ${options.style}, Length: ${options.length}, Include Emojis: ${options.includeEmojis}`)
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for generating a media prompt for a post
 */
export function buildGenerateMediaPromptForPostPrompt(params: { 
    postContent: MediaPlanPost, 
    brandFoundation: BrandFoundation, 
    language: string, 
    persona: Persona | null, 
    settings: Settings 
}): string {
    const { postContent, brandFoundation, language, persona, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert AI art prompt engineer. Your task is to create a detailed image generation prompt based on the provided post content.`)
        .addBrandInfo(brandFoundation)
        .addInstruction(`Post Title: ${postContent.title}`)
        .addInstruction(`Post Content: ${Array.isArray(postContent.content) ? postContent.content.join('\n') : postContent.content}`)
        .addInstruction(`Content Type: ${postContent.contentType}`)
        .addInstruction(`Language: ${language}`)
        .addInstruction(persona ? buildPersonaComponent(persona) : '')
        .addInstruction("Create a highly detailed image generation prompt that visually represents the content.")
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for generating an affiliate comment
 */

export function buildAffiliateCommentPrompt(params: { 
    post: any, 
    products: AffiliateLink[], 
    language: string, 
    settings: Settings 
}): string {
    const { post, products, language, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert social media content creator. Your task is to create an engaging comment for a social media post that promotes affiliate products.`)
        .addInstruction(`Post Title: ${post.title}`)
        .addInstruction(`Post Content: ${Array.isArray(post.content) ? post.content.join('\n') : post.content}`)
        .addInstruction(`Affiliate Products: ${products.map(p => `${p.productName}: ${p.product_description}`).join('; ')}`)
        .addInstruction(`Language: ${language}`)
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for generating viral ideas
 */
export function buildGenerateViralIdeasPrompt(params: { 
    trend: any, 
    language: string, 
    useSearch: boolean, 
    settings: Settings 
}): string {
    const { trend, language, useSearch, settings } = params;

    const jsonStructureString = JSON.stringify({ "ViralIdeas": VIRAL_IDEAS_JSON_STRUCTURE }, null, 2);

    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert content strategist. Your task is to generate 3 distinct viral content ideas based on the provided trend.`)
        .addInstruction(`Trend Topic: ${trend.topic}`)
        .addInstruction(`Language: ${language}`)
        // New, more direct instruction block
        .addInstruction(`\n--- RESPONSE FORMAT --- You MUST return your response as a single, valid JSON object. The root of this object MUST be a key named "ViralIdeas" which contains an array of exactly 3 idea objects. Do not include ANY commentary, markdown, or any other text outside of the single JSON object. Your entire response must be the JSON object itself and nothing else.`) 
        .addInstruction(`The required JSON structure is:\n\`\`\`json\n${jsonStructureString}\n\`\`\`\n`)
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for generating a content package
 */
export function buildGenerateContentPackagePrompt(params: { 
    idea: any, 
    brandFoundation: BrandFoundation, 
    language: string, 
    settings: Settings, 
    persona: Persona | null, 
    pillarPlatform: string, 
    options: any, 
    selectedProduct: AffiliateLink | null, 
    repurposedPlatforms: string[] 
}): string {
    const { idea, brandFoundation, language, settings, persona, pillarPlatform, options, selectedProduct, repurposedPlatforms } = params;
    
    const promptBuilder = new PromptBuilder()
        .addInstruction(`You are an expert content creator. Your task is to create a comprehensive content package based on the provided idea.`)
        .addBrandInfo(brandFoundation)
        .addInstruction(`Idea Title: ${idea.title}`)
        .addInstruction(`Idea Description: ${idea.description}`)
        .addInstruction(`Language: ${language}`)
        .addInstruction(`Pillar Platform: ${pillarPlatform}`)
        .addInstruction(`Repurposed Platforms: ${repurposedPlatforms.join(', ')}`)
        .addInstruction(`Content generation options: Tone: ${options.tone}, Style: ${options.style}, Length: ${options.length}, Include Emojis: ${options.includeEmojis}`)
        .addInstruction(selectedProduct ? `Focus Product: ${selectedProduct.productName} - ${selectedProduct.product_description}` : '')
        .addInstruction(persona ? buildPersonaComponent(persona) : '');
        
    // Add strict contentType rules
    promptBuilder.addInstruction(`
--- CRITICAL RULES --- You must follow these rules when generating the fields in the JSON response:
- For the 'contentType' field, you MUST ONLY use one of these exact values: 'Carousel', 'Image', 'Video', 'Reel', 'Shorts', 'Story'.`);

    // Add brand-specific rules if they exist
    const rules = settings.prompts?.rules;
    if (rules) {
        const mediaRules = [];
        if (rules.imagePrompt && rules.imagePrompt.length > 0) {
            mediaRules.push(buildImagePromptRules(rules.imagePrompt));
            mediaRules.push(buildCarouselPromptRules(rules.imagePrompt));
        }
        if (rules.shortVideoScript && rules.shortVideoScript.length > 0) {
            mediaRules.push(buildShortVideoScriptRules(rules.shortVideoScript));
        }
        if (rules.longVideoScript && rules.longVideoScript.length > 0) {
            mediaRules.push(buildLongVideoScriptRules(rules.longVideoScript));
        }

        // Add a default instruction for video if no specific rules are provided.
        if ((!rules.shortVideoScript || rules.shortVideoScript.length === 0) && (!rules.longVideoScript || rules.longVideoScript.length === 0)) {
            mediaRules.push(buildDefaultVideoRules());
        }

        if (mediaRules.length > 0) {
            promptBuilder.addInstruction(`- ${mediaRules.join('\n- ')}`);
        }
        
        if (rules.postCaption && rules.postCaption.length > 0) {
            promptBuilder.addInstruction(`- ${buildPostCaptionRules(rules.postCaption)}`);
        }
    }
    
    promptBuilder.addInstruction(`- IF 'contentType' is 'Carousel', the 'mediaPrompt' MUST be an ARRAY of strings (string[]), where EACH string is a detailed visual description for an AI image generator for ONE carousel image. Each image should be described individually in its own string element of the array. For example: ["Image 1 description", "Image 2 description", "Image 3 description"].`);
    promptBuilder.addInstruction(`- IF 'contentType' is 'Image', the 'mediaPrompt' MUST be a single string with a detailed visual description for an AI image generator.`);
    
    promptBuilder.addJsonOutput(`ContentPackage`, CONTENT_PACKAGE_JSON_STRUCTURE);
        
    return promptBuilder.build();
}

/**
 * Builds a prompt for generating Facebook trends
 */
export function buildGenerateFacebookTrendsPrompt(params: { 
    industry: string, 
    language: string, 
    settings: Settings 
}): string {
    const { industry, language, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert social media trend analyst. Your task is to identify trending topics on Facebook for a specific industry.`)
        .addInstruction(`Industry: ${industry}`)
        .addInstruction(`Language: ${language}`)
        .addJsonOutput("FacebookTrends", FACEBOOK_TRENDS_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for generating posts for a Facebook trend
 */
export function buildGeneratePostsForFacebookTrendPrompt(params: { 
    trend: any, 
    language: string, 
    settings: Settings 
}): string {
    const { trend, language, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert Facebook content creator. Your task is to generate post ideas based on a trending topic.`)
        .addInstruction(`Trend Topic: ${trend.topic}`)
        .addInstruction(`Trend Keywords: ${trend.keywords.join(', ')}`)
        .addInstruction(`Trend Analysis: ${trend.analysis}`)
        .addInstruction(`Language: ${language}`)
        .addJsonOutput("FacebookPostIdeas", FACEBOOK_POST_IDEAS_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for generating ideas from a product
 */
export function buildGenerateIdeasFromProductPrompt(params: { 
    product: AffiliateLink, 
    language: string, 
    settings: Settings 
}): string {
    const { product, language, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert affiliate marketer. Your task is to generate content ideas based on an affiliate product.`)
        .addInstruction(`Product Name: ${product.productName}`)
        .addInstruction(`Product Description: ${product.product_description}`)
        .addInstruction(`Product Features: ${product.features?.join(', ') || ''}`)
        .addInstruction(`Use Cases: ${product.use_cases?.join(', ') || ''}`)
        .addInstruction(`Language: ${language}`)
        .addJsonOutput("ProductIdeas", PRODUCT_IDEAS_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for auto-generating a persona profile
 */
export function buildAutoGeneratePersonaPrompt(params: { 
    mission: string, 
    usp: string, 
    settings: Settings 
}): string {
    const { mission, usp, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert persona specialist. Your task is to create exactly 3 diverse brand personas based on the provided brand information.`)
        .addInstruction(`You MUST generate exactly 3 diverse personas.`)
        .addInstruction(`Brand Mission: ${mission}`)
        .addInstruction(`Brand USP: ${usp}`)
        .addJsonOutput("Personas", PERSONAS_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for suggesting industry-specific trends
 */
export function buildSuggestTrendsPrompt(params: { 
    brandFoundation: BrandFoundation, 
    timePeriod: string, 
    settings: Settings 
}): string {
    const { brandFoundation, timePeriod, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert trend analyst. Your task is to identify the most relevant and trending topics in the specified industry based on the provided brand information.`)
        .addBrandInfo(brandFoundation)
        .addInstruction(`Time Period: ${timePeriod}`)
        .addInstruction(`Find the most relevant and trending topics that would be valuable for content creation for this brand.`)
        .addJsonOutput("Trends", SUGGEST_TRENDS_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

/**
 * Builds a prompt for suggesting global hot trends
 */
export function buildSuggestGlobalTrendsPrompt(params: { 
    timePeriod: string, 
    settings: Settings 
}): string {
    const { timePeriod, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert trend analyst. Your task is to identify the most relevant global hot trends across all industries and topics.`)
        .addInstruction(`Time Period: ${timePeriod}`)
        .addInstruction(`Find the most viral and trending topics that would be valuable for content creation and trendjacking opportunities.`)
        .addJsonOutput("Trends", SUGGEST_TRENDS_JSON_STRUCTURE)
        .build();
        
    return prompt;
}