import type { BrandFoundation, CoreMediaAssets, UnifiedProfileAssets, AffiliateLink, MediaPlanGroup, Trend, Idea, Persona, MediaPlanPost } from '../../types';
import { 
  loadInitialProjectData, 
  loadMediaPlanGroupsList, 
  loadStrategyHubData, 
  loadAffiliateVaultData, 
  loadPersonasData, 
  loadMediaPlanPostsWithPagination 
} from './databaseService';

/**
 * Service for lazy loading data to improve initial load times
 */

import { dataCache } from './databaseService';

/**
 * Load initial project data for fast rendering of the BrandKitView
 */
export const loadInitialData = async (brandId: string): Promise<{
  brandSummary: { id: string; name: string; logoUrl?: string };
  brandKitData: {
    brandFoundation: BrandFoundation;
    coreMediaAssets: CoreMediaAssets;
    unifiedProfileAssets: UnifiedProfileAssets;
  };
  affiliateLinks: AffiliateLink[];
}> => {
  const cacheKey = `initial-${brandId}`;
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  
  const data = await loadInitialProjectData(brandId);
  dataCache[cacheKey] = data;
  return data;
};

/**
 * Load media plan groups list for the MediaPlanView
 */
export const loadMediaPlanGroups = async (brandId: string): Promise<{
  id: string;
  name: string;
  prompt: string;
  source?: MediaPlanGroup['source'];
  productImages?: { name: string, type: string, data: string }[];
  personaId?: string;
}[]> => {
  const cacheKey = `media-plan-groups-${brandId}`;
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  
  const data = await loadMediaPlanGroupsList(brandId);
  dataCache[cacheKey] = data;
  return data;
};

/**
 * Load strategy hub data (trends and ideas)
 */
export const loadStrategyHub = async (brandId: string): Promise<{
  trends: Trend[];
  ideas: Idea[];
}> => {
  console.log("loadStrategyHub called with brandId:", brandId);
  const cacheKey = `strategy-hub-${brandId}`;
  if (dataCache[cacheKey]) {
    console.log("Returning cached strategy hub data");
    return dataCache[cacheKey];
  }
  
  console.log("Loading strategy hub data from database");
  const data = await loadStrategyHubData(brandId);
  dataCache[cacheKey] = data;
  console.log("Strategy hub data loaded and cached:", data);
  return data;
};

/**
 * Load affiliate vault data
 */
export const loadAffiliateVault = async (brandId: string): Promise<AffiliateLink[]> => {
  console.log("loadAffiliateVault called with brandId:", brandId);
  const cacheKey = `affiliate-vault-${brandId}`;
  if (dataCache[cacheKey]) {
    console.log("Returning cached affiliate vault data");
    return dataCache[cacheKey];
  }
  
  console.log("Loading affiliate vault data from database");
  const data = await loadAffiliateVaultData(brandId);
  dataCache[cacheKey] = data;
  console.log("Affiliate vault data loaded and cached:", data);
  return data;
};

/**
 * Load personas data
 */
export const loadPersonas = async (brandId: string): Promise<Persona[]> => {
  console.log("loadPersonas called with brandId:", brandId);
  const cacheKey = `personas-${brandId}`;
  if (dataCache[cacheKey]) {
    console.log("Returning cached personas data");
    return dataCache[cacheKey];
  }
  
  console.log("Loading personas data from database");
  const data = await loadPersonasData(brandId);
  dataCache[cacheKey] = data;
  console.log("Personas data loaded and cached:", data);
  return data;
};

/**
 * Load media plan posts with pagination
 */
export const loadMediaPlanPosts = async (
  planId: string,
  page: number = 1,
  limit: number = 30
): Promise<{
  posts: MediaPlanPost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}> => {
  const cacheKey = `media-plan-posts-${planId}-${page}-${limit}`;
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  
  const data = await loadMediaPlanPostsWithPagination(planId, page, limit);
  dataCache[cacheKey] = data;
  return data;
};