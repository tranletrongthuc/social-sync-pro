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
    { name: 'image_prompt_suffix', type: 'multilineText' },
    { name: 'affiliate_content_kit', type: 'multilineText' },
    { name: 'text_generation_model', type: 'singleLineText' },
    { name: 'image_generation_model', type: 'singleLineText' },
    // Linked Records
    { name: 'logo_concepts', type: 'multipleRecordLinks', options: { linkedTableName: LOGO_CONCEPTS_TABLE_NAME, prefersSingleRecordLink: false } },
    { name: 'brand_values', type: 'multipleRecordLinks', options: { linkedTableName: BRAND_VALUES_TABLE_NAME, prefersSingleRecordLink: false } },
    { name: 'key_messages', type: 'multipleRecordLinks', options: { linkedTableName: KEY_MESSAGES_TABLE_NAME, prefersSingleRecordLink: false } },
    { name: 'media_plans', type: 'multipleRecordLinks', options: { linkedTableName: MEDIA_PLANS_TABLE_NAME, prefersSingleRecordLink: false } },
    { name: 'posts', type: 'multipleRecordLinks', options: { linkedTableName: POSTS_TABLE_NAME, prefersSingleRecordLink: false } },
    { name: 'trends', type: 'multipleRecordLinks', options: { linkedTableName: TRENDS_TABLE_NAME, prefersSingleRecordLink: false } },
    { name: 'personas', type: 'multipleRecordLinks', options: { linkedTableName: PERSONAS_TABLE_NAME, prefersSingleRecordLink: false } },
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
    { name: 'image_prompt', type: 'multilineText' },
    { name: 'image_key', type: 'singleLineText' },
    { name: 'image_url', type: 'url' },
    { name: 'video_key', type: 'singleLineText' },
    { name: 'video_url', type: 'url' },
    { name: 'media_order', type: 'singleLineText' },
    { name: 'source_urls', type: 'multilineText' },
    { name: 'scheduled_at', type: 'dateTime', options: { dateFormat: { name: 'local' }, timeFormat: { name: '12hour' }, timeZone: 'client' } },
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
    { name: 'trend', type: 'multipleRecordLinks', options: { linkedTableName: TRENDS_TABLE_NAME, prefersSingleRecordLink: true } },
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
};

let schemaEnsured = false;

// --- API HELPERS (Unchanged) ---
export const airtableFetch = async (url: string, options: RequestInit) => {
    const personalAccessToken = import.meta.env.VITE_AIRTABLE_PAT;
    if (!personalAccessToken) {
        throw new Error("Airtable Personal Access Token is not configured in the environment (AIRTABLE_PAT).");
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${personalAccessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            throw new Error(`Airtable API Error: ${response.status} ${response.statusText}`);
        }
        const message = errorData.error?.message || response.statusText;
        const type = errorData.error?.type;
        throw new Error(`Airtable API Error: ${message} (Type: ${type}). Please check your environment variables.`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
};

const sendToAirtable = async (records: any[], tableName: string): Promise<any[]> => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!baseId || records.length === 0) return [];
    
    const allCreatedRecords: any[] = [];
    for (let i = 0; i < records.length; i += 10) {
        const chunk = records.slice(i, i + 10);
        const response = await airtableFetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
            method: 'POST',
            body: JSON.stringify({ records: chunk, typecast: true })
        });
        if (response.records) {
            allCreatedRecords.push(...response.records);
        }
    }
    console.log(`Successfully sent ${records.length} records to "${tableName}".`);
    return allCreatedRecords;
};

const fetchAllRecordsFromTable = async (tableName: string, fields?: string[]): Promise<any[]> => {
     const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!baseId) return [];

    let allRecords: any[] = [];
    let offset = null;

    let url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?`;
    if (fields && fields.length > 0) {
        fields.forEach(field => { url += `&fields%5B%5D=${encodeURIComponent(field)}`; });
    }

    try {
        do {
            const finalUrl = offset ? `${url}&offset=${offset}` : url;
            const data = await airtableFetch(finalUrl, {});
            allRecords = allRecords.concat(data.records || []);
            offset = data.offset;
        } while (offset);
        return allRecords;
    } catch (error: any) {
        if (error.message && error.message.includes('TABLE_NOT_FOUND')) {
            console.warn(`Airtable table "${tableName}" not found. Returning empty list.`);
            return [];
        }
        throw error;
    }
}

const fetchFullRecordsByFormula = async (tableName: string, formula: string, fields?: string[]): Promise<any[]> => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!baseId) return [];
    let allRecords: any[] = [];
    let offset = null;

    let url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(formula)}`;
    if (fields && fields.length > 0) {
        fields.forEach(field => { url += `&fields%5B%5D=${encodeURIComponent(field)}`; });
    }

    try {
        do {
            const finalUrl = offset ? `${url}&offset=${offset}` : url;
            const data = await airtableFetch(finalUrl, {});
            allRecords = allRecords.concat(data.records || []);
            offset = data.offset;
        } while (offset);
        return allRecords;
    } catch (error: any) {
        if (error.message && error.message.includes('TABLE_NOT_FOUND')) {
            console.warn(`Airtable table "${tableName}" not found. Returning empty list.`);
            return [];
        }
        throw error;
    }
};

const deleteAirtableRecords = async (tableName: string, recordIds: string[]) => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!baseId || recordIds.length === 0) return;
    for (let i = 0; i < recordIds.length; i += 10) {
        const chunk = recordIds.slice(i, i + 10);
        const params = new URLSearchParams();
        chunk.forEach(id => params.append('records[]', id));
        await airtableFetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?${params.toString()}`, { method: 'DELETE' });
    }
    console.log(`Deleted ${recordIds.length} records from ${tableName}.`);
};

const patchAirtableRecords = async (tableName: string, records: any[]): Promise<any[]> => {
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!baseId || records.length === 0) return [];

    const allPatchedRecords: any[] = [];
    for (let i = 0; i < records.length; i += 10) {
        const chunk = records.slice(i, i + 10);
        const response = await airtableFetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
            method: 'PATCH',
            body: JSON.stringify({ records: chunk, typecast: true })
        });
        if (response.records) {
            allPatchedRecords.push(...response.records);
        }
    }
    console.log(`Successfully patched ${records.length} records in "${tableName}".`);
    return allPatchedRecords;
};

const findRecordByField = async (tableName: string, fieldName: string, value: string) => {
    const records = await fetchFullRecordsByFormula(tableName, `{${fieldName}} = "${value}"`);
    return records[0] || null;
};

// --- DATA MAPPERS ---
const mapAssetsToBrandFields = (assets: GeneratedAssets, settings: Settings, brandId: string) => ({
    brand_id: brandId,
    name: assets.brandFoundation.brandName,
    mission: assets.brandFoundation.mission,
    usp: assets.brandFoundation.usp,
    target_audience: assets.brandFoundation.targetAudience,
    personality: assets.brandFoundation.personality,
    color_palette_json: JSON.stringify(assets.coreMediaAssets.colorPalette),
    font_recs_json: JSON.stringify(assets.coreMediaAssets.fontRecommendations),
    unified_profile_json: JSON.stringify(assets.unifiedProfileAssets),
    // Settings fields
    language: settings.language,
    total_posts_per_month: settings.totalPostsPerMonth,
    image_prompt_suffix: settings.imagePromptSuffix,
    affiliate_content_kit: settings.affiliateContentKit,
    text_generation_model: settings.textGenerationModel,
    image_generation_model: settings.imageGenerationModel,
});

const mapPostToAirtableFields = (post: MediaPlanPost, brandRecordId: string, planRecordId?: string, promotedProductRecordIds?: string[]) => ({
    post_id: post.id,
    title: post.title,
    platform: post.platform,
    content_type: post.contentType,
    content: post.content,
    description: post.description,
    hashtags: (post.hashtags || []).join(', '),
    cta: post.cta,
    image_prompt: post.imagePrompt,
    image_key: post.imageKey,
    video_key: post.videoKey,
    media_order: post.mediaOrder?.join(','),
    source_urls: post.sources?.map(s => `${s.title}: ${s.uri}`).join('\n'),
    scheduled_at: post.scheduledAt,
    auto_comment: post.autoComment,
    status: post.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1) : 'Draft',
    is_pillar: !!post.isPillar,
    // Linked Records
    brand: [brandRecordId],
    media_plan: planRecordId ? [planRecordId] : undefined,
    promoted_products: promotedProductRecordIds,
});

// --- SERVICE FUNCTIONS ---
export const ensureAllTablesExist = async () => {
    if (schemaEnsured) return;

    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!baseId) throw new Error("Airtable Base ID is not configured (AIRTABLE_BASE_ID).");

    // --- PASS 1: Create Tables and Non-Link Fields ---
    console.log("Airtable Sync: Starting Pass 1 (Tables & Simple Fields)...");
    
    let baseMeta = await airtableFetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {});
    let existingTables = baseMeta.tables || [];

    for (const [tableName, schema] of Object.entries(ALL_TABLE_SCHEMAS)) {
        const simpleFields = schema.filter(f => f.type !== 'multipleRecordLinks');
        let table = existingTables.find((t: any) => t.name === tableName);

        if (!table) {
            console.log(`Table "${tableName}" not found. Creating with simple fields...`);
            const createTableBody = { name: tableName, fields: simpleFields, description: `Generated by SocialSync Pro` };
            await airtableFetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, { method: 'POST', body: JSON.stringify(createTableBody) });
        } else {
            const existingFieldNames = new Set(table.fields.map((f: any) => f.name));
            const missingSimpleFields = simpleFields.filter(fieldDef => !existingFieldNames.has(fieldDef.name));

            for (const fieldDef of missingSimpleFields) {
                console.log(`Creating missing simple field "${fieldDef.name}" in "${tableName}"...`);
                await airtableFetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${table.id}/fields`, { method: 'POST', body: JSON.stringify(fieldDef) });
            }
        }
    }

    // --- PASS 2: Create Link Fields ---
    console.log("Airtable Sync: Starting Pass 2 (Link Fields)...");

    baseMeta = await airtableFetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {});
    existingTables = baseMeta.tables || [];
    const tableIdMap = new Map(existingTables.map((t: any) => [t.name, t.id]));

    for (const [tableName, schema] of Object.entries(ALL_TABLE_SCHEMAS)) {
        const table = existingTables.find((t: any) => t.name === tableName);
        if (!table) {
            console.error(`Airtable Sync Error: Table "${tableName}" should exist but was not found in Pass 2.`);
            continue;
        }

        const linkFields = schema.filter(f => f.type === 'multipleRecordLinks');
        const existingFieldNames = new Set(table.fields.map((f: any) => f.name));

        for (const fieldDef of linkFields) {
            if (existingFieldNames.has(fieldDef.name)) {
                continue;
            }

            const options = (fieldDef as any).options;

            if (!options || !options.linkedTableName) {
                console.error(`Airtable Sync Error: Field "${fieldDef.name}" in "${tableName}" is of type 'multipleRecordLinks' but is missing 'options.linkedTableName'.`);
                continue;
            }

            const linkedTableId = tableIdMap.get(options.linkedTableName);

            if (!linkedTableId) {
                console.error(`Airtable Sync Error: Could not find table ID for linked table "${options.linkedTableName}" when creating field "${fieldDef.name}" in "${tableName}".`);
                continue;
            }
            
            const newFieldPayload = {
                name: fieldDef.name,
                type: fieldDef.type,
                options: {
                    linkedTableId: linkedTableId,
                }
            };
            
            console.log(`Creating missing link field "${fieldDef.name}" in "${tableName}"...`);
            await airtableFetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${table.id}/fields`, { method: 'POST', body: JSON.stringify(newFieldPayload) });
        }
    }

    console.log("Airtable Sync: All passes complete. Schema is up to date.");
    schemaEnsured = true;
};

export const createOrUpdateBrandRecord = async (assets: GeneratedAssets, settings: Settings, publicImageUrls: Record<string, string>, existingBrandId: string | null): Promise<string> => {
    const brandId = existingBrandId || crypto.randomUUID();
    await ensureAllTablesExist();

    // 1. Upsert Brand with settings included
    let brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    const brandPayload = { fields: mapAssetsToBrandFields(assets, settings, brandId) };
    if (brandRecord) {
        brandRecord = (await patchAirtableRecords(BRANDS_TABLE_NAME, [{ id: brandRecord.id, ...brandPayload }]))[0];
    } else {
        brandRecord = (await sendToAirtable([brandPayload], BRANDS_TABLE_NAME))[0];
    }
    const brandRecordId = brandRecord.id;

    // Helper to manage linked text items (Values, Messages)
    const manageLinkedTextItems = async (tableName: string, idField: string, items: string[], linkField: string) => {
        const itemRecords = await sendToAirtable(items.map(item => ({ fields: { [idField]: crypto.randomUUID(), text: item, [linkField]: [brandRecordId] } })), tableName);
        return itemRecords.map(r => r.id);
    };

    // 2. Create/Link Values and Messages
    const valueRecordIds = await manageLinkedTextItems(BRAND_VALUES_TABLE_NAME, 'value_id', assets.brandFoundation.values, 'brand');
    const messageRecordIds = await manageLinkedTextItems(KEY_MESSAGES_TABLE_NAME, 'message_id', assets.brandFoundation.keyMessaging, 'brand');

    // 3. Create/Link Logo Concepts
    const logoRecords = await sendToAirtable(assets.coreMediaAssets.logoConcepts.map(logo => ({
        fields: {
            logo_id: logo.id,
            style: logo.style,
            prompt: logo.prompt,
            image_key: logo.imageKey,
            image_url: publicImageUrls[logo.imageKey],
            brand: [brandRecordId],
        }
    })), LOGO_CONCEPTS_TABLE_NAME);
    const logoRecordIds = logoRecords.map(r => r.id);

    // 4. Link everything back to the Brand record
    await patchAirtableRecords(BRANDS_TABLE_NAME, [{
        id: brandRecordId,
        fields: {
            brand_values: valueRecordIds,
            key_messages: messageRecordIds,
            logo_concepts: logoRecordIds,
        }
    }]);

    // 5. Save initial Media Plan (if it exists)
    if (assets.mediaPlans && assets.mediaPlans.length > 0) {
        await saveMediaPlanGroup(assets.mediaPlans[0], publicImageUrls, brandId);
    }
    
    return brandId;
};

export const saveSettingsToAirtable = async (settings: Settings, brandId: string) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) {
        throw new Error(`Could not find brand with ID ${brandId} to save settings.`);
    }

    const settingsFields = {
        language: settings.language,
        total_posts_per_month: settings.totalPostsPerMonth,
        image_prompt_suffix: settings.imagePromptSuffix,
        affiliate_content_kit: settings.affiliateContentKit,
        text_generation_model: settings.textGenerationModel,
        image_generation_model: settings.imageGenerationModel,
    };

    await patchAirtableRecords(BRANDS_TABLE_NAME, [{ id: brandRecord.id, fields: settingsFields }]);
};

export const saveMediaPlanGroup = async (group: MediaPlanGroup, publicImageUrls: Record<string, string>, brandId: string) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) throw new Error(`Brand not found with ID ${brandId}`);
    const brandRecordId = brandRecord.id;

    // 0. Find Persona Record ID if a personaId is provided
    let personaRecordId: string | undefined = undefined;
    if (group.personaId) {
        const personaRecord = await findRecordByField(PERSONAS_TABLE_NAME, 'persona_id', group.personaId);
        if (personaRecord) {
            personaRecordId = personaRecord.id;
        } else {
            console.warn(`Could not find persona with ID ${group.personaId} in Airtable. Plan will be saved without persona link.`);
        }
    }

    // 1. Upsert Plan Group
    let planRecord = await findRecordByField(MEDIA_PLANS_TABLE_NAME, 'plan_id', group.id);
    const planPayload = {
        fields: {
            plan_id: group.id,
            name: group.name,
            prompt: group.prompt,
            source: group.source,
            product_images_json: group.productImages ? JSON.stringify(group.productImages) : undefined,
            brand: [brandRecordId],
            persona: personaRecordId ? [personaRecordId] : undefined, // Link to persona
        }
    };
    if (planRecord) {
        planRecord = (await patchAirtableRecords(MEDIA_PLANS_TABLE_NAME, [{ id: planRecord.id, ...planPayload }]))[0];
    } else {
        planRecord = (await sendToAirtable([planPayload], MEDIA_PLANS_TABLE_NAME))[0];
    }
    const planRecordId = planRecord.id;

    // 2. Upsert Posts
    const postPayloads = group.plan.flatMap(week =>
        week.posts.map(post => {
            const fields = mapPostToAirtableFields(post, brandRecordId, planRecordId);
            // Manually add week and theme from the parent week object
            (fields as any).week = week.week;
            (fields as any).theme = week.theme;
            return { fields };
        })
    );
    const createdPostRecords = await sendToAirtable(postPayloads, POSTS_TABLE_NAME);
    const createdPostRecordIds = createdPostRecords.map(r => r.id);

    // 3. Link Posts back to the Plan record
    if (createdPostRecordIds.length > 0) {
        await patchAirtableRecords(MEDIA_PLANS_TABLE_NAME, [{
            id: planRecordId,
            fields: {
                posts: createdPostRecordIds
            }
        }]);
    }

    // 4. Link the new Plan and its Posts back to the Brand record
    const existingPlanRecordIds = brandRecord.fields.media_plans || [];
    const existingPostRecordIds = brandRecord.fields.posts || [];
    const fieldsToUpdate: { media_plans?: string[]; posts?: string[] } = {};

    if (!existingPlanRecordIds.includes(planRecordId)) {
        fieldsToUpdate.media_plans = [...existingPlanRecordIds, planRecordId];
    }
    if (createdPostRecordIds.length > 0) {
        const allPostIds = new Set([...existingPostRecordIds, ...createdPostRecordIds]);
        fieldsToUpdate.posts = Array.from(allPostIds);
    }
    
    if (Object.keys(fieldsToUpdate).length > 0) {
        await patchAirtableRecords(BRANDS_TABLE_NAME, [{
            id: brandRecordId,
            fields: fieldsToUpdate
        }]);
    }
};

export const listBrandsFromAirtable = async (): Promise<{id: string, name: string}[]> => {
    await ensureAllTablesExist();
    const records = await fetchFullRecordsByFormula(BRANDS_TABLE_NAME, 'NOT({brand_id} = "")', ['brand_id', 'name']);
    const brandMap = new Map<string, string>();
    records.forEach(r => {
        if (r.fields.brand_id && r.fields.name) {
            brandMap.set(r.fields.brand_id, r.fields.name);
        }
    });
    return Array.from(brandMap.entries()).map(([id, name]) => ({ id, name }));
};

const fetchLinkedRecords = async (tableName: string, recordIds: string[]) => {
    if (!recordIds || recordIds.length === 0) return [];
    const formula = `OR(${recordIds.map(id => `RECORD_ID()='${id}'`).join(',')})`;
    return await fetchFullRecordsByFormula(tableName, formula);
};

export const loadProjectFromAirtable = async (brandId: string): Promise<{
    assets: GeneratedAssets;
    settings: Partial<Settings>;
    generatedImages: Record<string, string>;
    generatedVideos: Record<string, string>;
    brandId: string;
}> => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) throw new Error(`Project with Brand ID "${brandId}" not found.`);

    const generatedImages: Record<string, string> = {};
    const generatedVideos: Record<string, string> = {};

    // 1. Fetch all linked and related records in parallel
    const [
        logoConceptRecords,
        valueRecords,
        messageRecords,
        personaRecords,
        affiliateLinkRecords,
        trendRecords,
    ] = await Promise.all([
        fetchLinkedRecords(LOGO_CONCEPTS_TABLE_NAME, brandRecord.fields.logo_concepts || []),
        fetchLinkedRecords(BRAND_VALUES_TABLE_NAME, brandRecord.fields.brand_values || []),
        fetchLinkedRecords(KEY_MESSAGES_TABLE_NAME, brandRecord.fields.key_messages || []),
        fetchLinkedRecords(PERSONAS_TABLE_NAME, brandRecord.fields.personas || []),
        fetchFullRecordsByFormula(AFFILIATE_PRODUCTS_TABLE_NAME, `FIND('${brandRecord.id}', ARRAYJOIN(brand))`),
        fetchLinkedRecords(TRENDS_TABLE_NAME, brandRecord.fields.trends || []),
    ]);
    
    // 2. Fetch ideas based on the trends we found
    const ideaRecordIds = [...new Set(trendRecords.flatMap((r: any) => r.fields.ideas || []))];
    const ideaRecords = await fetchLinkedRecords(IDEAS_TABLE_NAME, ideaRecordIds);
    
    // Create a map from Airtable record ID to our internal trend UUID for linking ideas
    const trendRecordIdToUUIDMap = new Map<string, string>();
    trendRecords.forEach((r: any) => trendRecordIdToUUIDMap.set(r.id, r.fields.trend_id));

    // 3. Re-assemble the assets object
    const brandFoundation: BrandFoundation = {
        brandName: brandRecord.fields.name,
        mission: brandRecord.fields.mission,
        usp: brandRecord.fields.usp,
        targetAudience: brandRecord.fields.target_audience,
        personality: brandRecord.fields.personality,
        values: valueRecords.map((r: any) => r.fields.text),
        keyMessaging: messageRecords.map((r: any) => r.fields.text),
    };

    const coreMediaAssets: CoreMediaAssets = {
        logoConcepts: logoConceptRecords.map((r: any): LogoConcept => {
            if (r.fields.image_key && r.fields.image_url) {
                generatedImages[r.fields.image_key] = r.fields.image_url;
            }
            return {
                id: r.fields.logo_id,
                style: r.fields.style,
                prompt: r.fields.prompt,
                imageKey: r.fields.image_key,
            };
        }),
        colorPalette: JSON.parse(brandRecord.fields.color_palette_json || '{}'),
        fontRecommendations: JSON.parse(brandRecord.fields.font_recs_json || '{}'),
    };
    
    const unifiedProfileAssets: UnifiedProfileAssets = JSON.parse(brandRecord.fields.unified_profile_json || '{}');
    if (unifiedProfileAssets.profilePictureImageKey && brandRecord.fields.unified_profile_json.includes(unifiedProfileAssets.profilePictureImageKey)) {
        // This is a placeholder, as the actual URL might be elsewhere. The UI relies on the generatedImages map.
    }

    const personas: Persona[] = personaRecords.map((r: any) => {
        if (r.fields.avatar_image_key && r.fields.avatar_image_url) {
            generatedImages[r.fields.avatar_image_key] = r.fields.avatar_image_url;
        }
        const personaId = r.fields.persona_id;
        const photos: PersonaPhoto[] = Array.from({ length: 5 }).map((_, i) => ({
            id: crypto.randomUUID(),
            imageKey: `persona_${personaId}_photo_${i}`
        }));
        if (r.fields.avatar_image_key) {
            // Put the main avatar in the first slot
            photos[0].imageKey = r.fields.avatar_image_key;
        }
        return {
            id: personaId,
            nickName: r.fields.nick_name,
            outfitDescription: r.fields.outfit_description,
            mainStyle: r.fields.main_style,
            activityField: r.fields.activity_field,
            avatarImageKey: r.fields.avatar_image_key,
            avatarImageUrl: r.fields.avatar_image_url,
            photos: photos,
        };
    });

    const affiliateLinks: AffiliateLink[] = affiliateLinkRecords.map((r: any) => ({
        id: r.fields.link_id,
        productId: r.fields.product_id,
        productName: r.fields.product_name,
        price: r.fields.price,
        salesVolume: r.fields.sales_volume,
        providerName: r.fields.provider_name,
        commissionRate: (r.fields.commission_rate || 0) * 100, // Convert from 0.2 to 20
        commissionValue: r.fields.commission_value,
        productLink: r.fields.product_link,
        promotionLink: r.fields.promotion_link,
    }));

    const trends: Trend[] = trendRecords.map((r: any) => ({
        id: r.fields.trend_id,
        brandId: brandId,
        industry: r.fields.industry,
        topic: r.fields.topic,
        keywords: (r.fields.keywords || '').split(',').map((k: string) => k.trim()).filter(Boolean),
        links: JSON.parse(r.fields.links_json || '[]'),
        notes: r.fields.notes,
        createdAt: r.fields.created_at,
    }));

    const ideas: Idea[] = ideaRecords.map((r: any) => ({
        id: r.fields.idea_id,
        trendId: (r.fields.trend && r.fields.trend.length > 0) ? trendRecordIdToUUIDMap.get(r.fields.trend[0]) || '' : '',
        title: r.fields.title,
        description: r.fields.description,
        targetAudience: r.fields.target_audience,
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
    const existingRecord = await findRecordByField(PERSONAS_TABLE_NAME, 'persona_id', persona.id);

    if (existingRecord) {
        personaAirtableRecord = (await patchAirtableRecords(PERSONAS_TABLE_NAME, [{ id: existingRecord.id, fields: personaFields }]))[0];
    } else {
        personaAirtableRecord = (await sendToAirtable([{ fields: personaFields }], PERSONAS_TABLE_NAME))[0];
        
        // This is a new record, so link it back to the brand.
        const existingPersonaRecordIds = brandRecord.fields.personas || [];
        if (!existingPersonaRecordIds.includes(personaAirtableRecord.id)) {
            await patchAirtableRecords(BRANDS_TABLE_NAME, [{
                id: brandRecordId,
                fields: {
                    personas: [...existingPersonaRecordIds, personaAirtableRecord.id]
                }
            }]);
        }
    }
};

export const deletePersonaFromAirtable = async (personaId: string, brandId: string) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    const personaRecord = await findRecordByField(PERSONAS_TABLE_NAME, 'persona_id', personaId);

    if (personaRecord) {
        // Unlink from brand
        if (brandRecord && brandRecord.fields.personas) {
            const updatedPersonaIds = brandRecord.fields.personas.filter((id: string) => id !== personaRecord.id);
            await patchAirtableRecords(BRANDS_TABLE_NAME, [{
                id: brandRecord.id,
                fields: { personas: updatedPersonaIds }
            }]);
        }
        // Delete the persona record itself
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
        fields: { image_prompt: post.imagePrompt }
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
        content: post.content,
        description: post.description,
        hashtags: (post.hashtags || []).join(', '),
        cta: post.cta,
        image_prompt: post.imagePrompt,
        image_key: post.imageKey,
        video_key: post.videoKey,
        media_order: post.mediaOrder?.join(','),
        scheduled_at: post.scheduledAt,
        auto_comment: post.autoComment,
        status: post.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1) : 'Draft',
    };
    
    if (imageUrl) fieldsToUpdate.image_url = imageUrl;
    if (videoUrl) fieldsToUpdate.video_url = videoUrl;
    
    if (post.promotedProductIds && post.promotedProductIds.length > 0) {
         const formula = `OR(${post.promotedProductIds.map(id => `{link_id} = "${id}"`).join(',')})`;
         const productRecords = await fetchFullRecordsByFormula(AFFILIATE_PRODUCTS_TABLE_NAME, formula, []);
         fieldsToUpdate.promoted_products = productRecords.map(r => r.id);
    } else {
        fieldsToUpdate.promoted_products = [];
    }
    
    await patchAirtableRecords(POSTS_TABLE_NAME, [{ id: postRecord.id, fields: fieldsToUpdate }]);
};

export const bulkUpdatePostSchedules = async (updates: { postId: string; scheduledAt: string; status: 'scheduled' }[], brandId: string) => {
    const recordsToPatch = await Promise.all(updates.map(async (update) => {
        const postRecord = await findRecordByField(POSTS_TABLE_NAME, 'post_id', update.postId);
        if (postRecord) {
            return {
                id: postRecord.id,
                fields: {
                    scheduled_at: update.scheduledAt,
                    status: 'Scheduled'
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

export const syncAssetMedia = async (publicUrls: Record<string, string>, brandId: string, assets: GeneratedAssets) => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) return;

    // 1. Update Brand record with unified profile JSON
    await patchAirtableRecords(BRANDS_TABLE_NAME, [{
        id: brandRecord.id,
        fields: {
            unified_profile_json: JSON.stringify(assets.unifiedProfileAssets),
        }
    }]);

    // 2. Update Logo Concept records with image URLs
    const logoPatches = assets.coreMediaAssets.logoConcepts.map(async (logo) => {
        const logoRecord = await findRecordByField(LOGO_CONCEPTS_TABLE_NAME, 'logo_id', logo.id);
        const imageUrl = publicUrls[logo.imageKey];
        if (logoRecord && imageUrl) {
            return {
                id: logoRecord.id,
                fields: {
                    image_key: logo.imageKey,
                    image_url: imageUrl,
                }
            };
        }
        return null;
    });

    const resolvedPatches = (await Promise.all(logoPatches)).filter(p => p !== null);
    if (resolvedPatches.length > 0) {
        await patchAirtableRecords(LOGO_CONCEPTS_TABLE_NAME, resolvedPatches as any[]);
    }
};

export const fetchSettingsFromAirtable = async (brandId: string): Promise<Partial<Settings> | null> => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord) {
        console.warn(`No brand found in Airtable for brand ID: ${brandId}`);
        return null;
    }

    const { fields } = brandRecord;
    
    // Map from Airtable snake_case to JS camelCase
    const settings: Partial<Settings> = {
        language: fields.language,
        totalPostsPerMonth: fields.total_posts_per_month,
        imagePromptSuffix: fields.image_prompt_suffix,
        affiliateContentKit: fields.affiliate_content_kit,
        textGenerationModel: fields.text_generation_model,
        imageGenerationModel: fields.image_generation_model,
    };

    return settings;
};
export const listMediaPlanGroupsForBrand = async (brandId: string): Promise<{id: string; name: string; prompt: string; source?: MediaPlanGroup['source']; productImages?: { name: string, type: string, data: string }[]; personaId?: string;}[]> => {
    const brandRecord = await findRecordByField(BRANDS_TABLE_NAME, 'brand_id', brandId);
    if (!brandRecord || !brandRecord.fields.media_plans) {
        return [];
    }

    const planRecordIds = brandRecord.fields.media_plans;
    if (!planRecordIds || planRecordIds.length === 0) return [];

    const formula = `OR(${planRecordIds.map((id: string) => `RECORD_ID()='${id}'`).join(',')})`;
    const planRecords = await fetchFullRecordsByFormula(MEDIA_PLANS_TABLE_NAME, formula, ['plan_id', 'name', 'prompt', 'source', 'product_images_json', 'persona']);
    
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
            imagePrompt: fields.image_prompt,
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

    // 2. Link the new/updated trend back to the brand record
    const existingTrendRecordIds = brandRecord.fields.trends || [];
    if (!existingTrendRecordIds.includes(trendAirtableRecord.id)) {
        await patchAirtableRecords(BRANDS_TABLE_NAME, [{
            id: brandRecordId,
            fields: {
                trends: [...existingTrendRecordIds, trendAirtableRecord.id]
            }
        }]);
    }
};

export const deleteTrendFromAirtable = async (trendId: string, brandId: string) => {
    const record = await findRecordByField(TRENDS_TABLE_NAME, 'trend_id', trendId);
    if (record) await deleteAirtableRecords(TRENDS_TABLE_NAME, [record.id]);
};

export const saveIdeas = async (ideas: Idea[]) => {
    if (ideas.length === 0) return;
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
            trend: trendRecordId ? [trendRecordId] : undefined,
        }
    }));
    
    const createdIdeaRecords = await sendToAirtable(recordsToCreate, IDEAS_TABLE_NAME);

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