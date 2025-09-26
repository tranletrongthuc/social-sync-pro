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

