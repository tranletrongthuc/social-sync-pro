// databaseService.ts
import type {
  GeneratedAssets,
  Settings,
  MediaPlan,
  CoreMediaAssets,
  UnifiedProfileAssets,
  MediaPlanGroup,
  BrandFoundation,
  MediaPlanPost,
  AffiliateLink,
  Persona,
  Trend,
  Idea,
  AIService,
  AIModel,
} from '../../types';
import { initialGeneratedAssets } from '../reducers/assetsReducer';

// Cache for loaded data to prevent unnecessary reloads
export const dataCache: Record<string, any> = {};

/**
 * Clear cache for a specific brand
 */
export const clearCacheForBrand = (brandId: string): void => {
  console.log('Clearing cache for brand:', brandId);
  Object.keys(dataCache).forEach((key) => {
    if (key.includes(brandId)) {
      delete dataCache[key];
    }
  });
};

/**
 * Clear all cache
 */
export const clearAllCache = (): void => {
  console.log('Clearing all cache');
  Object.keys(dataCache).forEach((key) => delete dataCache[key]);
};

// ==============================
// 🔌 Pluggable Database Service Router
// ==============================

type DataSource = 'mongodb' | 'postgresql' | 'firebase';

/**
 * Generic utility to call any database service action
 * Routes to MongoDB, PostgreSQL, or Firebase based on dataSource
 */
async function callDatabaseService<T>(
  action: string,
  payload: Record<string, any>,
  options?: {
    invalidatesCacheForBrand?: string;
    expectsJson?: boolean;
    dataSource?: DataSource; // 'mongodb' (default), 'postgresql', 'firebase'
  }
): Promise<T> {
  const {
    invalidatesCacheForBrand,
    expectsJson = true,
    dataSource = 'mongodb',
  } = options || {};

  try {
    const result = await handlers[dataSource](action, payload, expectsJson);

    // Optional cache invalidation
    if (invalidatesCacheForBrand) {
      clearCacheForBrand(invalidatesCacheForBrand);
    }

    return result;
  } catch (error) {
    console.error(`callDatabaseService: Error in action '${action}' on '${dataSource}':`, error);
    
    // Handle network errors specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`Network error when calling ${dataSource} action '${action}':`, error);
      throw new Error(`Network error: Unable to reach the ${dataSource} service. Please check your connection and try again.`);
    }
    
    throw error;
  }
}

// ==============================
// 🧩 Handlers for Different Data Sources
// ==============================

const handlers = {
  /**
   * MongoDB: REST API via /api/mongodb
   */
  mongodb: async (action: string, payload: Record<string, any>, expectsJson: boolean) => {
    try {
      // Use GET for allowed actions, POST for others
      const GET_ALLOWED_ACTIONS = [
        'list-media-plan-groups',
        'fetch-affiliate-links',
        'fetch-settings',
        'load-personas',
        'load-strategy-hub',
        'load-ideas-for-trend',
        'load-trend',
        'load-affiliate-vault',
        'check-credentials',
        'check-product-exists',
        'app-init',
        'load-settings-data',
        'load-media-plan',
        'load-media-plan-posts',
        'load-complete-project',
        'load-project'
      ];
      
      const isGetAllowed = GET_ALLOWED_ACTIONS.includes(action);
      const method = isGetAllowed ? 'GET' : 'POST';
      
      let url = `/api/mongodb?action=${action}`;
      let body = undefined;
      
      if (method === 'POST') {
        body = JSON.stringify(payload);
      } else if (method === 'GET' && Object.keys(payload).length > 0) {
        const queryParams = [];
        for (const [key, value] of Object.entries(payload)) {
          if (value !== undefined && value !== null) {
            queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
          }
        }
        if (queryParams.length > 0) {
          const separator = url.includes('?') ? '&' : '?';
          url += `${separator}${queryParams.join('&')}`;
        }
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return expectsJson ? await response.json() : await response.text();
    } catch (error) {
      console.error(`MongoDB handler error for action '${action}':`, error);
      throw error;
    }
  },

  postgresql: async (action: string, payload: Record<string, any>, expectsJson: boolean) => {
    const response = await fetch(`/api/postgresql?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PostgreSQL error ${response.status}: ${errorText}`);
    }

    return expectsJson ? await response.json() : await response.text();
  },

  firebase: async (action: string, payload: Record<string, any>, expectsJson: boolean) => {
    const functionUrl = `https://us-central1-your-project.cloudfunctions.net/api?action=${action}`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firebase error ${response.status}: ${errorText}`);
    }

    return expectsJson ? await response.json() : await response.text();
  },
};

// ==============================
// 📦 Refactored Functions
// ==============================

const saveAdminDefaultsToDatabase = async (settings: Settings): Promise<void> => {
  await callDatabaseService('save-admin-defaults', { settings });
};

const saveSettingsToDatabase = async (settings: Settings, brandId: string): Promise<void> => {
  await callDatabaseService('save-settings', { settings, brandId }, { invalidatesCacheForBrand: brandId });
};

const createOrUpdateBrandRecordInDatabase = async (
  assets: GeneratedAssets,
  brandId: string | null
): Promise<string> => {
  const result = await callDatabaseService<{ brandId: string }>('create-or-update-brand', { assets, brandId });
  return result.brandId;
};

const syncAssetMediaWithDatabase = async (brandId: string, assets: GeneratedAssets, settings: Settings): Promise<void> => {
  await callDatabaseService('sync-asset-media', { brandId, assets, settings }, { invalidatesCacheForBrand: brandId });
};

const saveAffiliateLinksToDatabase = async (links: AffiliateLink[], brandId: string): Promise<AffiliateLink[]> => {
  const result = await callDatabaseService<{ links: AffiliateLink[] }>('save-affiliate-links', { links, brandId }, { invalidatesCacheForBrand: brandId });
  return result.links || [];
};

const fetchAffiliateLinksForBrandFromDatabase = async (brandId: string): Promise<AffiliateLink[]> => {
  const result = await callDatabaseService<{ affiliateLinks: AffiliateLink[] }>('fetch-affiliate-links', { brandId });
  return result.affiliateLinks;
};

const deleteAffiliateLinkFromDatabase = async (linkId: string, brandId: string): Promise<void> => {
  await callDatabaseService('delete-affiliate-link', { linkId, brandId }, { invalidatesCacheForBrand: brandId });
};

const savePersonaToDatabase = async (persona: Partial<Persona>, brandId: string, settings: Settings): Promise<string> => {
  const result = await callDatabaseService<{ id: string }>('save-persona', { persona, brandId, settings }, { invalidatesCacheForBrand: brandId });
  return result.id;
};

const deletePersonaFromDatabase = async (personaId: string, brandId: string, settings: Settings): Promise<void> => {
  await callDatabaseService('delete-persona', { personaId, brandId, settings }, { invalidatesCacheForBrand: brandId });
};

const updatePersonaState = async (personaId: string, isActive: boolean, brandId: string): Promise<void> => {
  await callDatabaseService('update-persona-state', { personaId, isActive, brandId }, { invalidatesCacheForBrand: brandId });
};

const assignPersonaToPlanInDatabase = async (
  planId: string,
  personaId: string | null,
  updatedPosts: { id: string; mediaPrompt: string | string[]; }[],
  brandId: string
): Promise<void> => {
  await callDatabaseService('assign-persona-to-plan', { planId, personaId, updatedPosts, brandId }, { invalidatesCacheForBrand: brandId });
};

const updateMediaPlanPostInDatabase = async (
  postId: string,
  brandId: string,
  updates: Partial<MediaPlanPost>
): Promise<void> => {
  await callDatabaseService('update-media-plan-post', { post: { id: postId, ...updates }, brandId }, { invalidatesCacheForBrand: brandId });
};

const saveMediaPlanGroupToDatabase = async (
  group: MediaPlanGroup,
  imageUrls: Record<string, string>,
  brandId: string,
  settings: Settings
): Promise<{ savedPlan: MediaPlanGroup }> => {
  return await callDatabaseService('save-media-plan-group', { group, imageUrls, brandId, settings }, { invalidatesCacheForBrand: brandId });
};

const saveTrendToDatabase = async (trend: Omit<Trend, 'id'> & { id?: string }, brandId: string): Promise<string> => {
  const result = await callDatabaseService<{ id: string }>('save-trend', { trend, brandId }, { invalidatesCacheForBrand: brandId });
  return result.id;
};

const deleteTrendFromDatabase = async (trendId: string, brandId: string): Promise<void> => {
  await callDatabaseService('delete-trend', { trendId, brandId }, { invalidatesCacheForBrand: brandId });
};

const saveIdeasToDatabase = async (ideas: Partial<Idea>[], brandId: string): Promise<Idea[]> => {
  const result = await callDatabaseService<{ ideas: Idea[] }>('save-ideas', { ideas, brandId }, { invalidatesCacheForBrand: brandId });
  return result.ideas;
};

const saveTrendsToDatabase = async (trends: (Omit<Trend, 'id'> & { id?: string })[], brandId: string): Promise<Trend[]> => {
  const result = await callDatabaseService<{ trends: Trend[] }>('save-trends', { trends, brandId }, { invalidatesCacheForBrand: brandId });
  return result.trends;
};

const saveAIModelToDatabase = async (model: {
  id?: string;
  name: string;
  provider: string;
  capabilities: string[];
  service: string;
}): Promise<void> => {
  await callDatabaseService('save-ai-model', { model });
};

const deleteAIModelFromDatabase = async (modelId: string): Promise<void> => {
  await callDatabaseService('delete-ai-model', { modelId });
};

const loadSettingsDataFromDatabase = async (): Promise<{ services: AIService[]; adminSettings: Settings }> => {
  return await callDatabaseService('load-settings-data', {});
};

const listMediaPlanGroupsForBrandFromDatabase = async (brandId: string): Promise<
  {
    id: string;
    name: string;
    prompt: string;
    source?: MediaPlanGroup['source'];
    productImages?: { name: string; type: string; data: string }[];
    personaId?: string;
  }[]
> => {
  const result = await callDatabaseService<{ groups: any[] }>('list-media-plan-groups', { brandId });
  return result.groups;
};

const bulkPatchPostsInDatabase = async (updates: { postId: string; fields: Record<string, any> }[]): Promise<void> => {
  await callDatabaseService('bulk-patch-posts', { updates });
};

const bulkUpdatePostSchedulesInDatabase = async (updates: { postId: string; scheduledAt: string; status: 'scheduled' }[]): Promise<void> => {
  await callDatabaseService('bulk-update-post-schedules', { updates });
};

const loadProjectFromDatabase = async (brandId: string): Promise<{
  assets: GeneratedAssets;
  generatedImages: Record<string, string>;
  generatedVideos: Record<string, string>;
  brandId: string;
}> => {
  return await callDatabaseService('load-complete-project', { brandId });
};

const checkIfProductExistsInDatabase = async (productId: string): Promise<boolean> => {
  try {
    const result = await callDatabaseService<{ exists: boolean }>('check-product-exists', { productId });
    return result.exists || false;
  } catch (error) {
    console.error('Failed to check if product exists in database:', error);
    return false;
  }
};

const initializeApp = async (): Promise<{
  credentialsSet: boolean;
  brands: { id: string; name: string }[];
  adminDefaults: Settings;
  aiModels: AIModel[];
}> => {
  try {
    return await callDatabaseService('app-init', {});
  } catch (error) {
    console.error('Failed to initialize app:', error);
    return { credentialsSet: false, brands: [], adminDefaults: {} as Settings, aiModels: [] };
  }
};

const loadIdeasForTrendFromDatabase = async (trendId: string, brandId: string): Promise<Idea[]> => {
  const result = await callDatabaseService<{ ideas: Idea[] }>('load-ideas-for-trend', { trendId, brandId });
  return result.ideas || [];
};

const loadInitialProjectData = async (brandId: string): Promise<{
  brandSummary: { id: string; name: string; logoUrl?: string };
  brandKitData: {
    brandFoundation: BrandFoundation;
    coreMediaAssets: CoreMediaAssets;
    unifiedProfileAssets: UnifiedProfileAssets;
    settings: Settings;
  };
  affiliateLinks: AffiliateLink[];
}> => {
  return await callDatabaseService('initial-load', { brandId });
};

const loadMediaPlanGroupsList = async (brandId: string): Promise<
  {
    id: string;
    name: string;
    prompt: string;
    source?: MediaPlanGroup['source'];
    productImages?: { name: string; type: string; data: string }[];
    personaId?: string;
  }[]
> => {
  const result = await callDatabaseService<{ groups: any[] }>('list-media-plan-groups', { brandId });
  return result.groups;
};

const loadStrategyHubData = async (brandId: string): Promise<{
  trends: Trend[];
  ideas: Idea[];
}> => {
  if (!brandId) {
    return { trends: [], ideas: [] };
  }
  try {
    const data = await callDatabaseService<{ trends: Trend[]; ideas: Idea[] }>('load-strategy-hub', { brandId });
    return data || { trends: [], ideas: [] };
  } catch (error) {
    console.error('Error loading strategy hub data:', error);
    return { trends: [], ideas: [] };
  }
};

const loadAffiliateVaultData = async (brandId: string): Promise<AffiliateLink[]> => {
  if (!brandId) {
    return [];
  }
  try {
    const result = await callDatabaseService<{ affiliateLinks: AffiliateLink[] }>('load-affiliate-vault', { brandId });
    return result.affiliateLinks || [];
  } catch (error) {
    console.error('Error loading affiliate vault data:', error);
    return [];
  }
};

const loadPersonasData = async (brandId: string): Promise<Persona[]> => {
  if (!brandId) {
    return [];
  }
  try {
    const result = await callDatabaseService<{ personas: Persona[] }>('load-personas', { brandId });
    return result.personas || [];
  } catch (error) {
    console.error('Error loading personas data:', error);
    return [];
  }
};

const loadMediaPlanPostsWithPagination = async (
  planId: string,
  page: number = 1,
  limit: number = 30
): Promise<{ posts: MediaPlanPost[]; pagination: any }> => {
  return await callDatabaseService('load-media-plan-posts', { planId, page, limit });
};

const loadTrend = async (trendId: string, brandId: string): Promise<Trend | null> => {
  const cacheKey = `trend-${trendId}-${brandId}`;
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  try {
    const data = await callDatabaseService<{ trend: Trend }>('load-trend', { trendId, brandId });
    dataCache[cacheKey] = data.trend;
    return data.trend;
  } catch (error) {
    console.error('Error loading trend:', error);
    throw error;
  }
};

const loadMediaPlanFromDatabase = async (planId: string): Promise<{ plan: any, imageUrls: Record<string, string>, videoUrls: Record<string, string> }> => {
    return callDatabaseService('load-media-plan', { planId });
};

// ==============================
// 🚀 Export All Functions
// ==============================

export {
  saveAdminDefaultsToDatabase,
  saveSettingsToDatabase,
  createOrUpdateBrandRecordInDatabase,
  syncAssetMediaWithDatabase,
  saveAffiliateLinksToDatabase,
  fetchAffiliateLinksForBrandFromDatabase,
  deleteAffiliateLinkFromDatabase,
  savePersonaToDatabase,
  deletePersonaFromDatabase,
  updatePersonaState,
  assignPersonaToPlanInDatabase,
  updateMediaPlanPostInDatabase,
  saveMediaPlanGroupToDatabase,
  saveTrendToDatabase,
  deleteTrendFromDatabase,
  saveIdeasToDatabase,
  saveTrendsToDatabase,
  saveAIModelToDatabase,
  deleteAIModelFromDatabase,
  loadSettingsDataFromDatabase,
  listMediaPlanGroupsForBrandFromDatabase,
  bulkPatchPostsInDatabase,
  bulkUpdatePostSchedulesInDatabase,
  loadProjectFromDatabase,
  checkIfProductExistsInDatabase,
  loadIdeasForTrendFromDatabase,
  loadInitialProjectData,
  loadMediaPlanGroupsList,
  loadStrategyHubData,
  loadAffiliateVaultData,
  loadPersonasData,
  loadMediaPlanPostsWithPagination,
  initializeApp,
  loadTrend,
  loadMediaPlanFromDatabase,
};