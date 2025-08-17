import type { GeneratedAssets, Settings, MediaPlan, CoreMediaAssets, UnifiedProfileAssets, MediaPlanGroup, BrandFoundation, MediaPlanPost, AffiliateLink, Persona, PostStatus, Trend, Idea, ColorPalette, FontRecommendations, LogoConcept, PersonaPhoto, AIService } from '../types';

// --- NORMALIZED SCHEMA TABLE NAMES ---
export const BRANDS_TABLE_NAME = 'Brands';
export const LOGO_CONCEPTS_TABLE_NAME = 'Logo_Concepts';
export const BRAND_VALUES_TABLE_NAME = 'Brand_Values';
export const KEY_MESSAGES_TABLE_NAME = 'Key_Messages';
export const MEDIA_PLANS_TABLE_NAME = 'Media_Plans';
export const POSTS_TABLE_NAME = 'Posts';
export const AFFILIATE_PRODUCTS_TABLE_NAME = 'Affiliate_Products';
export const PERSONAS_TABLE_NAME = 'Personas';
export const TRENDS_TABLE_NAME = 'Trends';
export const IDEAS_TABLE_NAME = 'Ideas';
export const SOCIAL_ACCOUNTS_TABLE_NAME = 'Social_Accounts';
export const AI_SERVICES_TABLE_NAME = 'AI_Services';
export const AI_MODELS_TABLE_NAME = 'AI_Models';
export const ADMIN_SETTINGS_TABLE_NAME = 'Admin_Settings';
export const BRAND_SETTINGS_TABLE_NAME = 'Brand_Settings';


// Helper function to map lowercase status values to Airtable's expected capitalized format
const mapPostStatusToAirtable = (status: string): string => {
    if (!status) return 'Draft';
    return status.charAt(0).toUpperCase() + status.slice(1);
};


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
    { name: 'created_at', type: 'dateTime', options: { dateFormat: { name: 'local' }, timeFormat: { name: '24hour' }, timeZone: 'client'}},
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

const ADMIN_SETTINGS_SCHEMA = [
    { name: 'setting_id', type: 'singleLineText' }, // Primary Key (will be a fixed ID like 'global_settings')
    { name: 'language', type: 'singleLineText' },
    { name: 'total_posts_per_month', type: 'number', options: { precision: 0 } },
    { name: 'media_prompt_suffix', type: 'multilineText' },
    { name: 'affiliate_content_kit', type: 'multilineText' },
    { name: 'text_generation_model', type: 'singleLineText' },
    { name: 'image_generation_model', type: 'singleLineText' },
    { name: 'text_model_fallback_order_json', type: 'multilineText' },
    { name: 'vision_models_json', type: 'multilineText' },
];

const BRAND_SETTINGS_SCHEMA = [
    { name: 'brand_settings_id', type: 'singleLineText' }, // Primary Key
    { name: 'language', type: 'singleLineText' },
    { name: 'total_posts_per_month', type: 'number', options: { precision: 0 } },
    { name: 'media_prompt_suffix', type: 'multilineText' },
    { name: 'affiliate_content_kit', type: 'multilineText' },
    { name: 'text_generation_model', type: 'singleLineText' },
    { name: 'image_generation_model', type: 'singleLineText' },
    { name: 'text_model_fallback_order_json', type: 'multilineText' },
    { name: 'vision_models_json', type: 'multilineText' },
    { name: 'brand', type: 'multipleRecordLinks', options: { linkedTableName: BRANDS_TABLE_NAME, prefersSingleRecordLink: true } },
];

export const ALL_TABLE_SCHEMAS = {
    [BRANDS_TABLE_NAME]: BRANDS_SCHEMA,
    [LOGO_CONCEPTS_TABLE_NAME]: LOGO_CONCEPTS_SCHEMA,
    [BRAND_VALUES_TABLE_NAME]: BRAND_VALUES_SCHEMA,
    [KEY_MESSAGES_TABLE_NAME]: KEY_MESSAGES_SCHEMA,
    [MEDIA_PLANS_TABLE_NAME]: MEDIA_PLANS_SCHEMA,
    [POSTS_TABLE_NAME]: POSTS_SCHEMA,
    [AFFILIATE_PRODUCTS_TABLE_NAME]: AFFILIATE_PRODUCTS_SCHEMA,
    [PERSONAS_TABLE_NAME]: PERSONAS_SCHEMA,
    [TRENDS_TABLE_NAME]: TRENDS_SCHEMA,
    [IDEAS_TABLE_NAME]: IDEAS_SCHEMA,
    [SOCIAL_ACCOUNTS_TABLE_NAME]: SOCIAL_ACCOUNTS_SCHEMA,
    [AI_SERVICES_TABLE_NAME]: AI_SERVICES_SCHEMA,
    [AI_MODELS_TABLE_NAME]: AI_MODELS_SCHEMA,
    [ADMIN_SETTINGS_TABLE_NAME]: ADMIN_SETTINGS_SCHEMA,
    [BRAND_SETTINGS_TABLE_NAME]: BRAND_SETTINGS_SCHEMA,
};

let schemaEnsured = false;
const specificSchemasEnsured = new Set<string>();

// --- API HELPERS (Modified to always use BFF) ---
export const airtableFetch = async (url: string, options: RequestInit) => {
    let path;
    const pathMatch = url.match(/https:\/\/api\.airtable\.com\/v0\/(.+)/);
    if (pathMatch) {
        path = pathMatch[1];
    } else {
        path = url;
    }
    
    const { airtableRequestWithBff } = await import('./bffService');
    return await airtableRequestWithBff(options.method || 'GET', path, options.body ? JSON.parse(options.body as string) : undefined, options.headers as Record<string, string>);
};

const findRecordByField = async (tableName: string, fieldName: string, value: string) => {
    const encodedValue = encodeURIComponent(value);
    const path = `${tableName}?filterByFormula={${fieldName}}='${encodedValue}'`;
    const response = await airtableFetch(path, {});
    
    if (!response || !Array.isArray(response.records)) {
        return null;
    }
    
    const record = response.records && response.records.length > 0 ? response.records[0] : null;
    
    if (record && (!record.id || typeof record.id !== 'string')) {
        return null;
    }
    
    return record;
};

// --- ID TRANSLATION HELPERS ---

// A simple in-memory cache to reduce redundant lookups for the same ID.
const recordIdCache = new Map<string, string>();

const getRecordIdFromCustomId = async (tableName: string, customIdField: string, customIdValue: string): Promise<string | null> => {
    const cacheKey = `${tableName}:${customIdField}:${customIdValue}`;
    if (recordIdCache.has(cacheKey)) {
        return recordIdCache.get(cacheKey)!;
    }

    const record = await findRecordByField(tableName, customIdField, customIdValue);
    if (record && record.id) {
        recordIdCache.set(cacheKey, record.id);
        return record.id;
    }
    return null;
};

const fetchFullRecordsByFormula = async (tableName: string, formula: string, fields?: string[]) => {
    let path = `${tableName}`;
    const queryParams: string[] = [];

    if (formula) {
        queryParams.push(`filterByFormula=${encodeURIComponent(formula)}`);
    }

    if (fields && fields.length > 0) {
        fields.forEach(f => queryParams.push(`fields[]=${encodeURIComponent(f)}`));
    }

    if (queryParams.length > 0) {
        path += '?' + queryParams.join('&');
    }

    const response = await airtableFetch(path, {});
    return response.records || [];
};

const sendToAirtable = async (records: { fields: Record<string, any> }[], tableName: string) => {
    const path = `${tableName}`;
    
    const chunks = [];
    for (let i = 0; i < records.length; i += 10) {
        chunks.push(records.slice(i, i + 10));
    }
    
    const results = [];
    for (const chunk of chunks) {
        const response = await airtableFetch(path, {
            method: 'POST',
            body: JSON.stringify({ records: chunk })
        });
        results.push(...response.records);
    }
    return results;
};

const patchAirtableRecords = async (tableName: string, records: { id: string; fields: Record<string, any> }[]) => {
    const path = `${tableName}`;
    
    const chunks = [];
    for (let i = 0; i < records.length; i += 10) {
        chunks.push(records.slice(i, i + 10));
    }
    
    const results = [];
    for (const chunk of chunks) {
        const response = await airtableFetch(path, {
            method: 'PATCH',
            body: JSON.stringify({ records: chunk })
        });
        results.push(...response.records);
    }
    return results;
};

const deleteAirtableRecords = async (tableName: string, recordIds: string[]) => {
    const path = `${tableName}`;
    
    const chunks = [];
    for (let i = 0; i < recordIds.length; i += 10) {
        chunks.push(recordIds.slice(i, i + 10));
    }
    
    for (const chunk of chunks) {
        const deletePath = path + '?' + chunk.map(id => `records[]=${id}`).join('&');
        await airtableFetch(deletePath, { method: 'DELETE' });
    }
};

export const fetchAdminDefaultsFromAirtable = async (): Promise<Settings> => {
    await ensureSpecificTablesAndFieldsExist([ADMIN_SETTINGS_TABLE_NAME]);
    const records = await fetchFullRecordsByFormula(ADMIN_SETTINGS_TABLE_NAME, '');
    if (records.length === 0) {
        return {} as Settings;
    }
    const adminSettings = records[0].fields;
    return {
        language: adminSettings.language,
        totalPostsPerMonth: adminSettings.total_posts_per_month,
        mediaPromptSuffix: adminSettings.media_prompt_suffix,
        affiliateContentKit: adminSettings.affiliate_content_kit,
        textGenerationModel: adminSettings.text_generation_model,
        imageGenerationModel: adminSettings.image_generation_model,
        textModelFallbackOrder: JSON.parse(adminSettings.text_model_fallback_order_json || '[]'),
        visionModels: JSON.parse(adminSettings.vision_models_json || '[]'),
    } as Settings;
};

export const saveAdminDefaultsToAirtable = async (settings: Settings): Promise<void> => {
    await ensureSpecificTablesAndFieldsExist([ADMIN_SETTINGS_TABLE_NAME]);
    const records = await fetchFullRecordsByFormula(ADMIN_SETTINGS_TABLE_NAME, '');
    const record = records.length > 0 ? records[0] : null;

    const fields = {
        language: settings.language,
        total_posts_per_month: settings.totalPostsPerMonth,
        media_prompt_suffix: settings.mediaPromptSuffix,
        affiliate_content_kit: settings.affiliateContentKit,
        text_generation_model: settings.textGenerationModel,
        image_generation_model: settings.imageGenerationModel,
        text_model_fallback_order_json: JSON.stringify(settings.textModelFallbackOrder),
        vision_models_json: JSON.stringify(settings.visionModels),
    };

    if (record) {
        await patchAirtableRecords(ADMIN_SETTINGS_TABLE_NAME, [{ id: record.id, fields }]);
    } else {
        await sendToAirtable([{ fields: { ...fields, setting_id: 'global_settings' } }], ADMIN_SETTINGS_TABLE_NAME);
    }
};

export const fetchSettingsFromAirtable = async (brandId: string): Promise<Settings | null> => {
    await ensureSpecificTablesAndFieldsExist([BRAND_SETTINGS_TABLE_NAME]);
    const records = await fetchFullRecordsByFormula(BRAND_SETTINGS_TABLE_NAME, `{brand} = '${brandId}'`);
    if (records.length === 0) {
        return null;
    }
    const brandSettings = records[0].fields;
    return {
        language: brandSettings.language,
        totalPostsPerMonth: brandSettings.total_posts_per_month,
        mediaPromptSuffix: brandSettings.media_prompt_suffix,
        affiliateContentKit: brandSettings.affiliate_content_kit,
        textGenerationModel: brandSettings.text_generation_model,
        imageGenerationModel: brandSettings.image_generation_model,
        textModelFallbackOrder: JSON.parse(brandSettings.text_model_fallback_order_json || '[]'),
        visionModels: JSON.parse(brandSettings.vision_models_json || '[]'),
    } as Settings;
};

export const saveSettingsToAirtable = async (settings: Settings, brandId: string): Promise<void> => {
    await ensureSpecificTablesAndFieldsExist([BRAND_SETTINGS_TABLE_NAME, BRANDS_TABLE_NAME]);
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) {
        throw new Error(`Brand with ID ${brandId} not found.`);
    }

    const records = await fetchFullRecordsByFormula(BRAND_SETTINGS_TABLE_NAME, `{brand} = '${brandId}'`);
    const record = records.length > 0 ? records[0] : null;

    const fields = {
        language: settings.language,
        total_posts_per_month: settings.totalPostsPerMonth,
        media_prompt_suffix: settings.mediaPromptSuffix,
        affiliate_content_kit: settings.affiliateContentKit,
        text_generation_model: settings.textGenerationModel,
        image_generation_model: settings.imageGenerationModel,
        text_model_fallback_order_json: JSON.stringify(settings.textModelFallbackOrder),
        vision_models_json: JSON.stringify(settings.visionModels),
        brand: [brandRecord.id],
    };

    if (record) {
        await patchAirtableRecords(BRAND_SETTINGS_TABLE_NAME, [{ id: record.id, fields }]);
    } else {
        await sendToAirtable([{ fields: { ...fields, brand_settings_id: crypto.randomUUID() } }], BRAND_SETTINGS_TABLE_NAME);
    }
};

export const createOrUpdateBrandRecord = async (
    assets: GeneratedAssets,
    imageUrls: Record<string, string>,
    brandId: string | null
): Promise<string> => {
    await ensureSpecificTablesAndFieldsExist([
        BRANDS_TABLE_NAME,
        LOGO_CONCEPTS_TABLE_NAME,
        BRAND_VALUES_TABLE_NAME,
        KEY_MESSAGES_TABLE_NAME
    ]);
    
    let brandRecordId: string;
    let newBrandId: string;
    
    if (brandId) {
        const existingBrandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
        if (!existingBrandRecord) throw new Error(`Brand with ID ${brandId} not found.`);
        brandRecordId = existingBrandRecord.id;
        newBrandId = brandId;
        
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
        };
        
        await patchAirtableRecords(BRANDS_TABLE_NAME, [{ id: brandRecordId, fields: brandFields }]);
    } else {
        newBrandId = crypto.randomUUID();
        const defaultSettings = await fetchAdminDefaultsFromAirtable();
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
            language: defaultSettings.language,
            total_posts_per_month: defaultSettings.totalPostsPerMonth,
            media_prompt_suffix: defaultSettings.mediaPromptSuffix,
            affiliate_content_kit: defaultSettings.affiliateContentKit,
            text_generation_model: defaultSettings.textGenerationModel,
            image_generation_model: defaultSettings.imageGenerationModel,
            text_model_fallback_order_json: JSON.stringify(defaultSettings.textModelFallbackOrder),
            vision_models_json: JSON.stringify(defaultSettings.visionModels),
        };
        
        const response = await sendToAirtable([{ fields: brandFields }], BRANDS_TABLE_NAME);
        brandRecordId = response[0].id;
        brandId = newBrandId;

        await ensureSpecificTablesAndFieldsExist([BRAND_SETTINGS_TABLE_NAME]);

        const brandSettingsFields = {
            brand_settings_id: crypto.randomUUID(),
            language: defaultSettings.language,
            total_posts_per_month: defaultSettings.totalPostsPerMonth,
            media_prompt_suffix: defaultSettings.mediaPromptSuffix,
            affiliate_content_kit: defaultSettings.affiliateContentKit,
            text_generation_model: defaultSettings.textGenerationModel,
            image_generation_model: defaultSettings.imageGenerationModel,
            text_model_fallback_order_json: JSON.stringify(defaultSettings.textModelFallbackOrder),
            vision_models_json: JSON.stringify(defaultSettings.visionModels),
            brand: [brandRecordId],
        };

        await sendToAirtable([{ fields: brandSettingsFields }], BRAND_SETTINGS_TABLE_NAME);
    }
    
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
    
    let createdLogoConceptRecords: any[] = [];
    if (logoConceptRecords.length > 0) {
        createdLogoConceptRecords = await sendToAirtable(logoConceptRecords, LOGO_CONCEPTS_TABLE_NAME);
    }
    
    const brandValueRecords = assets.brandFoundation.values.map(value => ({
        fields: {
            value_id: crypto.randomUUID(),
            text: value,
            brand: [brandRecordId]
        }
    }));
    
    let createdBrandValueRecords: any[] = [];
    if (brandValueRecords.length > 0) {
        createdBrandValueRecords = await sendToAirtable(brandValueRecords, BRAND_VALUES_TABLE_NAME);
    }
    
    const keyMessageRecords = assets.brandFoundation.keyMessaging.map(message => ({
        fields: {
            message_id: crypto.randomUUID(),
            text: message,
            brand: [brandRecordId]
        }
    }));
    
    let createdKeyMessageRecords: any[] = [];
    if (keyMessageRecords.length > 0) {
        createdKeyMessageRecords = await sendToAirtable(keyMessageRecords, KEY_MESSAGES_TABLE_NAME);
    }

    const brandUpdateFields: { [key: string]: any } = {};
    if (createdLogoConceptRecords.length > 0) {
        brandUpdateFields.logo_concepts = createdLogoConceptRecords.map(r => r.id);
    }
    if (createdBrandValueRecords.length > 0) {
        brandUpdateFields.brand_values = createdBrandValueRecords.map(r => r.id);
    }
    if (createdKeyMessageRecords.length > 0) {
        brandUpdateFields.key_messages = createdKeyMessageRecords.map(r => r.id);
    }

    if (Object.keys(brandUpdateFields).length > 0) {
        await patchAirtableRecords(BRANDS_TABLE_NAME, [{ id: brandRecordId, fields: brandUpdateFields }]);
    }
    
    return newBrandId;
};

export const loadProjectFromAirtable = async (brandId: string): Promise<{ assets: GeneratedAssets; generatedImages: Record<string, string>; generatedVideos: Record<string, string>; brandId: string; }> => {
    await ensureSpecificTablesAndFieldsExist([
        BRANDS_TABLE_NAME,
        AFFILIATE_PRODUCTS_TABLE_NAME,
        PERSONAS_TABLE_NAME,
        TRENDS_TABLE_NAME,
        IDEAS_TABLE_NAME,
        MEDIA_PLANS_TABLE_NAME,
        POSTS_TABLE_NAME,
        BRAND_VALUES_TABLE_NAME,
        KEY_MESSAGES_TABLE_NAME,
        LOGO_CONCEPTS_TABLE_NAME,
    ]);
    
    
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) throw new Error(`Brand with ID ${brandId} not found.`);
    
    const fields = brandRecord.fields;
    
    const brandValueRecords = await fetchFullRecordsByFormula(BRAND_VALUES_TABLE_NAME, `{brand} = '${brandId}'`);
    const keyMessageRecords = await fetchFullRecordsByFormula(KEY_MESSAGES_TABLE_NAME, `{brand} = '${brandId}'`);
    const logoConceptRecords = await fetchFullRecordsByFormula(LOGO_CONCEPTS_TABLE_NAME, `{brand} = '${brandId}'`);

    const brandValues = brandValueRecords.map((r: any) => r.fields.text);
    const keyMessages = keyMessageRecords.map((r: any) => r.fields.text);
    const logoConcepts = logoConceptRecords.map((r: any) => ({
        id: r.fields.logo_id,
        style: r.fields.style,
        prompt: r.fields.prompt,
        imageKey: r.fields.image_key,
    }));

    const brandFoundation: BrandFoundation = {
        brandName: fields.name,
        mission: fields.mission,
        values: brandValues,
        targetAudience: fields.target_audience,
        personality: fields.personality,
        keyMessaging: keyMessages,
        usp: fields.usp,
    };
    
    const coreMediaAssets: CoreMediaAssets = {
        logoConcepts,
        colorPalette: JSON.parse(fields.color_palette_json || '{}'),
        fontRecommendations: JSON.parse(fields.font_recs_json || '{}'),
    };
    
    const unifiedProfileAssets: UnifiedProfileAssets = JSON.parse(fields.unified_profile_json || '{}');
    
    const linkRecords = await fetchFullRecordsByFormula(AFFILIATE_PRODUCTS_TABLE_NAME, `{brand} = '${brandId}'`);
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
        product_description: r.fields.product_description,
        features: r.fields.features ? r.fields.features.split(',').map((f: string) => f.trim()) : [],
        use_cases: r.fields.use_cases ? r.fields.use_cases.split(',').map((u: string) => u.trim()) : [],
        customer_reviews: r.fields.customer_reviews,
        product_rating: r.fields.product_rating,
        product_avatar: r.fields.product_avatar,
        product_image_links: r.fields.product_image_links ? r.fields.product_image_links.split('\n') : [],
    }));
    
    const personaRecords = await fetchFullRecordsByFormula(PERSONAS_TABLE_NAME, `{brand} = '${brandId}'`);
    const personas: Persona[] = personaRecords.map((r: any) => ({
        id: r.fields.persona_id,
        nickName: r.fields.nick_name,
        mainStyle: r.fields.main_style,
        activityField: r.fields.activity_field,
        outfitDescription: r.fields.outfit_description,
        avatarImageKey: r.fields.avatar_image_key,
        avatarImageUrl: r.fields.avatar_image_url,
        photos: [],
        socialAccounts: [],
    }));
    
    const trendRecords = await fetchFullRecordsByFormula(TRENDS_TABLE_NAME, `{brand} = '${brandId}'`);
    
    const ideaRecords = await fetchFullRecordsByFormula(IDEAS_TABLE_NAME, `OR(${trendRecords.map(t => `{trend} = '${t.fields.trend_id}'`).join(',')})`);
    
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
        trendId: r.fields.trend[0],
        title: r.fields.title,
        description: r.fields.description,
        targetAudience: r.fields.target_audience,
        productId: r.fields.product_id,
    }));
    
    const fullAssets: GeneratedAssets = {
        brandFoundation,
        coreMediaAssets,
        unifiedProfileAssets,
        mediaPlans: [],
        affiliateLinks,
        personas,
        trends,
        ideas,
    };
    
    const generatedImages: Record<string, string> = {};
    const generatedVideos: Record<string, string> = {};
    
    return { assets: fullAssets, generatedImages, generatedVideos, brandId };
};

export const loadIdeasForTrend = async (trendId: string, brandId: string): Promise<Idea[]> => {
    console.log("DEBUG: Loading ideas for trend ID:", trendId, "brand ID:", brandId);
    
    const ideaRecords = await fetchFullRecordsByFormula(IDEAS_TABLE_NAME, `{trend} = '${trendId}'`);
    console.log("DEBUG: Loaded idea records for trend:", ideaRecords.length);
    
    const ideas: Idea[] = ideaRecords.map((r: any) => ({
        id: r.fields.idea_id,
        trendId: trendId,
        title: r.fields.title,
        description: r.fields.description,
        targetAudience: r.fields.target_audience,
        productId: r.fields.product_id,
    }));
    
    console.log("DEBUG: Mapped ideas:", ideas);
    return ideas;
};

export const saveAffiliateLinks = async (links: AffiliateLink[], brandId: string) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) {
        throw new Error(`Brand with ID ${brandId} not found.`);
    }
    const recordsToCreate = links.map(link => ({
        fields: {
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
            brand: [brandRecord.id],
        }
    }));

    if (recordsToCreate.length > 0) {
        await sendToAirtable(recordsToCreate, AFFILIATE_PRODUCTS_TABLE_NAME);
    }
};

export const deleteAffiliateLink = async (linkId: string, brandId: string) => {
    const record = await findRecordByField(AFFILIATE_PRODUCTS_TABLE_NAME, 'link_id', linkId);
    if (record) {
        await deleteAirtableRecords(AFFILIATE_PRODUCTS_TABLE_NAME, [record.id]);
    }
};

export const savePersona = async (persona: Persona, brandId: string) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) {
        throw new Error(`Brand with ID ${brandId} not found.`);
    }

    const personaFields = {
        persona_id: persona.id,
        nick_name: persona.nickName,
        main_style: persona.mainStyle,
        activity_field: persona.activityField,
        outfit_description: persona.outfitDescription,
        avatar_image_key: persona.avatarImageKey,
        avatar_image_url: persona.avatarImageUrl,
        brand: [brandRecord.id]
    };

    const existingPersonaRecord = await findRecordByField(PERSONAS_TABLE_NAME, 'persona_id', persona.id);

    if (existingPersonaRecord) {
        console.log(`Updating existing persona record with ID ${existingPersonaRecord.id}`);
        await patchAirtableRecords(PERSONAS_TABLE_NAME, [{ id: existingPersonaRecord.id, fields: personaFields }]);
    } else {
        console.log(`Creating new persona record`);
        await sendToAirtable([{ fields: personaFields }], PERSONAS_TABLE_NAME);
    }
};

export const deletePersonaFromAirtable = async (personaId: string, brandId: string) => {
    const personaRecord = await findRecordByField(PERSONAS_TABLE_NAME, 'persona_id', personaId);
    
    if (personaRecord) {
        const socialAccountRecords = await fetchFullRecordsByFormula(SOCIAL_ACCOUNTS_TABLE_NAME, `{persona_id} = '${personaId}'`);
        if (socialAccountRecords.length > 0) {
            const socialAccountRecordIds = socialAccountRecords.map(r => r.id);
            await deleteAirtableRecords(SOCIAL_ACCOUNTS_TABLE_NAME, socialAccountRecordIds);
        }
        
        await deleteAirtableRecords(PERSONAS_TABLE_NAME, [personaRecord.id]);
    }
};

export const assignPersonaToPlanInAirtable = async (planId: string, personaId: string | null, updatedPosts: MediaPlanPost[], brandId: string) => {
    const planRecord = await findRecordByField(MEDIA_PLANS_TABLE_NAME, 'plan_id', planId);
    if (!planRecord) throw new Error("Plan not found in Airtable to assign persona.");

    const fieldsToUpdate: { persona?: string[] } = {};
    if (personaId) {
        const personaRecord = await findRecordByField(PERSONAS_TABLE_NAME, 'persona_id', personaId);
        if (!personaRecord) {
            throw new Error(`Persona with ID ${personaId} not found.`);
        }
        fieldsToUpdate.persona = [personaRecord.id];
    } else {
        fieldsToUpdate.persona = [];
    }
    
    await patchAirtableRecords(MEDIA_PLANS_TABLE_NAME, [{ id: planRecord.id, fields: fieldsToUpdate }]);
    
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

    let promotedProductRecordIds: string[] = [];
    if (post.promotedProductIds && post.promotedProductIds.length > 0) {
        // Convert UUIDs to Airtable record IDs for the relationship field
        const formula = `OR(${post.promotedProductIds.map(id => `{link_id} = '${id}'`).join(',')})`;
        const productRecords = await fetchFullRecordsByFormula(AFFILIATE_PRODUCTS_TABLE_NAME, formula, ['link_id']);
        promotedProductRecordIds = productRecords.map(r => r.id);
        
        // Make sure all provided IDs were found
        if (productRecords.length !== post.promotedProductIds.length) {
            console.warn(`Mismatch in promoted product IDs. Expected ${post.promotedProductIds.length}, found ${productRecords.length}`);
        }
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
        media_order: post.mediaOrder ? post.mediaOrder.join(',') : undefined,
        source_urls: post.sources?.map(s => `${s.title}:${s.uri}`).join('\n'),
        scheduled_at: post.scheduledAt,
        published_at: post.published_at,
        published_url: post.publishedUrl,
        auto_comment: post.autoComment,
        status: mapPostStatusToAirtable(post.status),
        is_pillar: post.isPillar,
        promoted_products: promotedProductRecordIds.length > 0 ? promotedProductRecordIds : [],
    };
    
    Object.keys(fieldsToUpdate).forEach(key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]);
    
    await patchAirtableRecords(POSTS_TABLE_NAME, [{ id: postRecord.id, fields: fieldsToUpdate }]);
};

export const saveMediaPlanGroup = async (group: MediaPlanGroup, imageUrls: Record<string, string>, brandId: string) => {
    const brandRecordId = await getRecordIdFromCustomId(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecordId) {
        throw new Error(`Brand with ID ${brandId} not found.`);
    }

    let personaRecordId: string | null = null;
    if (group.personaId) {
        // Look up the Airtable record.id for the persona using its custom UUID.
        personaRecordId = await getRecordIdFromCustomId(PERSONAS_TABLE_NAME, 'persona_id', group.personaId);
        if (!personaRecordId) {
            console.warn(`Persona with ID ${group.personaId} not found in Airtable. Plan will be saved without persona link.`);
        }
    }

    const planFields = {
        plan_id: group.id,
        name: group.name,
        prompt: group.prompt,
        source: group.source,
        product_images_json: JSON.stringify(group.productImages || []),
        brand: [brandRecordId],
        // This is now correct. We use the looked-up record.id for the link.
        persona: personaRecordId ? [personaRecordId] : [],
    };

    const existingPlanRecord = await findRecordByField(MEDIA_PLANS_TABLE_NAME, 'plan_id', group.id);
    let planRecordId;
    if (existingPlanRecord) {
        await patchAirtableRecords(MEDIA_PLANS_TABLE_NAME, [{ id: existingPlanRecord.id, fields: planFields }]);
        planRecordId = existingPlanRecord.id;
    } else {
        const newPlanRecords = await sendToAirtable([{ fields: planFields }], MEDIA_PLANS_TABLE_NAME);
        planRecordId = newPlanRecords[0].id;
    }

    const postsToUpsert = [];
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
                media_order: post.mediaOrder ? post.mediaOrder.join(',') : undefined,
                source_urls: post.sources?.map(s => `${s.title}:${s.uri}`).join('\n'),
                scheduled_at: post.scheduledAt,
                published_at: post.published_at,
                published_url: post.publishedUrl,
                auto_comment: post.autoComment,
                status: mapPostStatusToAirtable(post.status),
                is_pillar: !!post.isPillar,
                brand: [brandRecordId],
                media_plan: [planRecordId],
                promoted_products: [], // Will be set after we get the record IDs
            };
            
            // Convert UUIDs to Airtable record IDs for the relationship field
            if (post.promotedProductIds && post.promotedProductIds.length > 0) {
                const formula = `OR(${post.promotedProductIds.map(id => `{link_id} = '${id}'`).join(',')})`;
                const productRecords = await fetchFullRecordsByFormula(AFFILIATE_PRODUCTS_TABLE_NAME, formula, ['link_id']);
                const promotedProductRecordIds = productRecords.map(r => r.id);
                postFields.promoted_products = promotedProductRecordIds;
                
                // Make sure all provided IDs were found
                if (productRecords.length !== post.promotedProductIds.length) {
                    console.warn(`Mismatch in promoted product IDs for new post. Expected ${post.promotedProductIds.length}, found ${productRecords.length}`);
                }
            }
            
            Object.keys(postFields).forEach(key => postFields[key] === undefined && delete postFields[key]);
            postsToUpsert.push({ fields: postFields });
        }
    }

    if (postsToUpsert.length > 0) {
        await sendToAirtable(postsToUpsert, POSTS_TABLE_NAME);
    }
};


export const syncAssetMedia = async (imageUrls: Record<string, string>, brandId: string, assets: GeneratedAssets) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) throw new Error(`Brand with ID ${brandId} not found for syncing assets.`);
    
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
};

export const bulkUpdatePostSchedules = async (updates: { postId: string; scheduledAt: string; status: 'scheduled' }[]) => {
    const recordsToPatch = await Promise.all(updates.map(async (update) => {
        const postRecord = await findRecordByField(POSTS_TABLE_NAME, 'post_id', update.postId);
        if (postRecord) {
            return {
                id: postRecord.id,
                fields: {
                    scheduled_at: update.scheduledAt,
                    status: mapPostStatusToAirtable(update.status)
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
    if (!brandRecord) {
        throw new Error(`Brand with ID ${brandId} not found.`);
    }
    const linkRecords = await fetchFullRecordsByFormula(AFFILIATE_PRODUCTS_TABLE_NAME, `{brand} = '${brandRecord.id}'`);
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
        product_description: r.fields.product_description,
        features: r.fields.features ? r.fields.features.split(',').map((f: string) => f.trim()) : [],
        use_cases: r.fields.use_cases ? r.fields.use_cases.split(',').map((u: string) => u.trim()) : [],
        customer_reviews: r.fields.customer_reviews,
        product_rating: r.fields.product_rating,
        product_avatar: r.fields.product_avatar,
        product_image_links: r.fields.product_image_links ? r.fields.product_image_links.split('\n') : [],
    }));
};

export const saveAIService = async (service: { id: string; name: string; description: string }) => {
    await ensureSpecificTablesAndFieldsExist([
        AI_SERVICES_TABLE_NAME,
        AI_MODELS_TABLE_NAME
    ]);
    
    const serviceFields = {
        service_id: service.id,
        name: service.name,
        description: service.description
    };
    
    const existingServiceRecord = await findRecordByField(AI_SERVICES_TABLE_NAME, 'service_id', service.id);
    
    if (existingServiceRecord) {
        await patchAirtableRecords(AI_SERVICES_TABLE_NAME, [{ id: existingServiceRecord.id, fields: serviceFields }]);
    } else {
        await sendToAirtable([{ fields: serviceFields }], AI_SERVICES_TABLE_NAME);
    }
};

export const deleteAIService = async (serviceId: string) => {
    await ensureSpecificTablesAndFieldsExist([
        AI_SERVICES_TABLE_NAME,
        AI_MODELS_TABLE_NAME
    ]);
    
    const serviceRecord = await findRecordByField(AI_SERVICES_TABLE_NAME, 'service_id', serviceId);
    if (serviceRecord) {
        const modelRecords = await fetchFullRecordsByFormula(AI_MODELS_TABLE_NAME, `{service_id} = '${serviceId}'`);
        if (modelRecords.length > 0) {
            const modelRecordIds = modelRecords.map(r => r.id);
            await deleteAirtableRecords(AI_MODELS_TABLE_NAME, modelRecordIds);
        }
        
        await deleteAirtableRecords(AI_SERVICES_TABLE_NAME, [serviceRecord.id]);
    }
};

export const saveAIModel = async (model: { id: string; name: string; provider: string; capabilities: string[] }, serviceId: string) => {
    await ensureSpecificTablesAndFieldsExist([
        AI_SERVICES_TABLE_NAME,
        AI_MODELS_TABLE_NAME
    ]);
    
    const modelFields = {
        model_id: model.id,
        name: model.name,
        provider: model.provider,
        capabilities: model.capabilities.join(","),
        service_id: [serviceId]
    };
    
    const existingModelRecord = await findRecordByField(AI_MODELS_TABLE_NAME, 'model_id', model.id);
    
    if (existingModelRecord) {
        await patchAirtableRecords(AI_MODELS_TABLE_NAME, [{ id: existingModelRecord.id, fields: modelFields }]);
    } else {
        await sendToAirtable([{ fields: modelFields }], AI_MODELS_TABLE_NAME);
    }
};

export const deleteAIModel = async (modelId: string) => {
    await ensureSpecificTablesAndFieldsExist([AI_MODELS_TABLE_NAME]);
    
    const modelRecord = await findRecordByField(AI_MODELS_TABLE_NAME, 'model_id', modelId);
    if (modelRecord) {
        await deleteAirtableRecords(AI_MODELS_TABLE_NAME, [modelRecord.id]);
    }
};

export const loadAIServices = async (): Promise<AIService[]> => {
    try {
        await ensureSpecificTablesAndFieldsExist([AI_SERVICES_TABLE_NAME, AI_MODELS_TABLE_NAME]);
        
        const serviceRecords = await fetchFullRecordsByFormula(AI_SERVICES_TABLE_NAME, '');
        
        const modelRecords = await fetchFullRecordsByFormula(AI_MODELS_TABLE_NAME, '');
        
        const serviceIdToModelsMap = new Map<string, any[]>();
        modelRecords.forEach((modelRecord: any) => {
            const serviceId = modelRecord.fields.service_id && modelRecord.fields.service_id[0];
            if (serviceId) {
                if (!serviceIdToModelsMap.has(serviceId)) {
                    serviceIdToModelsMap.set(serviceId, []);
                }
                serviceIdToModelsMap.get(serviceId)?.push(modelRecord);
            }
        });
        
        const services: AIService[] = serviceRecords.map((serviceRecord: any) => {
            const serviceId = serviceRecord.fields.service_id;
            const models = serviceIdToModelsMap.get(serviceId) || [];
            
            return {
                id: serviceId,
                name: serviceRecord.fields.name,
                description: serviceRecord.fields.description,
                models: models.map((modelRecord: any) => ({
                    id: modelRecord.fields.model_id,
                    name: modelRecord.fields.name,
                    provider: modelRecord.fields.provider,
                    capabilities: modelRecord.fields.capabilities || []
                }))
            };
        });
        
        return services;
    } catch (error) {
        console.error("Failed to load AI services:", error);
        throw new Error(`Failed to load AI services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const listMediaPlanGroupsForBrand = async (brandId: string): Promise<{id: string; name: string; prompt: string; source?: MediaPlanGroup['source']; productImages?: { name: string, type: string, data: string }[]; personaId?: string;}> => {
    const brandRecordId = await getRecordIdFromCustomId(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecordId) {
        throw new Error(`Brand with ID ${brandId} not found.`);
    }
    await ensureSpecificTablesAndFieldsExist([MEDIA_PLANS_TABLE_NAME, PERSONAS_TABLE_NAME]);
    // Using the record ID in the formula is more robust than relying on the primary field's value.
    const planRecords = await fetchFullRecordsByFormula(MEDIA_PLANS_TABLE_NAME, `FIND('${brandId}', ARRAYJOIN({brand}))`);
    
    const personaIdToCustomIdMap = await getCustomIdsFromRecordIds(PERSONAS_TABLE_NAME, 'persona_id', planRecords.map(r => r.fields.persona ? r.fields.persona[0] : null).filter(Boolean));

    return planRecords.map((record: any) => {
        const personaRecordId = record.fields.persona ? record.fields.persona[0] : undefined;
        return {
            id: record.fields.plan_id,
            name: record.fields.name,
            prompt: record.fields.prompt,
            source: record.fields.source,
            productImages: record.fields.product_images_json ? JSON.parse(record.fields.product_images_json) : [],
            personaId: personaRecordId ? personaIdToCustomIdMap.get(personaRecordId) : undefined,
        }
    });
};

export const loadMediaPlan = async (planId: string): Promise<{ plan: MediaPlan; imageUrls: Record<string, string>; videoUrls: Record<string, string>; }> => {
    const planRecord = await findRecordByField(MEDIA_PLANS_TABLE_NAME, 'plan_id', planId);
    if (!planRecord) {
        throw new Error(`Plan with ID ${planId} not found.`);
    }
    const postRecords = await fetchFullRecordsByFormula(POSTS_TABLE_NAME, `{media_plan} = '${planId}'`);
    
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
            mediaOrder: fields.media_order ? fields.media_order.split(',').filter(Boolean) as ('image' | 'video')[] : undefined,
            sources: (fields.source_urls || '').split('\n').map((line: string) => {
                const parts = line.split(':');  
                const title = parts.shift() || '';
                const uri = parts.join(':').trim();
                return { title, uri };
            }).filter((s:any) => s.uri),
            promotedProductIds: fields.promoted_products,
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
    
    // --- Refactored Reverse ID Mapping ---
    // 1. Gather all Airtable record IDs that need to be mapped back to your app's custom IDs.
    const allPromotedProductRecordIds = Array.from(weeks.values())
        .flatMap(week => week.posts)
        .flatMap(post => post.promotedProductIds || [])
        .filter(id => id && id.startsWith('rec'));

    // 2. Perform a single, batched lookup to get the custom 'link_id' for each record ID.
    const productRecordIdToCustomIdMap = await getCustomIdsFromRecordIds(
        AFFILIATE_PRODUCTS_TABLE_NAME,
        'link_id',
        allPromotedProductRecordIds
    );

    // 3. Iterate through the posts and replace the Airtable record IDs with your app's custom IDs.
    for (const week of weeks.values()) {
        for (const post of week.posts) {
            if (post.promotedProductIds) {
                post.promotedProductIds = post.promotedProductIds.map(id =>
                    productRecordIdToCustomIdMap.get(id) || id // Fallback to original id if not found
                );
            }
        }
    }
    
    const finalPlan: MediaPlan = Array.from(weeks.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([weekNum, weekData]) => ({
            week: weekNum,
            theme: weekData.theme,
            posts: weekData.posts
        }));
    
    return { plan: finalPlan, imageUrls, videoUrls };
};

const getCustomIdsFromRecordIds = async (tableName: string, customIdField: string, recordIds: (string | null | undefined)[]): Promise<Map<string, string>> => {
    const validRecordIds = recordIds.filter((id): id is string => !!id && id.startsWith('rec'));
    if (validRecordIds.length === 0) {
        return new Map();
    }
    const uniqueRecordIds = [...new Set(validRecordIds)];
    const formula = `OR(${uniqueRecordIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`;
    const records = await fetchFullRecordsByFormula(tableName, formula, [customIdField]);
    
    const recordIdToCustomIdMap = new Map<string, string>();
    records.forEach((r: any) => {
        if (r.id && r.fields[customIdField]) {
            recordIdToCustomIdMap.set(r.id, r.fields[customIdField]);
        }
    });
    return recordIdToCustomIdMap;
};

export const bulkPatchPosts = async (updates: { postId: string; fields: Record<string, any> }[]) => {
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
    if (!brandRecord) {
        throw new Error(`Brand with ID ${brandId} not found.`);
    }
    const trendFields = {
        trend_id: trend.id,
        industry: trend.industry,
        topic: trend.topic,
        keywords: trend.keywords.join(', '),
        links_json: JSON.stringify(trend.links),
        notes: trend.notes,
        created_at: trend.createdAt,
        brand: [brandRecord.id]
    };
    
    const existingRecord = await findRecordByField(TRENDS_TABLE_NAME, 'trend_id', trend.id);
    if (existingRecord) {
        await patchAirtableRecords(TRENDS_TABLE_NAME, [{ id: existingRecord.id, fields: trendFields }]);
    } else {
        await sendToAirtable([{ fields: trendFields }], TRENDS_TABLE_NAME);
    }
};

export const deleteTrendFromAirtable = async (trendId: string) => {
    const record = await findRecordByField(TRENDS_TABLE_NAME, 'trend_id', trendId);
    if (record) await deleteAirtableRecords(TRENDS_TABLE_NAME, [record.id]);
};

export const saveIdeas = async (ideas: Idea[]) => {
    if (ideas.length === 0) return;

    for (const idea of ideas) {
        if (!idea.id || !idea.title || !idea.description || !idea.targetAudience) {
            console.error("Invalid idea structure:", idea);
            throw new Error(`Idea is missing required fields for Airtable save. ID: ${!!idea.id}, Title: ${!!idea.title}, Description: ${!!idea.description}, TargetAudience: ${!!idea.targetAudience}`);
        }
        const trendRecord = await findRecordByField(TRENDS_TABLE_NAME, 'trend_id', idea.trendId);
        if (!trendRecord) {
            throw new Error(`Trend with ID ${idea.trendId} not found.`);
        }
        const recordsToCreate = {
            fields: {
                idea_id: idea.id,
                title: idea.title,
                description: idea.description,
                target_audience: idea.targetAudience,
                product_id: idea.productId,
                trend: [trendRecord.id],
            }
        };
        try {
            await sendToAirtable([recordsToCreate], IDEAS_TABLE_NAME);
        } catch (error) {
            console.error("Failed to save ideas to Airtable:", error);
            throw new Error(`Failed to save ideas to Airtable: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};

export const listBrandsFromAirtable = async (): Promise<{ id: string, name: string }[]> => {
    try {
        const path = `${BRANDS_TABLE_NAME}`;
        const response = await airtableFetch(path, {});
        
        return response.records.map((record: any) => ({
            id: record.fields.brand_id,
            name: record.fields.name
        }));
    } catch (error: any) {
        if (error.message && error.message.includes('NOT_FOUND')) {
            console.warn("Brands table not found in Airtable. Returning empty list.");
            return [];
        }
        console.error("Failed to fetch brands from Airtable:", error);
        throw error;
    }
};

export const checkAirtableCredentials = async (): Promise<boolean> => {
    try {
        await airtableFetch(`meta/bases/tables`, {});
        return true;
    } catch (error) {
        console.error("Airtable credential check failed:", error);
        return false;
    }
};

export const listAllAirtableTables = async (): Promise<any[]> => {
    try {
        const response = await airtableFetch(`meta/bases/tables`, {});
        return response.tables || [];
    } catch (error) {
        console.error("Failed to list Airtable tables:", error);
        return [];
    }
};

export const getAirtableTableSchema = async (tableName: string): Promise<any> => {
    try {
        const tables = await listAllAirtableTables();
        const table = tables.find(t => t.name === tableName);
        if (table) {
            return table;
        } else {
            return { error: `Table '${tableName}' not found.` };
        }
    } catch (error) {
        console.error(`Failed to get schema for table ${tableName}:`, error);
        return { error: `Failed to get schema for table ${tableName}.` };
    }
};

async function ensureSpecificTablesAndFieldsExist(tableNames: string[]) {
    // This function is a placeholder for the actual implementation
    // that ensures tables and fields exist in Airtable.
    // In a real application, this would involve checking the Airtable schema
    // and creating or updating tables and fields as needed.
    return Promise.resolve();
}
