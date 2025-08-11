import type { GeneratedAssets, Settings, MediaPlan, CoreMediaAssets, UnifiedProfileAssets, MediaPlanGroup, BrandFoundation, MediaPlanPost, AffiliateLink, Persona, PostStatus, Trend, Idea, ColorPalette, FontRecommendations, LogoConcept, PersonaPhoto } from '../types';

// --- NORMALIZED SCHEMA TABLE NAMES ---
export const BRANDS_TABLE_NAME = 'Brands';
export const LOGO_CONCEPTS_TABLE_NAME = 'Logo_Concepts';
export const BRAND_VALUES_TABLE_NAME = 'Brand_Values';
export const KEY_MESSAGES_TABLE_NAME = 'Key_Messages';
export const MEDIA_PLANS_TABLE_NAME = 'Media_Plans';
export const POSTS_TABLE_NAME = 'Posts';
// DEPRECATED: export const SETTINGS_TABLE_NAME = 'Settings';
export const AFFILIATE_PRODUCTS_TABLE_NAME = 'Affiliate_Products';
export const PERSONAS_TABLE_NAME = 'Personas';
export const TRENDS_TABLE_NAME = 'Trends';
export const IDEAS_TABLE_NAME = 'Ideas';
export const SOCIAL_ACCOUNTS_TABLE_NAME = 'Social_Accounts';
export const AI_SERVICES_TABLE_NAME = 'AI_Services';
export const AI_MODELS_TABLE_NAME = 'AI_Models';


// --- SCHEMA DEFINITIONS ---

const BRANDS_SCHEMA = [
    { name: 'brand_id', type: 'singleLineText' }, // Primary Key
    { name: 'name', type: 'singleLineText' },
    { name: 'mission', type: 'multilineText' },
    { name: 'usp', type: 'singleLineText' },
    { name: 'target_audience', type: 'multilineText' },
    { name: 'personality', type: 'singleLineText' },
    { name: 'color_palette_json', type: 'multilineText' },
    { name: 'font_recs_json', type: 'multilineText' },
    { name: 'unified_profile_json', type: 'multilineText' },
    // Settings fields are now part of the Brands table
    { name: 'language', type: 'singleLineText' },
    { name: 'total_posts_per_month', type: 'number', options: { precision: 0 } },
    { name: 'media_prompt_suffix', type: 'multilineText' },
    { name: 'affiliate_content_kit', type: 'multilineText' },
    { name: 'text_generation_model', type: 'singleLineText' },
    { name: 'image_generation_model', type: 'singleLineText' },
    // Linked Records (only those that don't scale with multiple instances)
    { name: 'logo_concepts', type: 'multipleRecordLinks', options: { linkedTableName: LOGO_CONCEPTS_TABLE_NAME, prefersSingleRecordLink: false } },
    { name: 'brand_values', type: 'multipleRecordLinks', options: { linkedTableName: BRAND_VALUES_TABLE_NAME, prefersSingleRecordLink: false } },
    { name: 'key_messages', type: 'multipleRecordLinks', options: { linkedTableName: KEY_MESSAGES_TABLE_NAME, prefersSingleRecordLink: false } },
];

const LOGO_CONCEPTS_SCHEMA = [
    { name: 'logo_id', type: 'singleLineText' }, // Primary Key
    { name: 'style', type: 'singleLineText' },
    { name: 'prompt', type: 'multilineText' },
    { name: 'image_key', type: 'singleLineText' },
    { name: 'image_url', type: 'url' },
    { name: 'brand', type: 'multipleRecordLinks', options: { linkedTableName: BRANDS_TABLE_NAME, prefersSingleRecordLink: true } },
];

const BRAND_VALUES_SCHEMA = [
    { name: 'value_id', type: 'singleLineText' }, // Primary Key
    { name: 'text', type: 'singleLineText' },
    { name: 'brand', type: 'multipleRecordLinks', options: { linkedTableName: BRANDS_TABLE_NAME, prefersSingleRecordLink: true } },
];

const KEY_MESSAGES_SCHEMA = [
     { name: 'message_id', type: 'singleLineText' }, // Primary Key
    { name: 'text', type: 'multilineText' },
    { name: 'brand', type: 'multipleRecordLinks', options: { linkedTableName: BRANDS_TABLE_NAME, prefersSingleRecordLink: true } },
];

const PLATFORM_OPTIONS = {
    options: {
        choices: [
            { name: 'YouTube', color: 'redDark1' },
            { name: 'Facebook', color: 'blueDark1' },
            { name: 'Instagram', color: 'purpleDark1' },
            { name: 'TikTok', color: 'cyanDark1' },
            { name: 'Pinterest', color: 'redDark1' },
        ]
    }
};

const MEDIA_PLANS_SCHEMA = [
    { name: 'plan_id', type: 'singleLineText' }, // Primary Key
    { name: 'name', type: 'singleLineText' },
    { name: 'prompt', type: 'multilineText' },
    { name: 'source', type: 'singleLineText' },
    { name: 'product_images_json', type: 'multilineText' },
    { name: 'brand', type: 'multipleRecordLinks', options: { linkedTableName: BRANDS_TABLE_NAME, prefersSingleRecordLink: true } },
    { name: 'persona', type: 'multipleRecordLinks', options: { linkedTableName: PERSONAS_TABLE_NAME, prefersSingleRecordLink: true } },
    { name: 'posts', type: 'multipleRecordLinks', options: { linkedTableName: POSTS_TABLE_NAME, prefersSingleRecordLink: false } },
];

const POSTS_SCHEMA = [
    { name: 'post_id', type: 'singleLineText' }, // Primary Key
    { name: 'title', type: 'singleLineText' },
    { name: 'week', type: 'number', options: { precision: 0 } },
    { name: 'theme', type: 'singleLineText' },
    { name: 'platform', type: 'singleSelect', ...PLATFORM_OPTIONS },
    { name: 'content_type', type: 'singleLineText' },
    { name: 'content', type: 'multilineText' },
    { name: 'description', type: 'multilineText' },
    { name: 'hashtags', type: 'multilineText' },
    { name: 'cta', type: 'singleLineText' },
    { name: 'media_prompt', type: 'multilineText' },
    { name: 'script', type: 'multilineText' },
    { name: 'image_key', type: 'singleLineText' },
    { name: 'image_url', type: 'url' },
    { name: 'video_key', type: 'singleLineText' },
    { name: 'video_url', type: 'url' },
    { name: 'media_order', type: 'singleLineText' },
    { name: 'source_urls', type: 'multilineText' },
    { name: 'scheduled_at', type: 'dateTime', options: { dateFormat: { name: 'local' }, timeFormat: { name: '12hour' }, timeZone: 'client' } },
    { name: 'published_at', type: 'dateTime', options: { dateFormat: { name: 'local' }, timeFormat: { name: '12hour' }, timeZone: 'client' } },
    { name: 'published_url', type: 'url' },
    { name: 'auto_comment', type: 'multilineText' },
    { name: 'status', type: 'singleSelect', options: { choices: [{ name: 'Draft' }, { name: 'Scheduled' }, { name: 'Published' }, { name: 'Error' }]}},
    { name: 'is_pillar', type: 'checkbox', options: { icon: 'check', color: 'greenBright' } },
    // Linked Records
    { name: 'brand', type: 'multipleRecordLinks', options: { linkedTableName: BRANDS_TABLE_NAME, prefersSingleRecordLink: true } },
    { name: 'media_plan', type: 'multipleRecordLinks', options: { linkedTableName: MEDIA_PLANS_TABLE_NAME, prefersSingleRecordLink: true } },
    { name: 'promoted_products', type: 'multipleRecordLinks', options: { linkedTableName: AFFILIATE_PRODUCTS_TABLE_NAME, prefersSingleRecordLink: false } },
];

const AFFILIATE_PRODUCTS_SCHEMA = [
    { name: 'link_id', type: 'singleLineText' }, // Primary Key
    { name: 'product_id', type: 'singleLineText' },
    { name: 'product_name', type: 'singleLineText' },
    { name: 'price', type: 'currency', options: { symbol: 'VND', precision: 0 } },
    { name: 'sales_volume', type: 'number', options: { precision: 0 } },
    { name: 'provider_name', type: 'singleLineText' },
    { name: 'commission_rate', type: 'percent', options: { precision: 1 } },
    { name: 'commission_value', type: 'currency', options: { symbol: 'VND', precision: 0 } },
    { name: 'product_link', type: 'url' },
    { name: 'promotion_link', type: 'url' },
    { name: 'product_avatar', type: 'url' },
    { name: 'product_description', type: 'multilineText' },
    { name: 'features', type: 'multilineText' },
    { name: 'use_cases', type: 'multilineText' },
    { name: 'product_image_links', type: 'multilineText' },
    { name: 'customer_reviews', type: 'multilineText' },
    { name: 'product_rating', type: 'number', options: { precision: 1 } },
    { name: 'brand', type: 'multipleRecordLinks', options: { linkedTableName: BRANDS_TABLE_NAME, prefersSingleRecordLink: true } },
];

const PERSONAS_SCHEMA = [
    { name: 'persona_id', type: 'singleLineText' }, // Primary Key
    { name: 'nick_name', type: 'singleLineText' },
    { name: 'main_style', type: 'singleLineText' },
    { name: 'activity_field', type: 'singleLineText' },
    { name: 'outfit_description', type: 'multilineText' },
    { name: 'avatar_image_key', type: 'singleLineText' },
    { name: 'avatar_image_url', type: 'url' },
    { name: 'brand', type: 'multipleRecordLinks', options: { linkedTableName: BRANDS_TABLE_NAME, prefersSingleRecordLink: true } },
    { name: 'social_accounts', type: 'multipleRecordLinks', options: { linkedTableName: SOCIAL_ACCOUNTS_TABLE_NAME, prefersSingleRecordLink: false } },
];

const TRENDS_SCHEMA = [
    { name: 'trend_id', type: 'singleLineText' }, // Primary Key
    { name: 'industry', type: 'singleLineText' },
    { name: 'topic', type: 'multilineText' },
    { name: 'keywords', type: 'multilineText' },
    { name: 'links_json', type: 'multilineText' },
    { name: 'notes', type: 'multilineText' },
    { name: 'created_at', type: 'dateTime', options: { dateFormat: { name: 'local' }, timeFormat: { name: '24hour' }, timeZone: 'client' }},
    { name: 'brand', type: 'multipleRecordLinks', options: { linkedTableName: BRANDS_TABLE_NAME, prefersSingleRecordLink: true } },
    { name: 'ideas', type: 'multipleRecordLinks', options: { linkedTableName: IDEAS_TABLE_NAME, prefersSingleRecordLink: false } },
];

const IDEAS_SCHEMA = [
    { name: 'idea_id', type: 'singleLineText' }, // Primary Key
    { name: 'title', type: 'singleLineText' },
    { name: 'description', type: 'multilineText' },
    { name: 'target_audience', type: 'singleLineText' },
    { name: 'product_id', type: 'singleLineText' }, // New field to store the source product ID
    { name: 'trend', type: 'multipleRecordLinks', options: { linkedTableName: TRENDS_TABLE_NAME, prefersSingleRecordLink: true } },
];

const SOCIAL_ACCOUNTS_SCHEMA = [
    { name: 'account_id', type: 'singleLineText' }, // Primary Key
    { name: 'platform', type: 'singleLineText' },
    { name: 'credentials_json', type: 'multilineText' },
    { name: 'persona', type: 'multipleRecordLinks', options: { linkedTableName: PERSONAS_TABLE_NAME, prefersSingleRecordLink: true } },
];

const AI_SERVICES_SCHEMA = [
    { name: 'service_id', type: 'singleLineText' }, // Primary Key
    { name: 'name', type: 'singleLineText' },
    { name: 'description', type: 'multilineText' },
];

const AI_MODELS_SCHEMA = [
    { name: 'model_id', type: 'singleLineText' }, // Primary Key
    { name: 'name', type: 'singleLineText' },
    { name: 'provider', type: 'singleLineText' },
    { name: 'capabilities', type: 'multipleSelects', options: { choices: [{ name: 'text' }, { name: 'image' }, { name: 'audio' }, { name: 'video' }, { name: 'code' }] } },
    { name: 'service', type: 'multipleRecordLinks', options: { linkedTableName: AI_SERVICES_TABLE_NAME, prefersSingleRecordLink: true } },
];

export const ALL_TABLE_SCHEMAS = {
    [BRANDS_TABLE_NAME]: BRANDS_SCHEMA,
    [LOGO_CONCEPTS_TABLE_NAME]: LOGO_CONCEPTS_SCHEMA,
    [BRAND_VALUES_TABLE_NAME]: BRAND_VALUES_SCHEMA,
    [KEY_MESSAGES_TABLE_NAME]: KEY_MESSAGES_SCHEMA,
    [MEDIA_PLANS_TABLE_NAME]: MEDIA_PLANS_SCHEMA,
    [POSTS_TABLE_NAME]: POSTS_SCHEMA,
    // [SETTINGS_TABLE_NAME]: SETTINGS_SCHEMA, // DEPRECATED
    [AFFILIATE_PRODUCTS_TABLE_NAME]: AFFILIATE_PRODUCTS_SCHEMA,
    [PERSONAS_TABLE_NAME]: PERSONAS_SCHEMA,
    [TRENDS_TABLE_NAME]: TRENDS_SCHEMA,
    [IDEAS_TABLE_NAME]: IDEAS_SCHEMA,
    [SOCIAL_ACCOUNTS_TABLE_NAME]: SOCIAL_ACCOUNTS_SCHEMA,
    [AI_SERVICES_TABLE_NAME]: AI_SERVICES_SCHEMA,
    [AI_MODELS_TABLE_NAME]: AI_MODELS_SCHEMA,
};

let schemaEnsured = false;

// --- API HELPERS (Unchanged) ---
export const airtableFetch = async (url: string, options: RequestInit) => {
    const personalAccessToken = import.meta.env.VITE_AIRTABLE_PAT;
    if (!personalAccessToken) {
        throw new Error("Airtable Personal Access Token is not configured in the environment (AIRTABLE_PAT).");
    }
    const headers = {
        'Authorization': `Bearer ${personalAccessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    console.log("Airtable Fetch URL:", url);
    console.log("Airtable Fetch Options:", options);
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return response.json();
};

export const ensureAllTablesExist = async (): Promise<void> => {
    if (schemaEnsured) return;
    
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!baseId) throw new Error("Airtable Base ID is not configured in the environment.");
    
    const personalAccessToken = import.meta.env.VITE_AIRTABLE_PAT;
    if (!personalAccessToken) throw new Error("Airtable Personal Access Token is not configured in the environment.");
    
    try {
        const tablesResponse = await airtableFetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {});
        const existingTableNames = new Set(tablesResponse.tables.map((t: any) => t.name));
        
        console.log("Existing tables in Airtable:", Array.from(existingTableNames));
        
        // Check if any tables need to be created
        const missingTables = Object.keys(ALL_TABLE_SCHEMAS).filter(name => !existingTableNames.has(name));
        
        if (missingTables.length > 0) {
            console.log(`Creating ${missingTables.length} new tables:`, missingTables.join(', '));
            
            // Sort tables to ensure dependencies are created first
            // AI_Models depends on AI_Services, so AI_Services must be created first
            const sortedTables = [...missingTables].sort((a, b) => {
                if (a === AI_SERVICES_TABLE_NAME && b === AI_MODELS_TABLE_NAME) return -1;
                if (a === AI_MODELS_TABLE_NAME && b === AI_SERVICES_TABLE_NAME) return 1;
                return 0;
            });
            
            console.log("Creating tables in order:", sortedTables.join(', '));
            
            // Create tables one by one to ensure proper structure
            for (const tableName of sortedTables) {
                const schema = ALL_TABLE_SCHEMAS[tableName];
                console.log(`Attempting to create table: ${tableName}`);
                console.log(`Schema for ${tableName}:`, JSON.stringify(schema, null, 2));
                
                try {
                    await airtableFetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
                        method: 'POST',
                        body: JSON.stringify({ 
                            name: tableName,
                            fields: schema.map(field => {
                                // Transform our schema format to Airtable's expected format
                                const { name, type, options, ...rest } = field;
                                const airtableField: any = { 
                                    name, 
                                    type,
                                    ...rest
                                };
                                
                                // Handle special field types that need options
                                if (options) {
                                    // For linked record fields, we need to include the options as-is
                                    // Airtable should handle the linking properly
                                    airtableField.options = options;
                                }
                                
                                return airtableField;
                            })
                        })
                    });
                    console.log(`Successfully created table: ${tableName}`);
                } catch (createError) {
                    console.error(`Failed to create table ${tableName}:`, createError);
                    // Continue with other tables even if one fails
                }
            }

            // Re-fetch table list after creation attempts
            const tablesResponse2 = await airtableFetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {});
            const existingTableNames2 = new Set(tablesResponse2.tables.map((t: any) => t.name));
            
            console.log("Tables after creation attempts:", Array.from(existingTableNames2));

            // Explicitly check for AI_Services_TABLE_NAME
            if (!existingTableNames2.has(AI_SERVICES_TABLE_NAME)) {
                throw new Error(`Critical table '${AI_SERVICES_TABLE_NAME}' could not be created or found. Please check your Airtable PAT permissions (schema:write) and Base ID.`);
            }
        } else {
            console.log("All required tables already exist.");
        }
        
        schemaEnsured = true;
    } catch (error) {
        console.error("Failed to ensure Airtable schema:", error);
        throw error;
    }
};

const findRecordByField = async (tableName: string, fieldName: string, value: string) => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const encodedValue = encodeURIComponent(value);
    const url = `https://api.airtable.com/v0/${baseId}/${tableName}?filterByFormula={${fieldName}}='${encodedValue}'`;
    const response = await airtableFetch(url, {});
    return response.records && response.records.length > 0 ? response.records[0] : null;
};

const fetchFullRecordsByFormula = async (tableName: string, formula: string, fields?: string[]) => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    let url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
    const queryParams: string[] = [];

    if (formula) {
        queryParams.push(`filterByFormula=${encodeURIComponent(formula)}`);
    }

    if (fields && fields.length > 0) {
        fields.forEach(f => queryParams.push(`fields[]=${encodeURIComponent(f)}`));
    }

    if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
    }

    const response = await airtableFetch(url, {});
    return response.records || [];
};

const sendToAirtable = async (records: { fields: Record<string, any> }[], tableName: string) => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
    
    const chunks = [];
    for (let i = 0; i < records.length; i += 10) {
        chunks.push(records.slice(i, i + 10));
    }
    
    const results = [];
    for (const chunk of chunks) {
        const response = await airtableFetch(url, {
            method: 'POST',
            body: JSON.stringify({ records: chunk })
        });
        results.push(...response.records);
    }
    return results;
};

const patchAirtableRecords = async (tableName: string, records: { id: string; fields: Record<string, any> }[]) => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
    
    const chunks = [];
    for (let i = 0; i < records.length; i += 10) {
        chunks.push(records.slice(i, i + 10));
    }
    
    const results = [];
    for (const chunk of chunks) {
        const response = await airtableFetch(url, {
            method: 'PATCH',
            body: JSON.stringify({ records: chunk })
        });
        results.push(...response.records);
    }
    return results;
};

const deleteAirtableRecords = async (tableName: string, recordIds: string[]) => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
    
    const chunks = [];
    for (let i = 0; i < recordIds.length; i += 10) {
        chunks.push(recordIds.slice(i, i + 10));
    }
    
    for (const chunk of chunks) {
        const deleteUrl = url + '?' + chunk.map(id => `records[]=${id}`).join('&');
        await airtableFetch(deleteUrl, { method: 'DELETE' });
    }
};

// --- MAIN ASSET LOADING (Unchanged) ---
export const createOrUpdateBrandRecord = async (
    assets: GeneratedAssets,
    settings: Settings,
    imageUrls: Record<string, string>,
    brandId: string | null
): Promise<string> => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!baseId) throw new Error("Airtable Base ID is not configured in the environment.");
    
    const personalAccessToken = import.meta.env.VITE_AIRTABLE_PAT;
    if (!personalAccessToken) throw new Error("Airtable Personal Access Token is not configured in the environment.");
    
    await ensureAllTablesExist();
    
    let brandRecordId: string;
    
    if (brandId) {
        // Update existing brand
        const existingBrandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
        if (!existingBrandRecord) throw new Error(`Brand with ID ${brandId} not found.`);
        brandRecordId = existingBrandRecord.id;
        
        const brandFields = {
            brand_id: brandId,
            name: assets.brandFoundation.brandName,
            mission: assets.brandFoundation.mission,
            usp: assets.brandFoundation.usp,
            target_audience: assets.brandFoundation.targetAudience,
            personality: assets.brandFoundation.personality,
            color_palette_json: JSON.stringify(assets.coreMediaAssets.colorPalette),
            font_recs_json: JSON.stringify(assets.coreMediaAssets.fontRecommendations),
            unified_profile_json: JSON.stringify(assets.unifiedProfileAssets),
            language: settings.language,
            total_posts_per_month: settings.totalPostsPerMonth,
            media_prompt_suffix: settings.mediaPromptSuffix,
            affiliate_content_kit: settings.affiliateContentKit,
            text_generation_model: settings.textGenerationModel,
            image_generation_model: settings.imageGenerationModel,
        };
        
        await airtableFetch(`https://api.airtable.com/v0/${baseId}/${BRANDS_TABLE_NAME}`, {
            method: 'PATCH',
            body: JSON.stringify({ records: [{ id: brandRecordId, fields: brandFields }] })
        });
    } else {
        // Create new brand
        const newBrandId = crypto.randomUUID();
        const brandFields = {
            brand_id: newBrandId,
            name: assets.brandFoundation.brandName,
            mission: assets.brandFoundation.mission,
            usp: assets.brandFoundation.usp,
            target_audience: assets.brandFoundation.targetAudience,
            personality: assets.brandFoundation.personality,
            color_palette_json: JSON.stringify(assets.coreMediaAssets.colorPalette),
            font_recs_json: JSON.stringify(assets.coreMediaAssets.fontRecommendations),
            unified_profile_json: JSON.stringify(assets.unifiedProfileAssets),
            language: settings.language,
            total_posts_per_month: settings.totalPostsPerMonth,
            media_prompt_suffix: settings.mediaPromptSuffix,
            affiliate_content_kit: settings.affiliateContentKit,
            text_generation_model: settings.textGenerationModel,
            image_generation_model: settings.imageGenerationModel,
        };
        
        const response = await airtableFetch(`https://api.airtable.com/v0/${baseId}/${BRANDS_TABLE_NAME}`, {
            method: 'POST',
            body: JSON.stringify({ records: [{ fields: brandFields }] })
        });
        brandRecordId = response.records[0].id;
        brandId = newBrandId;
    }
    
    // Save Logo Concepts
    const logoConceptRecords = assets.coreMediaAssets.logoConcepts.map(logo => ({
        fields: {
            logo_id: logo.id,
            style: logo.style,
            prompt: logo.prompt,
            image_key: logo.imageKey,
            image_url: imageUrls[logo.imageKey],
            brand: [brandRecordId]
        }
    }));
    
    if (logoConceptRecords.length > 0) {
        await sendToAirtable(logoConceptRecords, LOGO_CONCEPTS_TABLE_NAME);
    }
    
    // Save Brand Values
    const brandValueRecords = assets.brandFoundation.values.map(value => ({
        fields: {
            value_id: crypto.randomUUID(),
            text: value,
            brand: [brandRecordId]
        }
    }));
    
    if (brandValueRecords.length > 0) {
        await sendToAirtable(brandValueRecords, BRAND_VALUES_TABLE_NAME);
    }
    
    // Save Key Messages
    const keyMessageRecords = assets.brandFoundation.keyMessaging.map(message => ({
        fields: {
            message_id: crypto.randomUUID(),
            text: message,
            brand: [brandRecordId]
        }
    }));
    
    if (keyMessageRecords.length > 0) {
        await sendToAirtable(keyMessageRecords, KEY_MESSAGES_TABLE_NAME);
    }
    
    return brandId;
};

// --- SETTINGS FUNCTIONS (Unchanged) ---
export const saveSettingsToAirtable = async (settings: Settings, brandId: string): Promise<void> => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) throw new Error(`Brand with ID ${brandId} not found for saving settings.`);
    
    const fieldsToUpdate = {
        language: settings.language,
        total_posts_per_month: settings.totalPostsPerMonth,
        media_prompt_suffix: settings.mediaPromptSuffix,
        affiliate_content_kit: settings.affiliateContentKit,
        text_generation_model: settings.textGenerationModel,
        image_generation_model: settings.imageGenerationModel,
    };
    
    await patchAirtableRecords(BRANDS_TABLE_NAME, [{ id: brandRecord.id, fields: fieldsToUpdate }]);
};

export const fetchSettingsFromAirtable = async (brandId: string): Promise<Settings | null> => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) return null;
    
    const fields = brandRecord.fields;
    const settings: Settings = {
        language: fields.language,
        totalPostsPerMonth: fields.total_posts_per_month,
        mediaPromptSuffix: fields.media_prompt_suffix,
        affiliateContentKit: fields.affiliate_content_kit,
        textGenerationModel: fields.text_generation_model,
        imageGenerationModel: fields.image_generation_model,
    };
    
    return settings;
};

// --- MAIN ASSET LOADING (Unchanged) ---
export const loadProjectFromAirtable = async (brandId: string): Promise<{ assets: GeneratedAssets; settings: Settings; generatedImages: Record<string, string>; generatedVideos: Record<string, string>; brandId: string; }> => {
    await ensureAllTablesExist();
    
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) throw new Error(`Brand with ID ${brandId} not found.`);
    
    const fields = brandRecord.fields;
    const brandRecordId = brandRecord.id;
    
    // Load Brand Foundation
    const brandFoundation: BrandFoundation = {
        brandName: fields.name,
        mission: fields.mission,
        values: fields.brand_values ? fields.brand_values.map((v: any) => v.text) : [],
        targetAudience: fields.target_audience,
        personality: fields.personality,
        keyMessaging: fields.key_messages ? fields.key_messages.map((m: any) => m.text) : [],
        usp: fields.usp,
    };
    
    // Load Core Media Assets
    const logoConcepts = fields.logo_concepts ? fields.logo_concepts.map((logo: any) => ({
        id: logo.logo_id,
        style: logo.style,
        prompt: logo.prompt,
        imageKey: logo.image_key,
    })) : [];
    
    const coreMediaAssets: CoreMediaAssets = {
        logoConcepts,
        colorPalette: JSON.parse(fields.color_palette_json || '{}'),
        fontRecommendations: JSON.parse(fields.font_recs_json || '{}'),
    };
    
    // Load Unified Profile Assets
    const unifiedProfileAssets: UnifiedProfileAssets = JSON.parse(fields.unified_profile_json || '{}');
    
    // Load Affiliate Links
    const linkRecords = await fetchFullRecordsByFormula(AFFILIATE_PRODUCTS_TABLE_NAME, `{brand} = '${brandRecordId}'`);
    const affiliateLinks: AffiliateLink[] = linkRecords.map((r: any) => ({
        id: r.fields.link_id,
        productId: r.fields.product_id,
        productName: r.fields.product_name,
        price: r.fields.price,
        salesVolume: r.fields.sales_volume,
        providerName: r.fields.provider_name,
        commissionRate: r.fields.commission_rate * 100,
        commissionValue: r.fields.commission_value,
        productLink: r.fields.product_link,
        promotionLink: r.fields.promotion_link,
    }));
    
    // Load Personas
    const personaRecords = await fetchFullRecordsByFormula(PERSONAS_TABLE_NAME, `{brand} = '${brandRecordId}'`);
    const personas: Persona[] = personaRecords.map((r: any) => ({
        id: r.fields.persona_id,
        nickName: r.fields.nick_name,
        mainStyle: r.fields.main_style,
        activityField: r.fields.activity_field,
        outfitDescription: r.fields.outfit_description,
        avatarImageKey: r.fields.avatar_image_key,
        avatarImageUrl: r.fields.avatar_image_url,
        photos: [], // Will be populated from social accounts
        socialAccounts: [], // Will be populated in App.tsx
    }));
    
    // Load Trends and Ideas
    const trendRecords = await fetchFullRecordsByFormula(TRENDS_TABLE_NAME, `{brand} = '${brandRecordId}'`);
    const trendRecordIdToUUIDMap = new Map(trendRecords.map((r: any) => [r.id, r.fields.trend_id]));
    
    const ideaRecords = await fetchFullRecordsByFormula(IDEAS_TABLE_NAME, `OR(${trendRecords.map((t: any) => `{trend} = '${t.id}'`).join(',')})`);
    
    const trends: Trend[] = trendRecords.map((r: any) => ({
        id: r.fields.trend_id,
        brandId: brandId,
        industry: r.fields.industry,
        topic: r.fields.topic,
        keywords: (r.fields.keywords || '').split(',').map((k: string) => k.trim()).filter(Boolean),
        links: JSON.parse(r.fields.links_json || '[]'),
        notes: r.fields.notes,
        analysis: r.fields.analysis,
        createdAt: r.fields.created_at,
    }));
    
    const ideas: Idea[] = ideaRecords.map((r: any) => ({
        id: r.fields.idea_id,
        trendId: (r.fields.trend && r.fields.trend.length > 0) ? trendRecordIdToUUIDMap.get(r.fields.trend[0]) || '' : '',
        title: r.fields.title,
        description: r.fields.description,
        targetAudience: r.fields.target_audience,
        productId: r.fields.product_id, // Include the product ID if it exists
    }));
    
    const fullAssets: GeneratedAssets = {
        brandFoundation,
        coreMediaAssets,
        unifiedProfileAssets,
        mediaPlans: [], // Loaded on demand
        affiliateLinks,
        personas,
        trends,
        ideas,
    };
    
    const settings = await fetchSettingsFromAirtable(brandId) || {};
    
    // For image URLs, we'll need to load them from the individual records
    // Since we don't have a direct way to get all image URLs, we'll return empty objects
    // and let the individual record loading handle image URLs
    const generatedImages: Record<string, string> = {};
    const generatedVideos: Record<string, string> = {};
    
    return { assets: fullAssets, settings, generatedImages, generatedVideos, brandId };
};

const genericSaver = async <T extends { id: string }>(items: T[], brandId: string, tableName: string, idFieldName: string, mapToFields: (item: T, brandRecordId: string) => Record<string, any>) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) throw new Error(`Brand with ID ${brandId} not found for saving to ${tableName}.`);
    const brandRecordId = brandRecord.id;
    
    const recordsToUpsert = await Promise.all(items.map(async item => {
        const fields = mapToFields(item, brandRecordId);
        const existingRecord = await findRecordByField(tableName, idFieldName, item.id);
        return existingRecord ? { id: existingRecord.id, fields } : { fields };
    }));
    
    const toCreate = recordsToUpsert.filter(r => !r.id);
    const toPatch = recordsToUpsert.filter(r => r.id);
    
    if (toCreate.length > 0) await sendToAirtable(toCreate, tableName);
    if (toPatch.length > 0) await patchAirtableRecords(tableName, toPatch);
};

export const saveAffiliateLinks = async (links: AffiliateLink[], brandId: string) => {
    await genericSaver(links, brandId, AFFILIATE_PRODUCTS_TABLE_NAME, 'link_id', (link, brandRecordId) => ({
        link_id: link.id,
        product_id: link.productId,
        product_name: link.productName,
        price: link.price,
        sales_volume: link.salesVolume,
        provider_name: link.providerName,
        commission_rate: link.commissionRate / 100,
        commission_value: link.commissionValue,
        product_link: link.productLink,
        promotion_link: link.promotionLink,
        brand: [brandRecordId]
    }));
};

export const deleteAffiliateLink = async (linkId: string, brandId: string) => {
    const record = await findRecordByField(AFFILIATE_PRODUCTS_TABLE_NAME, 'link_id', linkId);
    if (record) await deleteAirtableRecords(AFFILIATE_PRODUCTS_TABLE_NAME, [record.id]);
};

export const savePersona = async (persona: Persona, brandId: string) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) throw new Error(`Brand with ID ${brandId} not found for saving persona.`);
    const brandRecordId = brandRecord.id;
    
    // 1. Save/Update Persona record
    const personaFields = {
        persona_id: persona.id,
        nick_name: persona.nickName,
        main_style: persona.mainStyle,
        activity_field: persona.activityField,
        outfit_description: persona.outfitDescription,
        avatar_image_key: persona.avatarImageKey,
        avatar_image_url: persona.avatarImageUrl,
        brand: [brandRecordId]
    };
    
    let personaAirtableRecord;
    const existingPersonaRecord = await findRecordByField(PERSONAS_TABLE_NAME, 'persona_id', persona.id);
    
    if (existingPersonaRecord) {
        personaAirtableRecord = (await patchAirtableRecords(PERSONAS_TABLE_NAME, [{ id: existingPersonaRecord.id, fields: personaFields }]))[0];
    } else {
        personaAirtableRecord = (await sendToAirtable([{ fields: personaFields }], PERSONAS_TABLE_NAME))[0];
        // No need to link back to the brand since we query by brand ID directly
    }
    const personaRecordId = personaAirtableRecord.id;
    
    // 2. Manage Social Accounts for this Persona
    const existingSocialAccountRecords = await fetchFullRecordsByFormula(SOCIAL_ACCOUNTS_TABLE_NAME, `{persona} = '${personaRecordId}'`);
    const existingSocialAccountMap = new Map(existingSocialAccountRecords.map((r: any) => [r.fields.platform, r]));
    
    const socialAccountsToCreate = [];
    const socialAccountsToUpdate = [];
    const socialAccountsToDeleteRecordIds = [];
    
    // Determine which accounts to create/update/delete
    for (const socialAccount of (persona.socialAccounts || [])) {
        const existingRecordForPlatform = existingSocialAccountMap.get(socialAccount.platform);
        if (existingRecordForPlatform) {
            // Update existing
            socialAccountsToUpdate.push({
                id: existingRecordForPlatform.id,
                fields: {
                    account_id: socialAccount.platform + '_' + persona.id, // Ensure unique ID
                    platform: socialAccount.platform,
                    credentials_json: JSON.stringify(socialAccount.credentials),
                    persona: [personaRecordId],
                }
            });
            existingSocialAccountMap.delete(socialAccount.platform); // Mark as processed
        } else {
            // Create new
            socialAccountsToCreate.push({
                fields: {
                    account_id: socialAccount.platform + '_' + persona.id, // Ensure unique ID
                    platform: socialAccount.platform,
                    credentials_json: JSON.stringify(socialAccount.credentials),
                    persona: [personaRecordId],
                }
            });
        }
    }
    
    // Any remaining in existingSocialAccountMap should be deleted
    for (const [platform, record] of existingSocialAccountMap.entries()) {
        socialAccountsToDeleteRecordIds.push(record.id);
    }
    
    // Perform Airtable operations for social accounts
    if (socialAccountsToCreate.length > 0) {
        await sendToAirtable(socialAccountsToCreate, SOCIAL_ACCOUNTS_TABLE_NAME);
    }
    if (socialAccountsToUpdate.length > 0) {
        await patchAirtableRecords(SOCIAL_ACCOUNTS_TABLE_NAME, socialAccountsToUpdate);
    }
    if (socialAccountsToDeleteRecordIds.length > 0) {
        await deleteAirtableRecords(SOCIAL_ACCOUNTS_TABLE_NAME, socialAccountsToDeleteRecordIds);
    }
};

export const deletePersonaFromAirtable = async (personaId: string, brandId: string) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    const personaRecord = await findRecordByField(PERSONAS_TABLE_NAME, 'persona_id', personaId);
    
    if (personaRecord) {
        // 1. Delete associated social accounts
        const socialAccountRecords = await fetchFullRecordsByFormula(SOCIAL_ACCOUNTS_TABLE_NAME, `{persona} = '${personaRecord.id}'`);
        if (socialAccountRecords.length > 0) {
            const socialAccountRecordIds = socialAccountRecords.map(r => r.id);
            await deleteAirtableRecords(SOCIAL_ACCOUNTS_TABLE_NAME, socialAccountRecordIds);
        }
        
        // 2. Delete the persona record itself
        await deleteAirtableRecords(PERSONAS_TABLE_NAME, [personaRecord.id]);
    }
};

export const assignPersonaToPlanInAirtable = async (planId: string, personaId: string | null, updatedPosts: MediaPlanPost[], brandId: string) => {
    const planRecord = await findRecordByField(MEDIA_PLANS_TABLE_NAME, 'plan_id', planId);
    if (!planRecord) throw new Error("Plan not found in Airtable to assign persona.");
    
    let personaRecordId: string[] = [];
    if (personaId) {
        const personaRecord = await findRecordByField(PERSONAS_TABLE_NAME, 'persona_id', personaId);
        if (personaRecord) personaRecordId = [personaRecord.id];
    }
    
    // Update plan's persona link
    await patchAirtableRecords(MEDIA_PLANS_TABLE_NAME, [{ id: planRecord.id, fields: { persona: personaRecordId } }]);
    
    // Update image prompts on all associated posts
    const postUpdates = updatedPosts.map(post => ({
        postId: post.id,
        fields: { media_prompt: Array.isArray(post.mediaPrompt) ? JSON.stringify(post.mediaPrompt) : post.mediaPrompt }
    }));
    await bulkPatchPosts(postUpdates, brandId);
};

export const updateMediaPlanPostInAirtable = async (post: MediaPlanPost, brandId: string, imageUrl?: string, videoUrl?: string) => {
    const postRecord = await findRecordByField(POSTS_TABLE_NAME, 'post_id', post.id);
    if (!postRecord) {
        console.warn(`Could not find post with ID ${post.id} in Airtable to update.`);
        return;
    }
    
    const fieldsToUpdate: Record<string, any> = {
        title: post.title,
        week: post.weekIndex,
        theme: post.theme,
        platform: post.platform,
        content_type: post.contentType,
        content: post.content,
        description: post.description,
        hashtags: post.hashtags.join(', '),
        cta: post.cta,
        media_prompt: Array.isArray(post.mediaPrompt) ? JSON.stringify(post.mediaPrompt) : post.mediaPrompt,
        script: post.script,
        image_key: post.imageKey,
        image_url: imageUrl,
        video_key: post.videoKey,
        video_url: videoUrl,
        media_order: post.mediaOrder?.join(','),
        source_urls: post.sources?.map(s => `${s.title}:${s.uri}`).join('\n'),
        scheduled_at: post.scheduledAt,
        published_at: post.publishedAt,
        published_url: post.publishedUrl,
        auto_comment: post.autoComment,
        status: post.status,
        is_pillar: post.isPillar,
    };
    
    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]);
    
    await patchAirtableRecords(POSTS_TABLE_NAME, [{ id: postRecord.id, fields: fieldsToUpdate }]);
};

export const saveMediaPlanGroup = async (group: MediaPlanGroup, imageUrls: Record<string, string>, brandId: string) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) throw new Error(`Brand with ID ${brandId} not found for saving media plan group.`);
    const brandRecordId = brandRecord.id;
    
    // Handle persona linking
    let personaRecordId: string[] = [];
    if (group.personaId) {
        const personaRecord = await findRecordByField(PERSONAS_TABLE_NAME, 'persona_id', group.personaId);
        if (personaRecord) personaRecordId = [personaRecord.id];
    }
    
    // Save/Update Media Plan Group record
    const planFields = {
        plan_id: group.id,
        name: group.name,
        prompt: group.prompt,
        source: group.source,
        product_images_json: JSON.stringify(group.productImages || []),
        brand: [brandRecordId],
        persona: personaRecordId,
    };
    
    let planAirtableRecord;
    const existingPlanRecord = await findRecordByField(MEDIA_PLANS_TABLE_NAME, 'plan_id', group.id);
    
    if (existingPlanRecord) {
        planAirtableRecord = (await patchAirtableRecords(MEDIA_PLANS_TABLE_NAME, [{ id: existingPlanRecord.id, fields: planFields }]))[0];
    } else {
        planAirtableRecord = (await sendToAirtable([{ fields: planFields }], MEDIA_PLANS_TABLE_NAME))[0];
    }
    const planRecordId = planAirtableRecord.id;
    
    // Get existing posts for this plan to determine which to delete
    const existingPostRecords = await fetchFullRecordsByFormula(POSTS_TABLE_NAME, `{media_plan} = '${planRecordId}'`);
    const existingPostMap = new Map(existingPostRecords.map((r: any) => [r.fields.post_id, r.id]));
    
    // Prepare posts to save/update
    const postsToUpsert = [];
    const postRecordIdsToKeep = new Set<string>();
    
    for (const week of group.plan) {
        for (const post of week.posts) {
            const postFields = {
                post_id: post.id,
                title: post.title,
                week: week.week,
                theme: week.theme,
                platform: post.platform,
                content_type: post.contentType,
                content: post.content,
                description: post.description,
                hashtags: post.hashtags.join(', '),
                cta: post.cta,
                media_prompt: Array.isArray(post.mediaPrompt) ? JSON.stringify(post.mediaPrompt) : post.mediaPrompt,
                script: post.script,
                image_key: post.imageKey,
                image_url: post.imageKey ? imageUrls[post.imageKey] : undefined,
                video_key: post.videoKey,
                video_url: post.videoKey ? imageUrls[post.videoKey] : undefined,
                media_order: post.mediaOrder?.join(','),
                source_urls: post.sources?.map(s => `${s.title}:${s.uri}`).join('\n'),
                scheduled_at: post.scheduledAt,
                published_at: post.publishedAt,
                published_url: post.publishedUrl,
                auto_comment: post.autoComment,
                status: post.status,
                is_pillar: post.isPillar,
                brand: [brandRecordId],
                media_plan: [planRecordId],
                promoted_products: post.promotedProductIds ? await Promise.all(post.promotedProductIds.map(async (id) => {
                    const productRecord = await findRecordByField(AFFILIATE_PRODUCTS_TABLE_NAME, 'link_id', id);
                    return productRecord ? productRecord.id : null;
                })).then(ids => ids.filter(Boolean)) : [],
            };
            
            // Remove undefined fields
            Object.keys(postFields).forEach(key => postFields[key] === undefined && delete postFields[key]);
            
            postsToUpsert.push({ fields: postFields });
            existingPostMap.delete(post.id); // Remove from map if it exists (mark as not to delete)
            postRecordIdsToKeep.add(post.id);
        }
    }
    
    // Create new posts and update existing ones
    if (postsToUpsert.length > 0) {
        await sendToAirtable(postsToUpsert, POSTS_TABLE_NAME);
    }
    
    // Delete posts that are no longer in the plan
    const postRecordIdsToDelete = Array.from(existingPostMap.values());
    if (postRecordIdsToDelete.length > 0) {
        await deleteAirtableRecords(POSTS_TABLE_NAME, postRecordIdsToDelete);
    }
    
    // Update the media plan record with the new list of posts
    const updatedPostRecords = await fetchFullRecordsByFormula(POSTS_TABLE_NAME, `{media_plan} = '${planRecordId}'`);
    const updatedPostRecordIds = updatedPostRecords.map(r => r.id);
    
    await patchAirtableRecords(MEDIA_PLANS_TABLE_NAME, [{
        id: planRecordId,
        fields: { posts: updatedPostRecordIds }
    }]);
};

export const syncAssetMedia = async (imageUrls: Record<string, string>, brandId: string, assets: GeneratedAssets) => {
    // Sync logo concepts
    const logoConceptRecords = await fetchFullRecordsByFormula(LOGO_CONCEPTS_TABLE_NAME, `{brand} = '${brandId}'`);
    const logoConceptMap = new Map(logoConceptRecords.map(r => [r.fields.logo_id, r.id]));
    
    const logoConceptUpdates = assets.coreMediaAssets.logoConcepts
        .filter(logo => imageUrls[logo.imageKey])
        .map(logo => ({
            id: logoConceptMap.get(logo.id),
            fields: { image_url: imageUrls[logo.imageKey] }
        }))
        .filter(update => update.id);
    
    if (logoConceptUpdates.length > 0) {
        await patchAirtableRecords(LOGO_CONCEPTS_TABLE_NAME, logoConceptUpdates);
    }
    
    // Sync unified profile assets
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (brandRecord) {
        const unifiedProfileUpdates: Record<string, string> = {};
        if (assets.unifiedProfileAssets.profilePictureImageKey && imageUrls[assets.unifiedProfileAssets.profilePictureImageKey]) {
            unifiedProfileUpdates.profile_picture_image_url = imageUrls[assets.unifiedProfileAssets.profilePictureImageKey];
        }
        if (assets.unifiedProfileAssets.coverPhotoImageKey && imageUrls[assets.unifiedProfileAssets.coverPhotoImageKey]) {
            unifiedProfileUpdates.cover_photo_image_url = imageUrls[assets.unifiedProfileAssets.coverPhotoImageKey];
        }
        
        if (Object.keys(unifiedProfileUpdates).length > 0) {
            await patchAirtableRecords(BRANDS_TABLE_NAME, [{
                id: brandRecord.id,
                fields: unifiedProfileUpdates
            }]);
        }
    }
};

export const bulkUpdatePostSchedules = async (updates: { postId: string; scheduledAt: string; status: 'scheduled' }[], brandId: string) => {
    const recordsToPatch = await Promise.all(updates.map(async (update) => {
        const postRecord = await findRecordByField(POSTS_TABLE_NAME, 'post_id', update.postId);
        if (postRecord) {
            return {
                id: postRecord.id,
                fields: {
                    scheduled_at: update.scheduledAt,
                    status: update.status
                }
            };
        }
        return null;
    }));
    
    const validPatches = recordsToPatch.filter(p => p !== null);
    if (validPatches.length > 0) {
        await patchAirtableRecords(POSTS_TABLE_NAME, validPatches as any[]);
    }
};

export const fetchAffiliateLinksForBrand = async (brandId: string): Promise<AffiliateLink[]> => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) return [];
    
    const linkRecords = await fetchFullRecordsByFormula(AFFILIATE_PRODUCTS_TABLE_NAME, `{brand} = '${brandId}'`);
    return linkRecords.map((r: any) => ({
        id: r.fields.link_id,
        productId: r.fields.product_id,
        productName: r.fields.product_name,
        price: r.fields.price,
        salesVolume: r.fields.sales_volume,
        providerName: r.fields.provider_name,
        commissionRate: r.fields.commission_rate * 100,
        commissionValue: r.fields.commission_value,
        productLink: r.fields.product_link,
        promotionLink: r.fields.promotion_link,
    }));
};

// --- AI SERVICES AND MODELS FUNCTIONS ---
export const saveAIService = async (service: { id: string; name: string; description: string }) => {
    await ensureAllTablesExist();
    
    const serviceFields = {
        service_id: service.id,
        name: service.name,
        description: service.description
    };
    
    let serviceAirtableRecord;
    try {
        const existingServiceRecord = await findRecordByField(AI_SERVICES_TABLE_NAME, 'service_id', service.id);
        
        if (existingServiceRecord) {
            serviceAirtableRecord = (await patchAirtableRecords(AI_SERVICES_TABLE_NAME, [{ id: existingServiceRecord.id, fields: serviceFields }]))[0];
        } else {
            serviceAirtableRecord = (await sendToAirtable([{ fields: serviceFields }], AI_SERVICES_TABLE_NAME))[0];
        }
    } catch (error) {
        console.error("Failed to save AI service:", error);
        throw new Error(`Failed to save AI service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return serviceAirtableRecord;
};

export const deleteAIService = async (serviceId: string) => {
    await ensureAllTablesExist();
    
    const serviceRecord = await findRecordByField(AI_SERVICES_TABLE_NAME, 'service_id', serviceId);
    if (serviceRecord) {
        // First delete all associated models
        const modelRecords = await fetchFullRecordsByFormula(AI_MODELS_TABLE_NAME, `{service} = '${serviceRecord.id}'`);
        if (modelRecords.length > 0) {
            const modelRecordIds = modelRecords.map(r => r.id);
            await deleteAirtableRecords(AI_MODELS_TABLE_NAME, modelRecordIds);
        }
        
        // Then delete the service
        await deleteAirtableRecords(AI_SERVICES_TABLE_NAME, [serviceRecord.id]);
    }
};

export const saveAIModel = async (model: { id: string; name: string; provider: string; capabilities: string[] }, serviceId: string) => {
    await ensureAllTablesExist();
    
    // First, verify the service exists
    const serviceRecord = await findRecordByField(AI_SERVICES_TABLE_NAME, 'service_id', serviceId);
    if (!serviceRecord) {
        throw new Error(`Service with ID ${serviceId} not found for saving AI model.`);
    }
    
    // Validate capabilities against the predefined choices
    const validCapabilities = ['text', 'image', 'audio', 'video', 'code'];
    const filteredCapabilities = model.capabilities.filter(cap => validCapabilities.includes(cap));
    
    const modelFields = {
        model_id: model.id,
        name: model.name,
        provider: model.provider,
        capabilities: filteredCapabilities.length > 0 ? filteredCapabilities : null, // Send null if no capabilities
        service: serviceRecord.id  // Link the model to the service (assuming prefersSingleRecordLink is true)
    };
    
    let modelAirtableRecord;
    try {
        const existingModelRecord = await findRecordByField(AI_MODELS_TABLE_NAME, 'model_id', model.id);
        
        if (existingModelRecord) {
            modelAirtableRecord = (await patchAirtableRecords(AI_MODELS_TABLE_NAME, [{ id: existingModelRecord.id, fields: modelFields }]))[0];
        } else {
            modelAirtableRecord = (await sendToAirtable([{ fields: modelFields }], AI_MODELS_TABLE_NAME))[0];
        }
    } catch (error) {
        console.error("Failed to save AI model:", error);
        throw new Error(`Failed to save AI model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return modelAirtableRecord;
};

export const deleteAIModel = async (modelId: string) => {
    await ensureAllTablesExist();
    
    const modelRecord = await findRecordByField(AI_MODELS_TABLE_NAME, 'model_id', modelId);
    if (modelRecord) {
        await deleteAirtableRecords(AI_MODELS_TABLE_NAME, [modelRecord.id]);
    }
};

export const loadAIServices = async (): Promise<{ id: string; name: string; description: string; models: { id: string; name: string; provider: string; capabilities: string[] }[] }[]> => {
    try {
        await ensureAllTablesExist();
        
        // Load AI Services
        const serviceRecords = await fetchFullRecordsByFormula(AI_SERVICES_TABLE_NAME, '');
        
        // If no services exist yet, return empty array
        if (!serviceRecords || serviceRecords.length === 0) {
            return [];
        }
        
        // Load AI Models for all services
        const serviceRecordIds = serviceRecords.map(r => r.id);
        let modelRecords = [];
        if (serviceRecordIds.length > 0) {
            // Properly escape the service record IDs in the formula
            const escapedServiceIds = serviceRecordIds.map(id => `'${id.replace(/'/g, "\\'")}'`);
            const modelFormula = `OR(${escapedServiceIds.map(id => `{service} = ${id}`).join(',')})`;
            try {
                modelRecords = await fetchFullRecordsByFormula(AI_MODELS_TABLE_NAME, modelFormula);
            } catch (error) {
                console.warn("Failed to fetch AI models, continuing with empty model list:", error);
                modelRecords = [];
            }
        }
        
        // Create a map of service Airtable record ID to models
        const serviceRecordIdToModelsMap = new Map<string, any[]>();
        if (modelRecords && modelRecords.length > 0) {
            modelRecords.forEach(modelRecord => {
                // Handle case where service field might not exist or be empty
                const serviceLink = modelRecord.fields.service;
                if (serviceLink) {
                    const serviceRecordId = serviceLink; // This is the Airtable record ID
                    if (!serviceRecordIdToModelsMap.has(serviceRecordId)) {
                        serviceRecordIdToModelsMap.set(serviceRecordId, []);
                    }
                    serviceRecordIdToModelsMap.get(serviceRecordId)!.push(modelRecord);
                }
            });
        }
        
        // Transform services and their models
        return serviceRecords.map(serviceRecord => {
            const serviceModels = serviceRecordIdToModelsMap.get(serviceRecord.id) || [];
            const models = serviceModels.map(modelRecord => ({
                id: modelRecord.fields.model_id,
                name: modelRecord.fields.name,
                provider: modelRecord.fields.provider,
                capabilities: modelRecord.fields.capabilities || []
            }));
            
            return {
                id: serviceRecord.fields.service_id,
                name: serviceRecord.fields.name,
                description: serviceRecord.fields.description,
                models
            };
        });
    } catch (error) {
        console.error("Failed to load AI services from Airtable:", error);
        // Return empty array instead of throwing error
        return [];
    }
};

export const listMediaPlanGroupsForBrand = async (brandId: string): Promise<{id: string; name: string; prompt: string; source?: MediaPlanGroup['source']; productImages?: { name: string, type: string, data: string }[]; personaId?: string;}[]> => {
    // Instead of using brandRecord.fields.media_plans, we query the Media_Plans table directly
    const planRecords = await fetchFullRecordsByFormula(MEDIA_PLANS_TABLE_NAME, `{brand} = '${brandId}'`, ['plan_id', 'name', 'prompt', 'source', 'product_images_json', 'persona']);
    
    const personaRecordIds = planRecords.map(r => r.fields.persona?.[0]).filter(Boolean);
    let personaMap = new Map<string, string>();
    if (personaRecordIds.length > 0) {
        const personaFormula = `OR(${personaRecordIds.map((id: string) => `RECORD_ID()='${id}'`).join(',')})`;
        const personaRecords = await fetchFullRecordsByFormula(PERSONAS_TABLE_NAME, personaFormula, ['persona_id']);
        personaMap = new Map(personaRecords.map(r => [r.id, r.fields.persona_id]));
    }
    
    return planRecords.map(record => {
        const personaRecordId = record.fields.persona?.[0];
        return {
            id: record.fields.plan_id,
            name: record.fields.name,
            prompt: record.fields.prompt,
            source: record.fields.source,
            productImages: record.fields.product_images_json ? JSON.parse(record.fields.product_images_json) : [],
            personaId: personaRecordId ? personaMap.get(personaRecordId) : undefined,
        }
    });
};

export const loadMediaPlan = async (planId: string, brandFoundation: BrandFoundation, language: string): Promise<{ plan: MediaPlan; imageUrls: Record<string, string>; videoUrls: Record<string, string>; }> => {
    const planRecord = await findRecordByField(MEDIA_PLANS_TABLE_NAME, 'plan_id', planId);
    if (!planRecord || !planRecord.fields.posts) {
        return { plan: [], imageUrls: {}, videoUrls: {} };
    }
    
    const postRecordIds = planRecord.fields.posts;
    if (!postRecordIds || postRecordIds.length === 0) return { plan: [], imageUrls: {}, videoUrls: {} };
    
    const formula = `OR(${postRecordIds.map((id: string) => `RECORD_ID()='${id}'`).join(',')})`;
    const postRecords = await fetchFullRecordsByFormula(POSTS_TABLE_NAME, formula);
    
    const allProductRecordIds = [...new Set(postRecords.flatMap(p => p.fields.promoted_products || []))];
    let productIdMap = new Map<string, string>();
    if (allProductRecordIds.length > 0) {
        const productFormula = `OR(${allProductRecordIds.map((id: string) => `RECORD_ID()='${id}'`).join(',')})`;
        const productRecords = await fetchFullRecordsByFormula(AFFILIATE_PRODUCTS_TABLE_NAME, productFormula, ['link_id']);
        productIdMap = new Map(productRecords.map(r => [r.id, r.fields.link_id]));
    }
    
    const imageUrls: Record<string, string> = {};
    const videoUrls: Record<string, string> = {};
    const weeks = new Map<number, { theme: string; posts: MediaPlanPost[] }>();
    
    postRecords.forEach(record => {
        const fields = record.fields;
        const post: MediaPlanPost = {
            id: fields.post_id,
            platform: fields.platform,
            contentType: fields.content_type,
            title: fields.title,
            content: fields.content || '',
            description: fields.description,
            hashtags: (fields.hashtags || '').split(',').map((h:string) => h.trim()),
            cta: fields.cta,
            mediaPrompt: fields.media_prompt,
            script: fields.script,
            imageKey: fields.image_key,
            videoKey: fields.video_key,
            mediaOrder: fields.media_order?.split(','),
            sources: (fields.source_urls || '').split('\n').map((line: string) => {
                const parts = line.split(':');
                const title = parts.shift() || '';
                const uri = parts.join(':').trim();
                return { title, uri };
            }).filter((s:any) => s.uri),
            promotedProductIds: (fields.promoted_products || []).map((id: string) => productIdMap.get(id)).filter(Boolean),
            scheduledAt: fields.scheduled_at,
            publishedAt: fields.published_at,
            publishedUrl: fields.published_url,
            autoComment: fields.auto_comment,
            status: fields.status?.toLowerCase() as PostStatus || 'draft',
            isPillar: fields.is_pillar,
        };
        
        if (fields.image_key && fields.image_url) imageUrls[fields.image_key] = fields.image_url;
        if (fields.video_key && fields.video_url) videoUrls[fields.video_key] = fields.video_url;
        
        const weekNum = fields.week;
        if (!weeks.has(weekNum)) {
            weeks.set(weekNum, { theme: fields.theme, posts: [] });
        }
        weeks.get(weekNum)!.posts.push(post);
    });
    
    const finalPlan: MediaPlan = Array.from(weeks.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([weekNum, weekData]) => ({
            week: weekNum,
            theme: weekData.theme,
            posts: weekData.posts
        }));
    
    return { plan: finalPlan, imageUrls, videoUrls };
};

export const bulkPatchPosts = async (updates: { postId: string; fields: Record<string, any> }[], brandId: string) => {
    const recordsToPatch = await Promise.all(updates.map(async (update) => {
        const postRecord = await findRecordByField(POSTS_TABLE_NAME, 'post_id', update.postId);
        if (postRecord) {
            return { id: postRecord.id, fields: update.fields };
        }
        return null;
    }));
    
    const validPatches = recordsToPatch.filter(p => p !== null);
    if (validPatches.length > 0) {
        await patchAirtableRecords(POSTS_TABLE_NAME, validPatches as any[]);
    }
};

export const saveTrend = async (trend: Trend, brandId: string) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) throw new Error(`Brand with ID ${brandId} not found for saving trend.`);
    const brandRecordId = brandRecord.id;
    
    // 1. Create or update the trend record itself
    const trendFields = {
        trend_id: trend.id,
        industry: trend.industry,
        topic: trend.topic,
        keywords: trend.keywords.join(', '),
        links_json: JSON.stringify(trend.links),
        notes: trend.notes,
        created_at: trend.createdAt,
        brand: [brandRecordId]
    };
    
    let trendAirtableRecord;
    const existingRecord = await findRecordByField(TRENDS_TABLE_NAME, 'trend_id', trend.id);
    if (existingRecord) {
        trendAirtableRecord = (await patchAirtableRecords(TRENDS_TABLE_NAME, [{ id: existingRecord.id, fields: trendFields }]))[0];
    } else {
        trendAirtableRecord = (await sendToAirtable([{ fields: trendFields }], TRENDS_TABLE_NAME))[0];
    }
    // No need to link back to the brand record since we query by brand ID directly
};

export const deleteTrendFromAirtable = async (trendId: string, brandId: string) => {
    const record = await findRecordByField(TRENDS_TABLE_NAME, 'trend_id', trendId);
    if (record) await deleteAirtableRecords(TRENDS_TABLE_NAME, [record.id]);
};

export const saveIdeas = async (ideas: Idea[]) => {
    if (ideas.length === 0) return;
    
    // Validate that all ideas have the required fields
    for (let i = 0; i < ideas.length; i++) {
        const idea = ideas[i];
        if (!idea.id || !idea.title || !idea.description || !idea.targetAudience) {
            console.error("Invalid idea structure at index", i, ":", idea);
            throw new Error(`Idea at index ${i} is missing required fields for Airtable save. ID: ${!!idea.id}, Title: ${!!idea.title}, Description: ${!!idea.description}, TargetAudience: ${!!idea.targetAudience}`);
        }
    }
    
    const trendRecord = await findRecordByField(TRENDS_TABLE_NAME, 'trend_id', ideas[0].trendId);
    if (!trendRecord) {
        console.warn(`Could not find parent trend with ID ${ideas[0]?.trendId}. Ideas will be saved without being linked.`);
    }
    const trendRecordId = trendRecord ? trendRecord.id : undefined;
    
    const recordsToCreate = ideas.map(idea => ({
        fields: {
            idea_id: idea.id,
            title: idea.title,
            description: idea.description,
            target_audience: idea.targetAudience,
            product_id: idea.productId, // Include the product ID if it exists
            trend: trendRecordId ? [trendRecordId] : undefined,
        }
    }));
    
    try {
        const createdIdeaRecords = await sendToAirtable(recordsToCreate, IDEAS_TABLE_NAME);
        console.log(`Successfully saved ${createdIdeaRecords.length} ideas to Airtable`);
        
        // Link new ideas back to the parent trend
        if (trendRecord && createdIdeaRecords.length > 0) {
            const newIdeaRecordIds = createdIdeaRecords.map(r => r.id);
            const existingIdeaRecordIds = trendRecord.fields.ideas || [];
            await patchAirtableRecords(TRENDS_TABLE_NAME, [{
                id: trendRecord.id,
                fields: {
                    ideas: [...existingIdeaRecordIds, ...newIdeaRecordIds]
                }
            }]);
        }
        
        return createdIdeaRecords;
    } catch (error) {
        console.error("Failed to save ideas to Airtable:", error);
        throw new Error(`Failed to save ideas to Airtable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const listBrandsFromAirtable = async (): Promise<{ id: string, name: string }[]> => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!baseId) throw new Error("Airtable Base ID is not configured in the environment.");
    
    try {
        const url = `https://api.airtable.com/v0/${baseId}/${BRANDS_TABLE_NAME}`;
        const response = await airtableFetch(url, {});
        
        return response.records.map((record: any) => ({
            id: record.fields.brand_id,
            name: record.fields.name
        }));
    } catch (error: any) {
        // If the table doesn't exist, return an empty array
        if (error.message && error.message.includes('NOT_FOUND')) {
            console.warn("Brands table not found in Airtable. Returning empty list.");
            return [];
        }
        console.error("Failed to fetch brands from Airtable:", error);
        throw error;
    }
};

export const checkAirtableCredentials = async (): Promise<boolean> => {
    const pat = import.meta.env.VITE_AIRTABLE_PAT;
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    
    if (!pat || !baseId) {
        return false;
    }
    
    try {
        // Perform a simple, low-cost request to validate credentials, like listing tables.
        await airtableFetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {});
        return true; // If the request succeeds, credentials are valid.
    } catch (error) {
        console.error("Airtable credential check failed:", error);
        return false; // If the request fails, credentials are likely invalid.
    }
};

// Function to list all tables in the base for debugging
export const listAllAirtableTables = async (): Promise<any[]> => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!baseId) throw new Error("Airtable Base ID is not configured in the environment.");
    
    try {
        const response = await airtableFetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {});
        return response.tables || [];
    } catch (error) {
        console.error("Failed to list Airtable tables:", error);
        return [];
    }
};