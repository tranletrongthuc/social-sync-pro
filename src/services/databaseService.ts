import type { GeneratedAssets, Settings, MediaPlan, CoreMediaAssets, UnifiedProfileAssets, MediaPlanGroup, BrandFoundation, MediaPlanPost, AffiliateLink, Persona, PostStatus, Trend, Idea, ColorPalette, FontRecommendations, LogoConcept, PersonaPhoto, AIService } from '../../types';

// Cache for loaded data to prevent unnecessary reloads
const dataCache: Record<string, any> = {};

/**
 * Clear cache for a specific brand
 */
export const clearCacheForBrand = (brandId: string): void => {
  console.log("Clearing cache for brand:", brandId);
  Object.keys(dataCache).forEach(key => {
    if (key.includes(brandId)) {
      delete dataCache[key];
    }
  });
};

/**
 * Clear all cache
 */
export const clearAllCache = (): void => {
  console.log("Clearing all cache");
  Object.keys(dataCache).forEach(key => delete dataCache[key]);
};


/**
 * Fetch settings from MongoDB
 */
const fetchSettingsFromDatabase = async (brandId: string): Promise<Settings | null> => {
  try {
    const response = await fetch('/api/mongodb?action=fetch-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }

    const settings = await response.json();
    return settings;
  } catch (error) {
    console.error('Failed to fetch settings from database:', error);
    throw error;
  }
};

/**
 * Save settings to MongoDB
 */
const saveSettingsToDatabase = async (settings: Settings, brandId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Settings saved successfully:', result);
  } catch (error) {
    console.error('Failed to save settings to database:', error);
    throw error;
  }
};

/**
 * Fetch admin defaults from MongoDB
 */
const fetchAdminDefaultsFromDatabase = async (): Promise<Settings> => {
  try {
    const response = await fetch('/api/mongodb?action=fetch-admin-defaults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin defaults: ${response.statusText}`);
    }

    const settings = await response.json();
    return settings;
  } catch (error) {
    console.error('Failed to fetch admin defaults from database:', error);
    throw error;
  }
};

/**
 * Save admin defaults to MongoDB
 */
const saveAdminDefaultsToDatabase = async (settings: Settings): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-admin-defaults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to save admin defaults: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Admin defaults saved successfully:', result);
  } catch (error) {
    console.error('Failed to save admin defaults to database:', error);
    throw error;
  }
};

/**
 * Create or update a brand record in MongoDB
 */
const createOrUpdateBrandRecordInDatabase = async (
  assets: GeneratedAssets,
  imageUrls: Record<string, string>,
  brandId: string | null
): Promise<string> => {
  console.log("createOrUpdateBrandRecordInDatabase: Function started.");
  console.log("createOrUpdateBrandRecordInDatabase: assets (partial):", assets.brandFoundation.brandName, assets.mediaPlans.length);
  console.log("createOrUpdateBrandRecordInDatabase: imageUrls (keys):", Object.keys(imageUrls));
  console.log("createOrUpdateBrandRecordInDatabase: brandId:", brandId);

  // Prune assets to send only necessary data
  const prunedAssets = {
    brandFoundation: assets.brandFoundation,
    coreMediaAssets: {
      colorPalette: assets.coreMediaAssets?.colorPalette || [],
      fontRecommendations: assets.coreMediaAssets?.fontRecommendations || []
    },
    unifiedProfileAssets: assets.unifiedProfileAssets,
    // Only send basic info for mediaPlans, not the full plan content
    mediaPlans: assets.mediaPlans?.map(p => ({
      id: p.id,
      name: p.name,
      prompt: p.prompt,
      productImages: p.productImages // Assuming productImages are small and relevant
    })) || [],
    // Do not send affiliateLinks, personas, trends, ideas, facebookTrends, facebookPostIdeas
    // as they are loaded separately or not needed for brand record creation/update
  };

  try {
    console.log("createOrUpdateBrandRecordInDatabase: Making fetch call to /api/mongodb?action=create-or-update-brand");
    console.log("createOrUpdateBrandRecordInDatabase: Request body (pruned assets, imageUrls keys, brandId):");
    console.log(JSON.stringify({ assets: prunedAssets, imageUrls: Object.keys(imageUrls), brandId }, null, 2));

    const response = await fetch('/api/mongodb?action=create-or-update-brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assets: prunedAssets, imageUrls, brandId }),
    });
    console.log("createOrUpdateBrandRecordInDatabase: Fetch call completed. Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`createOrUpdateBrandRecordInDatabase: Fetch response not OK. Status: ${response.status}, Text: ${errorText}`);
      throw new Error(`Failed to create or update brand record: ${response.statusText}. Details: ${errorText}`);
    }

    const result = await response.json();
    console.log("createOrUpdateBrandRecordInDatabase: Fetch call successful. Result:", result);
    return result.brandId;
  } catch (error) {
    console.error('createOrUpdateBrandRecordInDatabase: Error caught:', error);
    throw error;
  }
};

/**
 * Load complete assets from MongoDB
 */
const loadCompleteAssetsFromDatabase = async (brandId: string): Promise<{
  assets: GeneratedAssets;
  generatedImages: Record<string, string>;
  generatedVideos: Record<string, string>;
  brandId: string;
}> => {
  console.log("DEBUG: Loading complete assets for brand ID:", brandId);
  
  try {
    const response = await fetch('/api/mongodb?action=initial-load', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to load complete assets: ${response.statusText}`);
    }

    const result = await response.json();
    
    const assets: GeneratedAssets = {
      brandFoundation: result.brandKitData.brandFoundation,
      coreMediaAssets: result.brandKitData.coreMediaAssets,
      unifiedProfileAssets: result.brandKitData.unifiedProfileAssets,
      mediaPlans: [], // Will be populated later
      affiliateLinks: [], // Will be populated later
      personas: [], // Will be populated later
      trends: [], // Will be populated later
      ideas: [], // Will be populated later
    };
    
    const generatedImages: Record<string, string> = {};
    const generatedVideos: Record<string, string> = {};
    
    return { assets, generatedImages, generatedVideos, brandId };
  } catch (error) {
    console.error("Failed to load complete assets from database:", error);
    throw error;
  }
};

/**
 * Sync asset media with MongoDB
 */
const syncAssetMediaWithDatabase = async (
  imageUrls: Record<string, string>,
  brandId: string,
  assets: GeneratedAssets
): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=sync-asset-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrls, brandId, assets }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync asset media: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Asset media synced successfully:', result);
  } catch (error) {
    console.error('Failed to sync asset media with database:', error);
    throw error;
  }
};

/**
 * Save affiliate links to MongoDB
 */
const saveAffiliateLinksToDatabase = async (links: AffiliateLink[], brandId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-affiliate-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ links, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save affiliate links: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Affiliate links saved successfully:', result);
  } catch (error) {
    console.error('Failed to save affiliate links to database:', error);
    throw error;
  }
};

/**
 * Fetch affiliate links for brand from MongoDB
 */
const fetchAffiliateLinksForBrandFromDatabase = async (brandId: string): Promise<AffiliateLink[]> => {
  try {
    const response = await fetch('/api/mongodb?action=fetch-affiliate-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch affiliate links: ${response.statusText}`);
    }

    const result = await response.json();
    return result.affiliateLinks;
  } catch (error) {
    console.error('Failed to fetch affiliate links from database:', error);
    throw error;
  }
};

/**
 * Delete affiliate link from MongoDB
 */
const deleteAffiliateLinkFromDatabase = async (linkId: string, brandId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=delete-affiliate-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ linkId, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete affiliate link: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Affiliate link deleted successfully:', result);
  } catch (error) {
    console.error('Failed to delete affiliate link from database:', error);
    throw error;
  }
};

/**
 * Save persona to MongoDB
 */
const savePersonaToDatabase = async (persona: Persona, brandId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-persona', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ persona, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save persona: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Persona saved successfully:', result);
  } catch (error) {
    console.error('Failed to save persona to database:', error);
    throw error;
  }
};

/**
 * Delete persona from MongoDB
 */
const deletePersonaFromDatabase = async (personaId: string, brandId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=delete-persona', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ personaId, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete persona: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Persona deleted successfully:', result);
  } catch (error) {
    console.error('Failed to delete persona from database:', error);
    throw error;
  }
};

/**
 * Assign persona to plan in MongoDB
 */
const assignPersonaToPlanInDatabase = async (
  planId: string,
  personaId: string | null,
  updatedPosts: MediaPlanPost[],
  brandId: string
): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=assign-persona-to-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId, personaId, updatedPosts, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign persona to plan: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Persona assigned to plan successfully:', result);
  } catch (error) {
    console.error('Failed to assign persona to plan in database:', error);
    throw error;
  }
};

/**
 * Update media plan post in MongoDB
 */
const updateMediaPlanPostInDatabase = async (
  post: MediaPlanPost,
  brandId: string,
  imageUrl?: string,
  videoUrl?: string
): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=update-media-plan-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post, brandId, imageUrl, videoUrl }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update media plan post: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Media plan post updated successfully:', result);
  } catch (error) {
    console.error('Failed to update media plan post in database:', error);
    throw error;
  }
};

/**
 * Save media plan group to MongoDB
 */
const saveMediaPlanGroupToDatabase = async (
  group: MediaPlanGroup,
  imageUrls: Record<string, string>,
  brandId: string
): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-media-plan-group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ group, imageUrls, brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save media plan group: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Media plan group saved successfully:', result);
  } catch (error) {
    console.error('Failed to save media plan group to database:', error);
    throw error;
  }
};

/**
 * Save trend to MongoDB
 */
const saveTrendToDatabase = async (trend: Omit<Trend, 'id'> & { id?: string }, brandId: string): Promise<string> => {
  console.log("saveTrend called with trend:", trend, "brandId:", brandId);
  
  try {
    const response = await fetch('/api/mongodb?action=save-trend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trend, brandId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to save trend. Status:", response.status, "Text:", errorText);
      throw new Error(`Failed to save trend: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Trend saved successfully with ID:", data.trendId);
    
    // Clear cache for this brand's strategy hub data
    clearCacheForBrand(brandId);
    
    return data.trendId;
  } catch (error) {
    console.error("Error saving trend:", error);
    throw error;
  }
};

/**
 * Delete trend from MongoDB
 */
const deleteTrendFromDatabase = async (trendId: string, brandId: string): Promise<void> => {
  console.log("deleteTrend called with trendId:", trendId, "brandId:", brandId);
  
  try {
    const response = await fetch('/api/mongodb?action=delete-trend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trendId, brandId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to delete trend. Status:", response.status, "Text:", errorText);
      throw new Error(`Failed to delete trend: ${response.statusText}`);
    }

    console.log("Trend deleted successfully");
    
    // Clear cache for this brand's strategy hub data
    clearCacheForBrand(brandId);
  } catch (error) {
    console.error("Error deleting trend:", error);
    throw error;
  }
};

/**
 * Save ideas to MongoDB
 */
const saveIdeasToDatabase = async (ideas: Idea[]): Promise<void> => {
  console.log("saveIdeas called with ideas:", ideas);
  
  try {
    const response = await fetch('/api/mongodb?action=save-ideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ideas }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to save ideas. Status:", response.status, "Text:", errorText);
      throw new Error(`Failed to save ideas: ${response.statusText}`);
    }

    console.log("Ideas saved successfully");
    
    // Clear cache for the brand associated with these ideas
    if (ideas.length > 0) {
      const brandId = ideas[0].id.split('-')[0]; // Extract brandId from the first idea's ID
      clearCacheForBrand(brandId);
    }
  } catch (error) {
    console.error("Error saving ideas:", error);
    throw error;
  }
};

/**
 * Save AI service to MongoDB
 */
const saveAIServiceToDatabase = async (service: { id: string; name: string; description: string }): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-ai-service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save AI service: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('AI service saved successfully:', result);
  } catch (error) {
    console.error('Failed to save AI service to database:', error);
    throw error;
  }
};

/**
 * Delete AI service from MongoDB
 */
const deleteAIServiceFromDatabase = async (serviceId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=delete-ai-service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serviceId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete AI service: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('AI service deleted successfully:', result);
  } catch (error) {
    console.error('Failed to delete AI service from database:', error);
    throw error;
  }
};

/**
 * Save AI model to MongoDB
 */
const saveAIModelToDatabase = async (model: { id: string; name: string; provider: string; capabilities: string[] }, serviceId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=save-ai-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, serviceId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save AI model: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('AI model saved successfully:', result);
  } catch (error) {
    console.error('Failed to save AI model to database:', error);
    throw error;
  }
};

/**
 * Delete AI model from MongoDB
 */
const deleteAIModelFromDatabase = async (modelId: string): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=delete-ai-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete AI model: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('AI model deleted successfully:', result);
  } catch (error) {
    console.error('Failed to delete AI model from database:', error);
    throw error;
  }
};

/**
 * Load AI services from MongoDB
 */
const loadAIServicesFromDatabase = async (): Promise<AIService[]> => {
  try {
    const response = await fetch('/api/mongodb?action=load-ai-services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Failed to load AI services: ${response.statusText}`);
    }

    const result = await response.json();
    return result.services;
  } catch (error) {
    console.error('Failed to load AI services from database:', error);
    throw error;
  }
};

/**
 * List media plan groups for brand from MongoDB
 */
const listMediaPlanGroupsForBrandFromDatabase = async (brandId: string): Promise<{
  id: string;
  name: string;
  prompt: string;
  source?: MediaPlanGroup['source'];
  productImages?: 
  { 
    name: string; 
    type: string; 
    data: string }[]; 
    personaId?: string;
  }[]> => {
  try {
    const response = await fetch('/api/mongodb?action=list-media-plan-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to list media plan groups: ${response.statusText}`);
    }

    const result = await response.json();
    return result.groups;
  } catch (error) {
    console.error('Failed to list media plan groups from database:', error);
    throw error;
  }
};

/**
 * Load media plan from MongoDB
 */
const loadMediaPlanFromDatabase = async (planId: string): Promise<{
  plan: MediaPlan;
  imageUrls: Record<string, string>;
  videoUrls: Record<string, string>;
}> => {
  try {
    const response = await fetch('/api/mongodb?action=load-media-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to load media plan: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to load media plan from database:', error);
    throw error;
  }
};

/**
 * Bulk patch posts in MongoDB
 */
const bulkPatchPostsInDatabase = async (updates: { postId: string; fields: Record<string, any> }[]): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=bulk-patch-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk patch posts: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Posts bulk patched successfully:', result);
  } catch (error) {
    console.error('Failed to bulk patch posts in database:', error);
    throw error;
  }
};

/**
 * Bulk update post schedules in MongoDB
 */
const bulkUpdatePostSchedulesInDatabase = async (updates: { postId: string; scheduledAt: string; status: 'scheduled' }[]): Promise<void> => {
  try {
    const response = await fetch('/api/mongodb?action=bulk-update-post-schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk update post schedules: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Post schedules bulk updated successfully:', result);
  } catch (error) {
    console.error('Failed to bulk update post schedules in database:', error);
    throw error;
  }
};

/**
 * List brands from MongoDB
 */
const listBrandsFromDatabase = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const response = await fetch('/api/mongodb?action=list-brands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Failed to list brands: ${response.statusText}`);
    }

    const result = await response.json();
    return result.brands;
  } catch (error) {
    console.error('Failed to list brands from database:', error);
    throw error;
  }
};

/**
 * Check database credentials
 */
const checkDatabaseCredentials = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/mongodb?action=check-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      console.error(`Failed to check database credentials: ${response.statusText}`);
      return false;
    }

    const result = await response.json();
    console.log('Database credentials verified:', result);
    return true;
  } catch (error) {
    console.error('Failed to check database credentials:', error);
    return false;
  }
};

/**
 * Load a complete project from MongoDB
 */
const loadProjectFromDatabase = async (brandId: string): Promise<{
  assets: GeneratedAssets;
  generatedImages: Record<string, string>;
  generatedVideos: Record<string, string>;
  brandId: string;
}> => {
  try {
    console.log(`Loading complete project for brand ID: ${brandId}`);
    
    // Make an API call to load the complete project
    const response = await fetch('/api/mongodb?action=load-complete-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to load complete project: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Loaded complete project for brand ID: ${brandId}`);
    return result;
  } catch (error) {
    console.error('Failed to load complete project from database:', error);
    throw error;
  }
};

/**
 * Check if a product exists in the database by its ID
 */
const checkIfProductExistsInDatabase = async (productId: string): Promise<boolean> => {
  try {
    // This would typically make an API call to check if a product exists
    // For now, we'll implement a simple version that returns true
    // In a full implementation, this would check the database
    console.log(`Checking if product exists in database: ${productId}`);
    
    // Make an API call to check if the product exists
    const response = await fetch('/api/mongodb?action=check-product-exists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      console.error(`Failed to check if product exists: ${response.statusText}`);
      return false;
    }

    const result = await response.json();
    return result.exists || false;
  } catch (error) {
    console.error('Failed to check if product exists in database:', error);
    return false;
  }
};

/**
 * Load ideas for a specific trend
 */
const loadIdeasForTrend = async (trendId: string, brandId: string): Promise<Idea[]> => {
  console.log("loadIdeasForTrend called with trendId:", trendId, "brandId:", brandId);
  
  const cacheKey = `ideas-${trendId}-${brandId}`;
  if (dataCache[cacheKey]) {
    console.log("Returning cached ideas data");
    return dataCache[cacheKey];
  }
  
  try {
    const response = await fetch('/api/mongodb?action=load-ideas-for-trend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trendId, brandId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to load ideas for trend. Status:", response.status, "Text:", errorText);
      throw new Error(`Failed to load ideas for trend: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Ideas data received from API:", data);
    
    // Cache the data
    dataCache[cacheKey] = data.ideas;
    return data.ideas;
  } catch (error) {
    console.error("Error loading ideas for trend:", error);
    throw error;
  }
};


// --- NEW FUNCTIONS FOR OPTIMIZED LOADING ---

/**
 * Load initial project data for fast rendering of the BrandKitView
 */
const loadInitialProjectData = async (brandId: string): Promise<{
  brandSummary: { id: string; name: string; logoUrl?: string };
  brandKitData: {
    brandFoundation: BrandFoundation;
    coreMediaAssets: CoreMediaAssets;
    unifiedProfileAssets: UnifiedProfileAssets;
  };
}> => {
  const response = await fetch('/api/mongodb?action=initial-load', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ brandId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to load initial project data: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Load media plan groups list for the MediaPlanView
 */
const loadMediaPlanGroupsList = async (brandId: string): Promise<{
  id: string;
  name: string;
  prompt: string;
  source?: MediaPlanGroup['source'];
  productImages?: { name: string; type: string; data: string }[];
  personaId?: string;
}[]> => {
  const response = await fetch('/api/mongodb?action=list-media-plan-groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ brandId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to load media plan groups: ${response.statusText}`);
  }

  const { groups } = await response.json();
  return groups;
};

/**
 * Load strategy hub data (trends and ideas)
 */
const loadStrategyHubData = async (brandId: string): Promise<{
  trends: Trend[];
  ideas: Idea[];
}> => {
  console.log("loadStrategyHubData called with brandId:", brandId);
  const response = await fetch('/api/mongodb?action=strategy-hub', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',},
    body: JSON.stringify({ brandId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to load strategy hub data. Status:", response.status, "Text:", errorText);
    throw new Error(`Failed to load strategy hub data: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Strategy hub data received from API:", data);
  return data;
};

/**
 * Load affiliate vault data
 */
const loadAffiliateVaultData = async (brandId: string): Promise<AffiliateLink[]> => {
  console.log("loadAffiliateVaultData called with brandId:", brandId);
  const response = await fetch('/api/mongodb?action=affiliate-vault', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ brandId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to load affiliate vault data. Status:", response.status, "Text:", errorText);
    throw new Error(`Failed to load affiliate vault data: ${response.statusText}`);
  }

  const { affiliateLinks } = await response.json();
  console.log("Affiliate vault data received from API:", affiliateLinks);
  return affiliateLinks;
};

/**
 * Load personas data
 */
const loadPersonasData = async (brandId: string): Promise<Persona[]> => {
  console.log("loadPersonasData called with brandId:", brandId);
  const response = await fetch('/api/mongodb?action=personas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ brandId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to load personas data. Status:", response.status, "Text:", errorText);
    throw new Error(`Failed to load personas data: ${response.statusText}`);
  }

  const { personas } = await response.json();
  console.log("Personas data received from API:", personas);
  return personas;
};

/**
 * Load media plan posts with pagination
 * Note: This implementation is for MongoDB.
 * this should be updated to use proper database pagination for better performance.
 * @param planId - The ID of the media plan to load posts for
 * @param page - The page number to load (1-indexed)
 * @param limit - The number of posts per page
 */
const loadMediaPlanPostsWithPagination = async (
  planId: string,
  page: number = 1,
  limit: number = 30
) => {
  // This is a placeholder implementation
  // In a real implementation, this would fetch posts from MongoDB with pagination
  console.log(`Loading posts for plan ${planId}, page: ${page}, limit: ${limit}`);
  return { posts: [], total: 0 };
};

/**
 * Load a specific trend from MongoDB
 * @param trendId - The ID of the trend to load
 * @param brandId - The ID of the brand the trend belongs to
 */
export const loadTrend = async (trendId: string, brandId: string): Promise<Trend | null> => {
  console.log("loadTrend called with trendId:", trendId, "brandId:", brandId);
  
  const cacheKey = `trend-${trendId}-${brandId}`;
  if (dataCache[cacheKey]) {
    console.log("Returning cached trend data");
    return dataCache[cacheKey];
  }
  
  try {
    const response = await fetch('/api/mongodb?action=load-trend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trendId, brandId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to load trend. Status:", response.status, "Text:", errorText);
      throw new Error(`Failed to load trend: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Trend data received from API:", data);
    
    // Cache the data
    dataCache[cacheKey] = data.trend;
    return data.trend;
  } catch (error) {
    console.error("Error loading trend:", error);
    throw error;
  }
};


// Export all functions with MongoDB-specific names
export {
  fetchSettingsFromDatabase as fetchSettings,
  saveSettingsToDatabase as saveSettings,
  fetchAdminDefaultsFromDatabase as fetchAdminDefaults,
  saveAdminDefaultsToDatabase as saveAdminDefaults,
  createOrUpdateBrandRecordInDatabase as createOrUpdateBrandRecord,
  loadCompleteAssetsFromDatabase as loadCompleteAssets,
  syncAssetMediaWithDatabase as syncAssetMedia,
  saveAffiliateLinksToDatabase as saveAffiliateLinks,
  fetchAffiliateLinksForBrandFromDatabase as fetchAffiliateLinksForBrand,
  deleteAffiliateLinkFromDatabase as deleteAffiliateLink,
  savePersonaToDatabase as savePersona,
  deletePersonaFromDatabase,
  assignPersonaToPlanInDatabase,
  updateMediaPlanPostInDatabase,
  saveMediaPlanGroupToDatabase as saveMediaPlanGroup,
  saveTrendToDatabase as saveTrend,
  deleteTrendFromDatabase,
  saveIdeasToDatabase as saveIdeas,
  saveAIServiceToDatabase as saveAIService,
  deleteAIServiceFromDatabase as deleteAIService,
  saveAIModelToDatabase as saveAIModel,
  deleteAIModelFromDatabase as deleteAIModel,
  loadAIServicesFromDatabase as loadAIServices,
  listMediaPlanGroupsForBrandFromDatabase as listMediaPlanGroupsForBrand,
  loadMediaPlanFromDatabase as loadMediaPlan,
  bulkPatchPostsInDatabase as bulkPatchPosts,
  bulkUpdatePostSchedulesInDatabase as bulkUpdatePostSchedules,
  listBrandsFromDatabase,
  checkDatabaseCredentials,
  loadProjectFromDatabase,
  checkIfProductExistsInDatabase,
  loadIdeasForTrend,
  loadInitialProjectData,
  loadMediaPlanGroupsList,
  loadStrategyHubData,
  loadAffiliateVaultData,
  loadPersonasData,
  loadMediaPlanPostsWithPagination,
};