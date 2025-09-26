import { buildMediaPlanPrompt, buildGenerateBrandProfilePrompt, buildBrandKitPrompt, buildViralIdeasPrompt, buildAutoGeneratePersonasPrompt, buildTrendSuggestionPrompt, buildGlobalTrendSuggestionPrompt } from './promptBuilder.js';
import { processMediaPlanResponse, processBrandProfileResponse, processBrandKitResponse, processViralIdeasResponse, processAutoGeneratePersonasResponse, processTrendSuggestionResponse } from './responseProcessor.js';
import { executeGeneration } from './aiService.js';
import { getClientAndDb, createOrUpdateBrand, savePersonas } from './mongodb.js';
import { ObjectId } from 'mongodb';

async function generateMediaPlanGroup(payload) {
    // The payload from the task contains all necessary parameters.
    const { brandSettings, adminSettings, ...restOfPayload } = payload;

    // 1. Build the prompt
    const prompt = buildMediaPlanPrompt({
        ...restOfPayload,
        brandSettings: brandSettings,
        adminSettings: adminSettings,
    });

    // 2. Determine models to try (from brandSettings or adminSettings fallback)
    const modelsToTry = [
        brandSettings.textGenerationModel,
        ...(brandSettings.textModelFallbackOrder || []),
        ...(adminSettings.textModelFallbackOrder || [])
    ].filter(Boolean); // Filter out null/undefined

    // 3. Call the AI service with fallback logic
    const { responseText, modelUsed } = await executeGeneration(prompt, modelsToTry, false, true); // Pass true to return modelUsed

    // 4. Process the response
    const mediaPlanGroup = processMediaPlanResponse(responseText, {
        userPrompt: payload.objective, // userPrompt is called objective in the payload
        pillar: payload.pillar,
        settings: brandSettings, // Use brandSettings for processing
        persona: payload.persona,
        selectedProduct: payload.selectedProduct,
    });

    const { db } = await getClientAndDb();
    const mediaPlanGroupsCollection = db.collection('mediaPlanGroups');
    const mediaPlanPostsCollection = db.collection('mediaPlanPosts');

    // Extract the plan (weeks and posts) from the generated mediaPlanGroup
    const fullPlan = mediaPlanGroup.plan;
    // Create a new object for mediaPlanGroup without the nested plan
    const mediaPlanGroupToSave = {
        ...mediaPlanGroup,
        plan: undefined // Remove the nested plan
    };

    // 5. Save the high-level media plan group with modelUsed
    const result = await mediaPlanGroupsCollection.insertOne({
        ...mediaPlanGroupToSave,
        brandId: payload.brandId,
        modelUsed: modelUsed, // Save the model that was actually used
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const mediaPlanGroupId = result.insertedId.toString();

    // 6. Prepare and save individual posts with modelUsed
    const postsToInsert = [];
    let weekIndex = 0;
    for (const week of fullPlan) {
        let postIndex = 0;
        for (const post of week.posts) {
            const postObjectId = new ObjectId(); // Create one ObjectId
            postsToInsert.push({
                ...post,
                _id: postObjectId, // Use the ObjectId here
                id: postObjectId.toString(), // Use its string representation here
                mediaPlanId: mediaPlanGroupId, // Link to the parent media plan group
                brandId: payload.brandId, // Link to brand
                modelUsed: modelUsed, // Record which model generated this post
                week: weekIndex, // Store week index
                theme: week.theme, // Store theme
                postOrder: postIndex, // Store post order within week
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            postIndex++;
        }
        weekIndex++;
    }

    if (postsToInsert.length > 0) {
        await mediaPlanPostsCollection.insertMany(postsToInsert);
    }

    // 7. Return the ID of the newly created media plan group
    return mediaPlanGroupId;
}

async function generateBrandProfile(payload) {
    const { brandSettings, adminSettings, ...restOfPayload } = payload;
    const prompt = buildGenerateBrandProfilePrompt({ ...restOfPayload, settings: brandSettings });
    const modelsToTry = [brandSettings.textGenerationModel, ...(brandSettings.textModelFallbackOrder || []), ...(adminSettings.textModelFallbackOrder || [])].filter(Boolean);
    const { responseText, modelUsed } = await executeGeneration(prompt, modelsToTry, true, true); // Pass true to return modelUsed
    const brandProfile = processBrandProfileResponse(responseText);
    
    // Return both the brand profile and the model used
    return {
        brandProfile,
        modelUsed
    };
}

async function generateBrandKit(payload) {
    const { brandSettings, adminSettings, ...restOfPayload } = payload;
    const prompt = buildBrandKitPrompt({ ...restOfPayload, brandSettings, adminSettings });
    const modelsToTry = [brandSettings.textGenerationModel, ...(brandSettings.textModelFallbackOrder || []), ...(adminSettings.textModelFallbackOrder || [])].filter(Boolean);
    const { responseText, modelUsed } = await executeGeneration(prompt, modelsToTry, false, true); // Pass true to return modelUsed
    const brandKit = processBrandKitResponse(responseText, restOfPayload.language);
    
    // Return both the brand kit and the model used
    return {
        brandKit,
        modelUsed
    };
}

async function createBrandFromIdea(payload) {
    console.log("Starting brand creation from idea...");
    const { idea, language, brandSettings, adminSettings } = payload;

    // 1. Generate Brand Profile
    console.log("Generating brand profile...");
    const brandInfoResult = await generateBrandProfile({ idea, language, brandSettings, adminSettings });
    const brandInfo = brandInfoResult.brandProfile || brandInfoResult;
    const brandProfileModelUsed = brandInfoResult.modelUsed;

    // 2. Generate Brand Kit
    console.log("Generating brand kit...");
    const brandKitResult = await generateBrandKit({ brandInfo, language, brandSettings, adminSettings });
    const generatedAssets = brandKitResult.brandKit || brandKitResult;
    const brandKitModelUsed = brandKitResult.modelUsed;

    // Ensure modelUsed is preserved in the assets
    if (brandProfileModelUsed) generatedAssets.modelUsed = brandProfileModelUsed;
    if (brandKitModelUsed && brandKitModelUsed !== brandProfileModelUsed) generatedAssets.modelUsed = brandKitModelUsed; // Brand kit model takes precedence if different

    // 3. Save to Database
    console.log("Saving new brand to database...");
    const { db } = await getClientAndDb();
    const { brandId } = await createOrUpdateBrand(db, generatedAssets, null);
    console.log(`Successfully created brand with ID: ${brandId}`);

    // 4. Return the new brand ID and model used
    return { 
        brandId,
        modelUsed: generatedAssets.modelUsed || brandKitModelUsed || brandProfileModelUsed
    };
}

async function generateViralIdeas(payload) {
    const { trend, language, settings, brandId } = payload;

    // 1. Build the prompt
    const prompt = buildViralIdeasPrompt(trend, language, settings);

    // 2. Determine models to try
    const modelsToTry = [settings.textGenerationModel, ...(settings.textModelFallbackOrder || [])].filter(Boolean);

    // 3. Call the AI service
    const { responseText, modelUsed } = await executeGeneration(prompt, modelsToTry, false, true); // Pass true to return modelUsed

    // 4. Process the response
    const ideas = processViralIdeasResponse(responseText, trend.id);

    // 5. Save the new ideas to the database with modelUsed
    const { db } = await getClientAndDb();
    const ideasCollection = db.collection('ideas');
    
    const operations = ideas.map(idea => ({
        insertOne: {
            document: {
                ...idea,
                _id: new ObjectId(),
                brandId: brandId,
                trendId: trend.id,
                modelUsed: modelUsed, // Record which model generated this idea
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        }
    }));

    if (operations.length > 0) {
        await ideasCollection.bulkWrite(operations);
    }

    // 6. Return the number of ideas created
    return { ideasCreated: ideas.length };
}

async function generatePersonasForBrand(payload) {
    const { brandId, brandSettings, adminSettings, ...restOfPayload } = payload;
    
    // Validate required inputs
    if (!brandId) {
        throw new Error('brandId is required for persona generation');
    }
    
    // If brandSettings is not provided, try to load them from the database
    let effectiveBrandSettings = brandSettings;
    if (!effectiveBrandSettings) {
        console.log(`[generatePersonasForBrand] brandSettings not provided, loading from database for brandId: ${brandId}`);
        const { db } = await getClientAndDb();
        const brandsCollection = db.collection('brands');
        const brand = await brandsCollection.findOne({ _id: new ObjectId(brandId) });
        
        if (brand && brand.settings) {
            effectiveBrandSettings = brand.settings;
            console.log(`[generatePersonasForBrand] Loaded brand settings from database for brandId: ${brandId}`);
        } else {
            console.warn(`[generatePersonasForBrand] Could not find brand settings for brandId: ${brandId}, using defaults`);
            // Use default settings as fallback
            effectiveBrandSettings = {
                textGenerationModel: 'gemini-1.5-pro-latest',
                imageGenerationModel: 'dall-e-3',
                textModelFallbackOrder: [],
                visionModels: [],
                contentPillars: [],
                language: 'English',
                prompts: { rules: {} }
            };
        }
    }
    
    // Ensure adminSettings are available
    let effectiveAdminSettings = adminSettings;
    if (!effectiveAdminSettings) {
        console.log(`[generatePersonasForBrand] adminSettings not provided, loading from database`);
        const { db } = await getClientAndDb();
        const adminSettingsCollection = db.collection('adminSettings');
        effectiveAdminSettings = await adminSettingsCollection.findOne({});
        
        if (!effectiveAdminSettings) {
            console.warn(`[generatePersonasForBrand] Could not find admin settings, using defaults`);
            effectiveAdminSettings = {
                textGenerationModel: 'gemini-1.5-pro-latest',
                imageGenerationModel: 'dall-e-3',
                textModelFallbackOrder: [],
                visionModels: [],
                contentPillars: [],
                language: 'English',
                prompts: { rules: {} }
            };
        }
    }

    // 1. Build the prompt
    const prompt = buildAutoGeneratePersonasPrompt({ ...restOfPayload, settings: effectiveBrandSettings });

    // 2. Determine models to try
    const modelsToTry = [
        effectiveBrandSettings.textGenerationModel, 
        ...(effectiveBrandSettings.textModelFallbackOrder || []), 
        ...(effectiveAdminSettings.textModelFallbackOrder || [])
    ].filter(Boolean);

    // 3. Call the AI service
    const { responseText, modelUsed } = await executeGeneration(prompt, modelsToTry, true, true);

    // 4. Process the response
    const personas = processAutoGeneratePersonasResponse(responseText, brandId, modelUsed);

    // 5. Save the new personas to the database
    const { db } = await getClientAndDb();
    const insertedIds = await savePersonas(db, personas);

    // 6. Return a meaningful result
    return { 
        message: `${Object.keys(insertedIds).length} personas generated successfully.`,
        personaIds: Object.values(insertedIds).map(id => id.toString()),
        modelUsed: modelUsed
    };
}

async function generateTrends(payload) {
    const { trendType, timePeriod, brandFoundation, settings, brandId } = payload;
    
    // Validate required inputs
    if (!brandId) {
        throw new Error('brandId is required for trend generation');
    }
    
    if (!trendType) {
        throw new Error('trendType (industry or global) is required for trend generation');
    }
    
    // If settings are not provided, try to load them from the database
    let effectiveSettings = settings;
    if (!effectiveSettings) {
        console.log(`[generateTrends] settings not provided, loading from database for brandId: ${brandId}`);
        const { db } = await getClientAndDb();
        const brandsCollection = db.collection('brands');
        const brand = await brandsCollection.findOne({ _id: new ObjectId(brandId) });
        
        if (brand && brand.settings) {
            effectiveSettings = brand.settings;
            console.log(`[generateTrends] Loaded brand settings from database for brandId: ${brandId}`);
        } else {
            console.warn(`[generateTrends] Could not find brand settings for brandId: ${brandId}, using defaults`);
            // Use default settings as fallback
            effectiveSettings = {
                language: 'English',
                textGenerationModel: 'gemini-1.5-pro-latest',
                textModelFallbackOrder: [],
                prompts: { simple: {} }
            };
        }
    }

    // 1. Build the prompt based on trend type
    let prompt;
    if (trendType === 'global') {
        prompt = buildGlobalTrendSuggestionPrompt({ 
            timePeriod, 
            language: effectiveSettings.language, 
            settings: effectiveSettings, 
            brandFoundation 
        });
    } else {
        // Default to industry trends
        prompt = buildTrendSuggestionPrompt({ 
            industry: brandFoundation?.industry || 'general', 
            timePeriod, 
            language: effectiveSettings.language, 
            settings: effectiveSettings, 
            brandFoundation 
        });
    }

    // 2. Determine models to try
    const modelsToTry = [
        effectiveSettings.textGenerationModel, 
        ...(effectiveSettings.textModelFallbackOrder || [])
    ].filter(Boolean);

    // 3. Call the AI service
    const { responseText, modelUsed } = await executeGeneration(prompt, modelsToTry, false, true);

    // 4. Process the response
    const trends = processTrendSuggestionResponse(responseText, brandId, brandFoundation?.industry || 'general', modelUsed);

    // 5. Save the new trends to the database
    const { db } = await getClientAndDb();
    const trendsCollection = db.collection('trends');
    
    const operations = trends.map(trend => ({
        insertOne: {
            document: {
                ...trend,
                _id: new ObjectId(),
                brandId: brandId,
                modelUsed: modelUsed,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        }
    }));

    if (operations.length > 0) {
        await trendsCollection.bulkWrite(operations);
    }

    // 6. Return a meaningful result
    return { 
        message: `${trends.length} trends generated successfully.`,
        trendIds: trends.map(t => t.id),
        modelUsed: modelUsed
    };
}

export {
    generateMediaPlanGroup,
    generateBrandProfile,
    generateBrandKit,
    createBrandFromIdea,
    generateViralIdeas,
    generatePersonasForBrand,
    generateTrends
};