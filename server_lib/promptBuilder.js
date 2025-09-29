// --- Helper Functions for Rule Application ---

/**
 * Builds the image prompt rules instruction
 */
function buildImagePromptRules(rules) {
    return `IF 'contentType' is 'Image', the 'mediaPrompt' MUST be a detailed visual description for an AI image generator, and you MUST apply these rules: ${rules.join(', ')}.`;
}

/**
 * Builds the carousel prompt rules instruction
 */
function buildCarouselPromptRules(rules) {
    return `IF 'contentType' is 'Carousel', the 'mediaPrompt' MUST be an ARRAY of strings (string[]), where EACH string is a detailed visual description for an AI image generator for ONE carousel image, and you MUST apply these rules to EACH prompt: ${rules.join(', ')}. IMPORTANT: Each carousel image should be described individually in its own string element of the array.`;
}

/**
 * Builds the short video script rules instruction
 */
function buildShortVideoScriptRules(rules) {
    return `IF 'contentType' is 'Reel' or 'Shorts', the 'mediaPrompt' MUST be a short video script, and you MUST apply these rules: ${rules.join(', ')}.`;
}

/**
 * Builds the long video script rules instruction
 */
function buildLongVideoScriptRules(rules) {
    return `IF 'contentType' is 'Video' or 'Story', the 'mediaPrompt' MUST be a long video script, and you MUST apply these rules: ${rules.join(', ')}.`;
}

/**
 * Builds the default video rules instruction
 */
function buildDefaultVideoRules() {
    return `IF 'contentType' is 'Video', 'Reel', 'Shorts', or 'Story', the 'mediaPrompt' MUST be a detailed prompt for generating a video script.`;
}

/**
 * Builds the post caption rules instruction
 */
function buildPostCaptionRules(rules) {
    return `For the 'content' field, you MUST apply the following rules: ${rules.join(', ')}`;
}


// --- The PromptBuilder Class ---

class PromptBuilder {
    constructor() {
        this.components = [];
    }

    addInstruction(text) {
        if (text) {
            this.components.push(text);
        }
        return this;
    }

    addBrandInfo(brandFoundation) {
        this.components.push(buildBrandInfoComponent(brandFoundation));
        return this;
    }

    addPersona(persona) {
        this.components.push(buildPersonaComponent(persona));
        return this;
    }

    addJsonOutput(name, structure) {
        this.components.push(buildJsonOutputComponent(name, structure));
        return this;
    }

    build() {
        return this.components.join('\n\n');
    }
}

// --- Reusable Prompt Components ---

function buildBrandInfoComponent(brandFoundation) {
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

function buildPersonaComponent(persona) {
    let result = "Persona Profile to Embody:\n";
    result += "- Nickname: " + persona.nickName + "\n";
    result += "- Background: " + persona.background + "\n";
    result += "- Voice & Style: " + (persona.voice?.communicationStyle?.voice || '');
    return result;
}

function buildJsonOutputComponent(name, structure) {
    const finalStructure = Array.isArray(structure) ? { [name]: structure } : structure;
    const jsonStructureString = JSON.stringify(finalStructure, null, 2);

    let result = "Response Format Requirement:\n";
    result += "You MUST respond with a single, valid JSON object. Do NOT include any markdown formatting (like ```json), commentary, or any other text outside the JSON object.\n";
    result += "CRITICAL: All string values inside the JSON MUST be properly escaped. Pay special attention to double quotes (\") and newlines (\\n).\n";
    result += "The JSON object's structure must strictly adhere to the following schema AND all MANDATORY rules within fields named '_rule_for_...':\n";
    result += "```json\n";
    result += jsonStructureString + "\n";
    result += "```";
    return result;
}

// --- Prompt Builder Functions for Each Feature ---

const MEDIA_PLAN_JSON_STRUCTURE = {
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

function buildMediaPlanPrompt(params) {
    const { brandFoundation, userPrompt, language, totalPosts, selectedPlatforms, generationOptions: options, brandSettings, adminSettings, persona, selectedProduct, pillar } = params;
    
    const template = adminSettings.prompts?.mediaPlanGeneration?.systemInstruction || `You are an expert social media strategist and content creator. Your task is to create a comprehensive media plan based on the provided information.`;
    const rules = brandSettings.prompts?.rules;

    const promptBuilder = new PromptBuilder()
        .addInstruction(template)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addBrandInfo(brandFoundation)
        .addInstruction(`Content Pillar: ${pillar}`)
        .addInstruction(`User's specific request: ${userPrompt}`)
        .addInstruction(`Total number of posts to generate: ${totalPosts}`)
        .addInstruction(`Selected platforms: ${selectedPlatforms.join(', ')}`)
        .addInstruction(`Content generation options: Tone: ${options.tone}, Style: ${options.style}, Length: ${options.length}, Include Emojis: ${options.includeEmojis}`)
        .addInstruction(selectedProduct ? `Focus Product: ${selectedProduct.productName} - ${selectedProduct.product_description}` : '')
        .addInstruction(persona ? buildPersonaComponent(persona) : '');

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

    promptBuilder.addJsonOutput("MediaPlan", MEDIA_PLAN_JSON_STRUCTURE);
        
    return promptBuilder.build();
}

const BRAND_KIT_JSON_STRUCTURE = {
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

const BRAND_PROFILE_JSON_STRUCTURE = {
    name: "string",
    mission: "string",
    values: "string",
    audience: "string",
    personality: "string"
};

const AUTO_GENERATE_PERSONAS_JSON_STRUCTURE = {
    "personas": [
        {
            "nickName": "string",
            "fullName": "string",
            "background": "Detailed origin story and background of the persona.",
            "backstory": "Key life events and experiences that shaped the persona.",
            "outfitDescription": "Detailed description of their typical clothing and style.",
            "visualCharacteristics": "Detailed description of their physical appearance, mannerisms, and overall visual presence.",
            "mainStyle": "The primary aesthetic or style they embody (e.g., 'Minimalist', 'Bohemian', 'Techwear').",
            "activityField": "The main industry or field of activity they are involved in (e.g., 'Technology', 'Fashion', 'Music').",
            "demographics": {
                "age": "number",
                "gender": "'Male' | 'Female' | 'Non-binary'",
                "location": "string",
                "occupation": "string",
                "incomeLevel": "string"
            },
            "voice": {
                "personalityTraits": ["string"],
                "linguisticRules": ["Specific rules for how the persona communicates, e.g., 'Avoids slang', 'Uses emojis frequently'"],
                "communicationStyle": {
                    "tone": "string",
                    "voice": "string",
                    "preferredChannels": ["string"]
                }
            },
            "goalsAndMotivations": ["string"],
            "painPoints": ["string"],
            "contentTone": "The specific tone to be used when creating content as this persona.",
            "coreCharacteristics": "The most fundamental and defining characteristics of the persona.",
            "keyMessages": "The key messages or themes this persona should consistently communicate.",
            "interestsAndHobbies": ["string"],
            "knowledgeBase": ["string"],
            "brandRelationship": {
                "awareness": "How the persona became aware of the brand.",
                "perception": "What the persona thinks and feels about the brand.",
                "engagement": "How the persona interacts with the brand."
            }
        }
    ]
};

function buildBrandKitPrompt(params) {
    const { brandInfo, language, brandSettings, adminSettings } = params;
    
    const template = adminSettings.prompts?.simple?.generateBrandKit || `You are an expert brand strategist. Your task is to create a comprehensive brand kit based on the provided information.`;

    const prompt = new PromptBuilder()
        .addInstruction(template)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addInstruction(`Brand Information:\n- Name: ${brandInfo.name}\n- Mission: ${brandInfo.mission}\n- Values: ${brandInfo.values}\n- Target Audience: ${brandInfo.audience}\n- Personality: ${brandInfo.personality}`)
        .addJsonOutput("BrandKit", BRAND_KIT_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

function buildAutoGeneratePersonasPrompt(params) {
    const { mission, usp, settings } = params;
    
    const language = settings?.language || 'English';
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert persona specialist. Your task is to create exactly 3 diverse brand personas based on the provided brand information.`)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addInstruction(`You MUST generate exactly 3 diverse personas.`)
        .addInstruction(`Brand Mission: ${mission}`)
        .addInstruction(`Brand USP: ${usp}`)
        .addJsonOutput("Personas", AUTO_GENERATE_PERSONAS_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

function buildGenerateBrandProfilePrompt(params) {
    const { idea, language, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert brand strategist. Your task is to create a brand profile based on the provided business idea.`)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addInstruction(`Business Idea: ${idea}`)
        .addJsonOutput("BrandProfile", BRAND_PROFILE_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

const VIRAL_IDEAS_JSON_STRUCTURE = [
    {
        title: "",
        description: "",
        targetAudience: ""
    }
];

const CONTENT_PACKAGE_JSON_STRUCTURE = {
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

const FACEBOOK_TRENDS_JSON_STRUCTURE = [
    {
        topic: "string",
        keywords: ["string"],
        analysis: "string"
    }
];

const FACEBOOK_POST_IDEAS_JSON_STRUCTURE = [
    {
        title: "string",
        content: "string",
        cta: "string"
    }
];

const PRODUCT_IDEAS_JSON_STRUCTURE = [
    {
        title: "string",
        description: "string",
        targetAudience: "string"
    }
];

const SUGGEST_TRENDS_JSON_STRUCTURE = [
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

const SUGGEST_TRENDS_JSON_STRUCTURE_NEW = {
  trends: [
    {
      industry: "string",
      topic: "string",
      keywords: ["string"],
      links: [
        {
          title: "string",
          url: "string"
        }
      ],
      notes: "string",
      analysis: "string",
      searchVolume: "number",
      competitionLevel: "'Low' | 'Medium' | 'High'",
      peakTimeFrame: "string",
      geographicDistribution: "Record<string, number>", // Country: percentage
      relatedQueries: ["string"],
      trendingScore: "number", // 0-100 score of how trending this is
      sourceUrls: ["string"], // Actual URLs where this trend was found
      category: "string", // Category/classification of the trend
      sentiment: "'Positive' | 'Negative' | 'Neutral'",
      predictedLifespan: "string" // Estimated how long this trend will last
    }
  ]
};

const VIRAL_IDEAS_JSON_STRUCTURE_VIETNAMESE = `
{
  "viralIdeas": [
    {
      "title": "Tiêu đề ý tưởng đầu tiên",
      "description": "Mô tả chi tiết cho ý tưởng đầu tiên.",
      "targetAudience": "Đối tượng mục tiêu cho ý tưởng đầu tiên.",
      "productId": null
    },
    {
      "title": "Tiêu đề ý tưởng thứ hai", 
      "description": "Mô tả chi tiết cho ý tưởng thứ hai.",
      "targetAudience": "Đối tượng mục tiêu cho ý tưởng thứ hai.",
      "productId": null
    },
    {
      "title": "Tiêu đề ý tưởng thứ ba",
      "description": "Mô tả chi tiết cho ý tưởng thứ ba.",
      "targetAudience": "Đối tượng mục tiêu cho ý tưởng thứ ba.",
      "productId": null
    },
    {
      "title": "Tiêu đề ý tưởng thứ tư",
      "description": "Mô tả chi tiết cho ý tưởng thứ tư.",
      "targetAudience": "Đối tượng mục tiêu cho ý tưởng thứ tư.",
      "productId": null
    },
    {
      "title": "Tiêu đề ý tưởng thứ năm", 
      "description": "Mô tả chi tiết cho ý tưởng thứ năm.",
      "targetAudience": "Đối tượng mục tiêu cho ý tưởng thứ năm.",
      "productId": null
    }
  ]
}
`;

function buildTrendSuggestionPrompt(params) {
    const { industry, timePeriod, language, settings, brandFoundation } = params;
    
    const template = settings.prompts?.simple?.suggestTrends || 
        `You are a trend analysis expert. Your task is to suggest relevant industry trends based on the provided information.`;

    const promptBuilder = new PromptBuilder()
        .addInstruction(template)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addInstruction(`Industry: ${industry}`)
        .addInstruction(`Time Period: ${timePeriod}`);

    if (brandFoundation) {
        promptBuilder
            .addInstruction(`Brand Information:`)
            .addInstruction(`- Brand Name: ${brandFoundation.brandName}`)
            .addInstruction(`- Mission: ${brandFoundation.mission}`)
            .addInstruction(`- Target Audience: ${brandFoundation.targetAudience}`)
            .addInstruction(`- Personality: ${brandFoundation.personality}`);
    }

    promptBuilder
        .addInstruction(`Analyze and suggest 3-5 relevant trends for the specified industry and time period. Each trend should include comprehensive search metadata.`)
        .addJsonOutput("trends", SUGGEST_TRENDS_JSON_STRUCTURE);

    return promptBuilder.build();
}

function buildGlobalTrendSuggestionPrompt(params) {
    const { timePeriod, language, settings, brandFoundation } = params;
    
    const template = settings.prompts?.simple?.suggestGlobalTrends || 
        `You are a global trend analysis expert. Your task is to suggest relevant global trends based on the provided information.`;

    const promptBuilder = new PromptBuilder()
        .addInstruction(template)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addInstruction(`Time Period: ${timePeriod}`);

    if (brandFoundation) {
        promptBuilder
            .addInstruction(`Brand Information:`)
            .addInstruction(`- Brand Name: ${brandFoundation.brandName}`)
            .addInstruction(`- Mission: ${brandFoundation.mission}`)
            .addInstruction(`- Target Audience: ${brandFoundation.targetAudience}`)
            .addInstruction(`- Personality: ${brandFoundation.personality}`);
    }

    promptBuilder
        .addInstruction(`Analyze and suggest 3-5 relevant global trends for the specified time period. Each trend should include comprehensive search metadata.`)
        .addJsonOutput("trends", SUGGEST_TRENDS_JSON_STRUCTURE);

    return promptBuilder.build();
}

function buildViralIdeasPrompt(trend, language, settings) {
    const builder = new PromptBuilder();

    const template = settings.prompts?.simple?.generateViralIdeas || `You are a viral content strategist. Your task is to generate a list of viral content ideas based on the provided trend.`;

    builder.addInstruction(template)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addInstruction(`Analyze the following trend:\n- Topic: ${trend.topic}\n- Keywords: ${(trend.keywords || []).join(', ')}`)
        .addInstruction('Generate 5 unique and engaging content ideas.');

    const rules = settings.prompts?.rules;
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

        if ((!rules.shortVideoScript || rules.shortVideoScript.length === 0) && (!rules.longVideoScript || rules.longVideoScript.length === 0)) {
            mediaRules.push(buildDefaultVideoRules());
        }

        if (mediaRules.length > 0) {
            rulesInstruction += `\n- For the 'contentType' field, you MUST ONLY use one of these exact values: 'Carousel', 'Image', 'Video', 'Reel', 'Shorts', 'Story'.`;
            rulesInstruction += `\n- ${mediaRules.join('\n- ')}`;
            hasRules = true;
        }

        if (hasRules) {
            builder.addInstruction(rulesInstruction);
        }
    }

    builder.addJsonOutput('ViralIdeas', VIRAL_IDEAS_JSON_STRUCTURE);

    return builder.build();
}

function buildRefinePostPrompt(params) {
    const { postText, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert content editor. Your task is to refine and improve the provided social media post text.`)
        .addInstruction(`Original post text:\n${postText}`)
        .addInstruction("Improve the text while maintaining its core message and intent.")
        .build();
        
    return prompt;
}

function buildGenerateInCharacterPostPrompt(params) {
    const { persona, objective, platform, keywords, pillar, settings } = params;
    const p = settings.prompts.generateInCharacterPost;
    const language = settings?.language || 'English';
    const promptLayers = [];

    promptLayers.push(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`);

    promptLayers.push(p.rolePlayInstruction
        .replace('{nickName}', persona.nickName)
        .replace('{demographics.age}', persona.demographics?.age)
        .replace('{demographics.occupation}', persona.demographics?.occupation)
        .replace('{demographics.location}', persona.demographics?.location)
    );

    if (persona.voice) {
        promptLayers.push(p.personalityInstruction.replace('{voice.personalityTraits}', persona.voice.personalityTraits?.join(', ')));
        promptLayers.push(p.writingStyleInstruction.replace('{voice.linguisticRules}', persona.voice.linguisticRules?.join('. ')));
    }
    if (persona.backstory) {
        promptLayers.push(p.backstoryInstruction.replace('{backstory}', persona.backstory));
    }
    if (persona.knowledgeBase && persona.knowledgeBase.length > 0) {
        promptLayers.push(p.interestsInstruction.replace('{knowledgeBase}', persona.knowledgeBase.join(', ')));
    }

    promptLayers.push(p.contextPreamble.replace('{date}', new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })));
    promptLayers.push(p.taskInstruction.replace('{platform}', platform));
    promptLayers.push(p.objectiveInstruction.replace('{objective}', objective));

    if (pillar) {
        promptLayers.push(p.pillarInstruction.replace('{pillar}', pillar));
    }
    if (keywords && keywords.length > 0) {
        promptLayers.push(p.keywordsInstruction.replace('{keywords}', keywords.join(', ')));
    }
    promptLayers.push(p.perspectiveInstruction);
    promptLayers.push(p.negativeConstraints);

    return promptLayers.join('\n');
}

function buildGenerateMediaPromptForPostPrompt(params) {
    const { postContent, brandFoundation, language, persona, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert AI art prompt engineer. Your task is to create a detailed image generation prompt based on the provided post content.`)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addBrandInfo(brandFoundation)
        .addInstruction(`Post Title: ${postContent.title}`)
        .addInstruction(`Post Content: ${Array.isArray(postContent.content) ? postContent.content.join('\n') : postContent.content}`)
        .addInstruction(`Content Type: ${postContent.contentType}`)
        .addInstruction(persona ? buildPersonaComponent(persona) : '')
        .addInstruction("Create a highly detailed image generation prompt that visually represents the content.")
        .build();
        
    return prompt;
}

function buildAffiliateCommentPrompt(params) {
    const { post, products, language, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert social media content creator. Your task is to create an engaging comment for a social media post that promotes affiliate products.`)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addInstruction(`Post Title: ${post.title}`)
        .addInstruction(`Post Content: ${Array.isArray(post.content) ? post.content.join('\n') : post.content}`)
        .addInstruction(`Affiliate Products: ${products.map(p => `${p.productName}: ${p.product_description}`).join('; ')}`)
        .build();
        
    return prompt;
}

function buildGenerateContentPackagePrompt(params) {
    const { idea, brandFoundation, language, settings, persona, pillarPlatform, options, selectedProduct, repurposedPlatforms } = params;
    
    const promptBuilder = new PromptBuilder()
        .addInstruction(`You are an expert content creator. Your task is to create a comprehensive content package based on the provided idea.`)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addBrandInfo(brandFoundation)
        .addInstruction(`Idea Title: ${idea.title}`)
        .addInstruction(`Idea Description: ${idea.description}`)
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
    
    promptBuilder.addJsonOutput("ContentPackage", CONTENT_PACKAGE_JSON_STRUCTURE);
        
    return promptBuilder.build();
}

function buildGenerateFacebookTrendsPrompt(params) {
    const { industry, language, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert social media trend analyst. Your task is to identify trending topics on Facebook for a specific industry.`)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addInstruction(`Industry: ${industry}`)
        .addJsonOutput("FacebookTrends", FACEBOOK_TRENDS_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

function buildGeneratePostsForFacebookTrendPrompt(params) {
    const { trend, language, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert Facebook content creator. Your task is to generate post ideas based on a trending topic.`)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addInstruction(`Trend Topic: ${trend.topic}`)
        .addInstruction(`Trend Keywords: ${trend.keywords.join(', ')}`)
        .addInstruction(`Trend Analysis: ${trend.analysis}`)
        .addJsonOutput("FacebookPostIdeas", FACEBOOK_POST_IDEAS_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

function buildGenerateIdeasFromProductPrompt(params) {
    const { product, language, settings } = params;
    
    const prompt = new PromptBuilder()
        .addInstruction(`You are an expert affiliate marketer. Your task is to generate content ideas based on an affiliate product.`)
        .addInstruction(`CRITICAL REQUIREMENT: The entire response MUST be in the following language: ${language}. Do not use any other language.`)
        .addInstruction(`Product Name: ${product.productName}`)
        .addInstruction(`Product Description: ${product.product_description}`)
        .addInstruction(`Product Features: ${product.features?.join(', ') || ''}`)
        .addInstruction(`Use Cases: ${product.use_cases?.join(', ') || ''}`)
        .addJsonOutput("ProductIdeas", PRODUCT_IDEAS_JSON_STRUCTURE)
        .build();
        
    return prompt;
}

export {
    buildMediaPlanPrompt,
    buildBrandKitPrompt,
    buildAutoGeneratePersonasPrompt,
    buildGenerateBrandProfilePrompt,
    buildViralIdeasPrompt,
    buildRefinePostPrompt,
    buildTrendSuggestionPrompt,
    buildGlobalTrendSuggestionPrompt,
    buildGenerateInCharacterPostPrompt,
    buildGenerateMediaPromptForPostPrompt,
    buildAffiliateCommentPrompt,
    buildGenerateContentPackagePrompt,
    buildGenerateFacebookTrendsPrompt,
    buildGeneratePostsForFacebookTrendPrompt,
    buildGenerateIdeasFromProductPrompt
};