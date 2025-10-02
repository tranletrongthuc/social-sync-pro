import type { GeneratedAssets, MediaPlanGroup, MediaPlan, MediaPlanPost, AffiliateLink, Persona, PostStatus, Trend, Idea, PostInfo, FacebookTrend, FacebookPostIdea, LogoConcept, MediaPlanWeek, Settings } from '../../types';

// Define initial settings directly in this file to avoid cross-module import issues.
const initialSettings: Settings = {
    language: "English",
    totalPostsPerMonth: 30,
    mediaPromptSuffix: "",
    affiliateContentKit: "",
    textGenerationModel: "gemini-1.5-pro-latest",
    imageGenerationModel: "dall-e-3",
    textModelFallbackOrder: [],
    visionModels: [],
    contentPillars: [],
    prompts: { rules: {} },
};

export type AssetsAction =
  | { type: 'INITIALIZE_ASSETS'; payload: GeneratedAssets | null }
  | { type: 'UPDATE_SETTINGS'; payload: Settings }
  | { type: 'UPDATE_BRAND_KIT'; payload: Omit<GeneratedAssets, 'affiliateLinks' | 'personas' | 'trends' | 'ideas' | 'facebookTrends' | 'facebookPostIdeas'> }
  | { type: 'ADD_MEDIA_PLAN'; payload: MediaPlanGroup }
  | { type: 'UPDATE_POST'; payload: { planId: string; weekIndex: number; postIndex: number; updates: Partial<MediaPlanPost> } }
  | { type: 'UPDATE_POST_CAROUSEL'; payload: { planId: string; weekIndex: number; postIndex: number; imageUrlsArray: string[]; imageKeys: string[] } }
  | { type: 'UPDATE_PLAN'; payload: { planId: string; plan: MediaPlan } }
  | { type: 'UPDATE_ASSET_IMAGE'; payload: { oldImageKey: string; newImageKey: string; postInfo?: PostInfo; carouselImageIndex?: number } }
  | { type: 'ADD_OR_UPDATE_AFFILIATE_LINKS'; payload: AffiliateLink[] }
  | { type: 'DELETE_AFFILIATE_LINK'; payload: string }
  | { type: 'IMPORT_AFFILIATE_LINKS'; payload: AffiliateLink[] }
  | { type: 'SET_AFFILIATE_LINKS'; payload: AffiliateLink[] }
  | { type: 'BULK_UPDATE_ASSET_IMAGES', payload: { postInfo: PostInfo, newImageKey: string }[] }
  | { type: 'BULK_SCHEDULE_POSTS', payload: { updates: { postId: string; scheduledAt: string; status: 'scheduled' }[] } }
  | { type: 'SAVE_PERSONA'; payload: Persona }
  | { type: 'DELETE_PERSONA'; payload: string }
  | { type: 'UPDATE_PERSONA'; payload: { id: string } & Partial<Persona> }
  | { type: 'UPDATE_PERSONA_ID'; payload: { oldId: string; newId: string } }
  | { type: 'SET_PERSONAS'; payload: Persona[] }
  | { type: 'SAVE_TREND'; payload: Trend }
  | { type: 'DELETE_TREND'; payload: string }
  | { type: 'ADD_IDEAS'; payload: Idea[] }
  | { type: 'SET_IDEAS'; payload: Idea[] }
  | { type: 'SET_STRATEGY_DATA'; payload: { trends: Trend[]; ideas: Idea[] } }
  | { type: 'ADD_CONTENT_PACKAGE'; payload: MediaPlanGroup }
  | { type: 'ASSIGN_PERSONA_TO_PLAN'; payload: { planId: string; personaId: string | null; } }
  | { type: 'SET_FACEBOOK_TRENDS'; payload: FacebookTrend[] }
  | { type: 'ADD_FACEBOOK_POST_IDEAS'; payload: FacebookPostIdea[] }
  | { type: 'SET_SELECTED_PLATFORMS'; payload: string[] };

export const initialGeneratedAssets: GeneratedAssets = {
    brandFoundation: {
        brandName: '',
        mission: '',
        usp: '',
        values: [],
        personality: '',
        targetAudience: ''
    },
    mediaPlans: [],
    personas: [],
    trends: [],
    ideas: [],
    affiliateLinks: [],
    coreMediaAssets: {
        logoConcepts: [],
        colorPalette: [],
        fontRecommendations: []
    },
    unifiedProfileAssets: {
        profilePictureImageKey: null,
        coverPhotoImageKey: null,
        accountName: '',
        username: '',
        profilePicturePrompt: '',
        profilePictureId: '',
        coverPhotoPrompt: '',
        coverPhotoId: ''
    },
    facebookPostIdeas: [],
    selectedPlatforms: [],
    settings: initialSettings, // Add settings to initial state
};

export const assetsReducer = (state: GeneratedAssets | null, action: AssetsAction): GeneratedAssets | null => {
    if (state === null) {
        if (action.type === 'INITIALIZE_ASSETS') {
            return action.payload;
        }
        return initialGeneratedAssets;
    }

    switch (action.type) {
        case 'INITIALIZE_ASSETS':
            return action.payload;

        case 'UPDATE_SETTINGS':
            return { ...state, settings: action.payload };

        case 'UPDATE_BRAND_KIT': {
            const newMediaPlans = [...state.mediaPlans, ...(action.payload.mediaPlans || [])];
            return {
                ...state,
                ...action.payload,
                mediaPlans: newMediaPlans,
            };
        }
        
        case 'ADD_MEDIA_PLAN': {
            return {
                ...state,
                mediaPlans: [...state.mediaPlans, action.payload]
            };
        }

        case 'UPDATE_POST': {
            const { planId, weekIndex, postIndex, updates } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));
            const planIndex = newState.mediaPlans.findIndex((p: MediaPlanGroup) => p.id === planId);
            
            if (planIndex !== -1) {
                const postToUpdate = newState.mediaPlans[planIndex].plan[weekIndex]?.posts[postIndex];
                if (postToUpdate) {
                    newState.mediaPlans[planIndex].plan[weekIndex].posts[postIndex] = { ...postToUpdate, ...updates };
                }
            }
            return newState;
        }

        case 'UPDATE_POST_CAROUSEL': {
            const { planId, weekIndex, postIndex, imageUrlsArray, imageKeys } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));
            const planIndex = newState.mediaPlans.findIndex((p: MediaPlanGroup) => p.id === planId);
            
            if (planIndex !== -1) {
                const postToUpdate = newState.mediaPlans[planIndex].plan[weekIndex]?.posts[postIndex];
                if (postToUpdate) {
                    postToUpdate.imageUrlsArray = imageUrlsArray;
                    postToUpdate.imageKeys = imageKeys;
                }
            }
            return newState;
        }
        
        case 'UPDATE_PLAN': {
            const { planId, plan } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));
            const planIndex = newState.mediaPlans.findIndex((p: MediaPlanGroup) => p.id === planId);
            
            if (planIndex !== -1) {
                newState.mediaPlans[planIndex].plan = plan;
            }
            return newState;
        }
        
        case 'UPDATE_ASSET_IMAGE': {
            const { oldImageKey, newImageKey, postInfo, carouselImageIndex } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));

            if (postInfo) {
                const plan = newState.mediaPlans.find((p: MediaPlanGroup) => p.id === postInfo.planId);
                if (plan) {
                    const post = plan.plan[postInfo.weekIndex]?.posts[postInfo.postIndex];
                    if (post?.id === postInfo.post.id) {
                        // If carouselImageIndex is a number, handle carousel logic
                        if (typeof carouselImageIndex === 'number') {
                            if (!post.imageKeys) {
                                post.imageKeys = [];
                            }
                            post.imageKeys[carouselImageIndex] = newImageKey;
                        } else {
                            // Otherwise, handle single image logic
                            post.imageKey = newImageKey;
                        }

                        if (!post.mediaOrder) post.mediaOrder = [];
                        if (!post.mediaOrder.includes('image')) post.mediaOrder.push('image');
                    }
                }
            } else if (oldImageKey?.startsWith('logo_')) {
                const logo = newState.coreMediaAssets.logoConcepts.find((l: LogoConcept) => l.imageKey === oldImageKey);
                if (logo) logo.imageKey = newImageKey;
            } else if (oldImageKey?.startsWith('profile_')) {
                if (newState.unifiedProfileAssets.profilePictureImageKey === oldImageKey) {
                    newState.unifiedProfileAssets.profilePictureImageKey = newImageKey;
                }
            } else if (oldImageKey?.startsWith('cover_')) {
                if (newState.unifiedProfileAssets.coverPhotoImageKey === oldImageKey) {
                    newState.unifiedProfileAssets.coverPhotoImageKey = newImageKey;
                }
            }
            return newState;
        }

        case 'ADD_OR_UPDATE_AFFILIATE_LINKS': {
            const newLinks = action.payload;
            if (!newLinks || newLinks.length === 0) return state;

            // Use a Map for efficient upserting
            const linksMap = new Map((state.affiliateLinks || []).map(link => [link.id, link]));
            newLinks.forEach(link => {
                linksMap.set(link.id, link);
            });

            const updatedLinks = Array.from(linksMap.values());

            return { ...state, affiliateLinks: updatedLinks };
        }
        
        case 'SET_AFFILIATE_LINKS': {
            return { ...state, affiliateLinks: action.payload };
        }

        case 'SET_PERSONAS': {
            // console.log('[assetsReducer] SET_PERSONAS action received with payload:', action.payload);
            const newState = { ...state, personas: action.payload };
            // console.log('[assetsReducer] New state after SET_PERSONAS:', newState);
            return newState;
        }

        case 'SET_STRATEGY_DATA': {
            return { ...state, trends: action.payload.trends, ideas: action.payload.ideas };
        }

        case 'BULK_UPDATE_ASSET_IMAGES': {
            const newState = JSON.parse(JSON.stringify(state));
            const updatesMap = new Map(action.payload.map(u => [u.postInfo.post.id, u.newImageKey]));
        
            newState.mediaPlans.forEach((plan: MediaPlanGroup) => {
                plan.plan.forEach((week: MediaPlanWeek) => {
                    week.posts.forEach((post: MediaPlanPost) => {
                        if (updatesMap.has(post.id)) {
                            post.imageKey = updatesMap.get(post.id)!;
                            if (!post.mediaOrder) post.mediaOrder = [];
                            if (!post.mediaOrder.includes('image')) {
                                (post.mediaOrder as ('image' | 'video')[]).push('image');
                            }
                        }
                    });
                });
            });
        
            return newState;
        }

        case 'BULK_SCHEDULE_POSTS': {
            const { updates } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));
            const updatesMap = new Map(updates.map(u => [u.postId, { scheduledAt: u.scheduledAt, status: u.status }]));
            
            newState.mediaPlans.forEach((plan: MediaPlanGroup) => {
                plan.plan.forEach((week: MediaPlanWeek) => {
                    week.posts.forEach((post: MediaPlanPost) => {
                        if (updatesMap.has(post.id)) {
                            const update = updatesMap.get(post.id)!;
                            post.scheduledAt = update.scheduledAt;
                            post.status = update.status;
                        }
                    });
                });
            });

            return newState;
        }

        case 'SAVE_PERSONA': {
            const newPersona = action.payload;
            const existingPersonas = state.personas || [];
            const index = existingPersonas.findIndex(p => p.id === newPersona.id);
            let updatedPersonas;

            if (index > -1) {
                updatedPersonas = [...existingPersonas];
                updatedPersonas[index] = newPersona;
            } else {
                updatedPersonas = [newPersona, ...existingPersonas];
            }
            return { ...state, personas: updatedPersonas };
        }

        case 'DELETE_PERSONA': {
            const personaId = action.payload;
            const updatedPersonas = (state.personas || []).filter(p => p.id !== personaId);
            return { ...state, personas: updatedPersonas };
        }

        case 'UPDATE_PERSONA': {
            const { id, ...updates } = action.payload;
            const updatedPersonas = (state.personas || []).map(p => 
                p.id === id ? { ...p, ...updates } : p
            );
            return { ...state, personas: updatedPersonas };
        }

        case 'UPDATE_PERSONA_ID': {
            const { oldId, newId } = action.payload;
            const existingPersonas = state.personas || [];
            const index = existingPersonas.findIndex(p => p.id === oldId);
            if (index === -1) return state;

            const updatedPersonas = [...existingPersonas];
            updatedPersonas[index] = { ...updatedPersonas[index], id: newId };
            
            return { ...state, personas: updatedPersonas };
        }

        case 'SAVE_TREND': {
            const newTrend = action.payload;
            const existingTrends = state.trends || [];
            const index = existingTrends.findIndex(t => t.id === newTrend.id);
            let updatedTrends;

            if (index > -1) {
                updatedTrends = [...existingTrends];
                updatedTrends[index] = newTrend;
            } else {
                updatedTrends = [newTrend, ...existingTrends];
            }
            return { ...state, trends: updatedTrends };
        }

        case 'DELETE_TREND': {
            const trendId = action.payload;
            const updatedTrends = (state.trends || []).filter(t => t.id !== trendId);
            return { ...state, trends: updatedTrends };
        }

        case 'ADD_IDEAS': {
            const newIdeas = action.payload;
            if (!newIdeas || newIdeas.length === 0) return state;

            const existingIdeas = state.ideas || [];
            // Create a map of the new ideas for efficient lookup
            const newIdeasMap = new Map(newIdeas.map((idea: Idea) => [idea.id, idea]));

            // Filter out any old versions of the ideas we are adding/updating
            const updatedIdeas = existingIdeas.filter((idea: Idea) => !newIdeasMap.has(idea.id));
            
            // Add the new/updated ideas to the list
            updatedIdeas.push(...newIdeas);

            return { ...state, ideas: updatedIdeas };
        }
        
        case 'ADD_CONTENT_PACKAGE': {
            return {
                ...state,
                mediaPlans: [...(state.mediaPlans || []), action.payload]
            };
        }

        case 'SET_SELECTED_PLATFORMS': {
            return { ...state, selectedPlatforms: action.payload };
        }

        case 'ASSIGN_PERSONA_TO_PLAN': {
            const { planId, personaId } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));
            const planIndex = newState.mediaPlans.findIndex((p: MediaPlanGroup) => p.id === planId);
            if (planIndex === -1) return state;

            const planToUpdate = newState.mediaPlans[planIndex];
            const oldPersonaId = planToUpdate.personaId;
            const allPersonas = newState.personas || [];
            
            const oldPersona = allPersonas.find((p: Persona) => p.id === oldPersonaId);
            const newPersona = allPersonas.find((p: Persona) => p.id === personaId);

            planToUpdate.personaId = personaId || undefined;

            planToUpdate.plan.forEach((week: MediaPlanWeek) => {
                week.posts.forEach((post: MediaPlanPost) => {
                    if (post.mediaPrompt) {
                        let prompt = Array.isArray(post.mediaPrompt) ? post.mediaPrompt[0] : post.mediaPrompt;
                        if (oldPersona && prompt.startsWith(`${oldPersona.outfitDescription}, `)) {
                            prompt = prompt.substring(`${oldPersona.outfitDescription}, `.length);
                        }
                        if (newPersona) {
                            prompt = `${newPersona.outfitDescription}, ${prompt}`;
                        }
                        post.mediaPrompt = prompt;
                    }
                });
            });

            return newState;
        }

        case 'SET_IDEAS': {
            return { ...state, ideas: action.payload };
        }

        case 'ADD_FACEBOOK_POST_IDEAS': {
            const newIdeas = action.payload;
            if (newIdeas.length === 0) return state;
            const existingIdeas = state.facebookPostIdeas || [];
            return { ...state, facebookPostIdeas: [...existingIdeas, ...newIdeas] };
        }

        default:
            return state;
    }
};
