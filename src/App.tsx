import React, { useState, useCallback, useEffect, useRef, useReducer, Suspense, lazy } from 'react';
import saveAs from 'file-saver';
import { isAdminAuthenticated as checkAdminAuthenticated, authenticateAdmin, logoutAdmin } from './services/adminAuthService';

// Lazy load components
const IdeaProfiler = lazy(() => import('./components/IdeaProfiler'));
const BrandProfiler = lazy(() => import('./components/BrandProfiler'));
const MainDisplay = lazy(() => import('./components/MainDisplay'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));

const AutoPersonaResultModal = lazy(() => import('./components/AutoPersonaResultModal'));

import { ActiveTab } from './components/Header';
import Loader from './components/Loader';
import Toast from './components/Toast';
import { generateImage, autoGeneratePersonaProfile, generateImageWithBanana } from './services/geminiService';
import { createDocxBlob, createMediaPlanXlsxBlob } from './services/exportService';
import { suggestProductsForPost } from './services/khongminhService';
import { generateImageWithOpenRouter } from './services/openrouterService';
import { textGenerationService } from './services/textGenerationService';
import { generateImageWithCloudflare } from './services/cloudflareService';
import {
    createOrUpdateBrandRecordInDatabase as createOrUpdateBrandRecord,
    saveAffiliateLinksToDatabase as saveAffiliateLinks,
    deleteAffiliateLinkFromDatabase,
    saveMediaPlanGroupToDatabase as saveMediaPlanGroup,
    updateMediaPlanPostInDatabase,
    bulkUpdatePostSchedulesInDatabase as bulkUpdatePostSchedules,
    loadProjectFromDatabase,
    listMediaPlanGroupsForBrandFromDatabase,
    loadMediaPlanFromDatabase as loadMediaPlan,
    syncAssetMediaWithDatabase as syncAssetMedia,
    savePersonaToDatabase as savePersona,
    deletePersonaFromDatabase,
    saveTrendToDatabase as saveTrend,
    deleteTrendFromDatabase,
    saveIdeasToDatabase,
    assignPersonaToPlanInDatabase,
    initializeApp, // Use the new initializer
    fetchAffiliateLinksForBrandFromDatabase as fetchAffiliateLinksForBrand,
    loadIdeasForTrend,
    checkIfProductExistsInDatabase,
    saveSettingsToDatabase as saveSettings,
    saveAdminDefaultsToDatabase
} from './services/databaseService';

// Lazy loading functions
import {
    loadStrategyHub,
    loadAffiliateVault,
    loadPersonas,
    loadMediaPlanGroups,
    loadInitialData,
} from './services/lazyLoadService';
import { uploadMediaToCloudinary } from './services/cloudinaryService';


import type { BrandInfo, GeneratedAssets, Settings, MediaPlanGroup, MediaPlan, MediaPlanPost, AffiliateLink, SchedulingPost, MediaPlanWeek, LogoConcept, Persona, PostStatus, Trend, Idea, PostInfo, FacebookTrend, FacebookPostIdea } from '../types';
import { Button } from './components/ui';
import { configService, AiModelConfig } from './services/configService';

const isVisionModel = (modelName: string): boolean => {
    // Cloudflare and OpenRouter models in this app are currently text-to-image or have different input methods
    // that are handled by their respective service files. This check is primarily for Gemini/Google models.
    // If future vision models are added from other providers, they should be included here.
    return configService.getAiModelConfig().visionModels.includes(modelName);
};

// --- STATE MANAGEMENT REFACTOR (useReducer) ---

type AssetsAction =
  | { type: 'INITIALIZE_ASSETS'; payload: GeneratedAssets }
  | { type: 'ADD_MEDIA_PLAN'; payload: MediaPlanGroup }
  | { type: 'UPDATE_POST'; payload: { planId: string; weekIndex: number; postIndex: number; updates: Partial<MediaPlanPost> } }
  | { type: 'UPDATE_PLAN'; payload: { planId: string; plan: MediaPlan } }
  | { type: 'UPDATE_ASSET_IMAGE'; payload: { oldImageKey: string; newImageKey: string; postInfo?: PostInfo } }
  | { type: 'ADD_OR_UPDATE_AFFILIATE_LINK'; payload: AffiliateLink }
  | { type: 'DELETE_AFFILIATE_LINK'; payload: string }
  | { type: 'IMPORT_AFFILIATE_LINKS'; payload: AffiliateLink[] }
  | { type: 'SET_AFFILIATE_LINKS'; payload: AffiliateLink[] }
  | { type: 'BULK_UPDATE_ASSET_IMAGES', payload: { postInfo: PostInfo, newImageKey: string }[] }
  | { type: 'BULK_SCHEDULE_POSTS', payload: { updates: { postId: string; scheduledAt: string; status: 'scheduled' }[] } }
  | { type: 'SAVE_PERSONA'; payload: Persona }
  | { type: 'DELETE_PERSONA'; payload: string }
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

export const assetsReducer = (state: GeneratedAssets | null, action: AssetsAction): GeneratedAssets | null => {
    switch (action.type) {
        case 'INITIALIZE_ASSETS':
            return action.payload;
        
        case 'ADD_MEDIA_PLAN': {
            if (!state) return state;
            return {
                ...state,
                mediaPlans: [...state.mediaPlans, action.payload]
            };
        }

        case 'UPDATE_POST': {
            if (!state) return state;
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
        
        case 'UPDATE_PLAN': {
            if (!state) return state;
            const { planId, plan } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));
            const planIndex = newState.mediaPlans.findIndex((p: MediaPlanGroup) => p.id === planId);
            
            if (planIndex !== -1) {
                newState.mediaPlans[planIndex].plan = plan;
            }
            return newState;
        }
        
        case 'UPDATE_ASSET_IMAGE': {
            if (!state) return state;
            const { oldImageKey, newImageKey, postInfo } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));

            if (postInfo) {
                const plan = newState.mediaPlans.find((p: MediaPlanGroup) => p.id === postInfo.planId);
                if (plan) {
                    const post = plan.plan[postInfo.weekIndex]?.posts[postInfo.postIndex];
                    if (post?.id === postInfo.post.id) {
                        post.imageKey = newImageKey;
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

        case 'ADD_OR_UPDATE_AFFILIATE_LINK': {
            if (!state) return state;
            const newLink = action.payload;
            const existingLinks = state.affiliateLinks || [];
            const index = existingLinks.findIndex(l => l.id === newLink.id);
            let updatedLinks;

            if (index > -1) {
                updatedLinks = [...existingLinks];
                updatedLinks[index] = newLink;
            } else {
                updatedLinks = [newLink, ...existingLinks];
            }
            return { ...state, affiliateLinks: updatedLinks };
        }

        case 'DELETE_AFFILIATE_LINK': {
             if (!state) return state;
             const linkId = action.payload;
             const updatedLinks = (state.affiliateLinks || []).filter(l => l.id !== linkId);
             return { ...state, affiliateLinks: updatedLinks };
        }

        case 'IMPORT_AFFILIATE_LINKS': {
            if (!state) return state;
            return { ...state, affiliateLinks: [...(state.affiliateLinks || []), ...action.payload] };
        }
        
        case 'SET_AFFILIATE_LINKS': {
            if (!state) return state;
            return { ...state, affiliateLinks: action.payload };
        }

        case 'SET_PERSONAS': {
            if (!state) return state;
            return { ...state, personas: action.payload };
        }

        case 'SET_STRATEGY_DATA': {
            if (!state) return state;
            return { ...state, trends: action.payload.trends, ideas: action.payload.ideas };
        }

        case 'BULK_UPDATE_ASSET_IMAGES': {
            if (!state) return state;
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
            if (!state) return state;
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
            if (!state) return state;
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
            if (!state) return state;
            const personaId = action.payload;
            const updatedPersonas = (state.personas || []).filter(p => p.id !== personaId);
            return { ...state, personas: updatedPersonas };
        }

        case 'UPDATE_PERSONA_ID': {
            if (!state) return state;
            const { oldId, newId } = action.payload;
            const existingPersonas = state.personas || [];
            const index = existingPersonas.findIndex(p => p.id === oldId);
            if (index === -1) return state; // Not found, do nothing

            const updatedPersonas = [...existingPersonas];
            updatedPersonas[index] = { ...updatedPersonas[index], id: newId };
            
            return { ...state, personas: updatedPersonas };
        }

        case 'SAVE_TREND': {
            if (!state) return state;
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
            if (!state) return state;
            const trendId = action.payload;
            const updatedTrends = (state.trends || []).filter(t => t.id !== trendId);
            return { ...state, trends: updatedTrends };
        }

        case 'ADD_IDEAS': {
            console.log("ADD_IDEAS reducer called with:", action.payload);
            if (!state) return state;
            const newIdeas = action.payload;
            if (newIdeas.length === 0) return state;
            const trendId = newIdeas[0].trendId;
            const existingIdeas = state.ideas || [];
            // Filter out any old ideas for this trend before adding new ones
            const otherIdeas = existingIdeas.filter(i => i.trendId !== trendId);
            return { ...state, ideas: [...otherIdeas, ...newIdeas] };
        }
        
        case 'ADD_CONTENT_PACKAGE': {
            if (!state) return state;
            // Content packages are now just MediaPlanGroups with a specific source
            return {
                ...state,
                mediaPlans: [...(state.mediaPlans || []), action.payload]
            };
        }

        case 'SET_SELECTED_PLATFORMS': {
            if (!state) return state;
            return { ...state, selectedPlatforms: action.payload };
        }

        case 'ASSIGN_PERSONA_TO_PLAN': {
            if (!state) return state;
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

            // Update image prompts for all posts in the plan
            planToUpdate.plan.forEach((week: MediaPlanWeek) => {
                week.posts.forEach((post: MediaPlanPost) => {
                    if (post.mediaPrompt) {
                        let prompt = Array.isArray(post.mediaPrompt) ? post.mediaPrompt[0] : post.mediaPrompt;
                        // 1. Remove old prefix if it exists
                        if (oldPersona && prompt.startsWith(`${oldPersona.outfitDescription}, `)) {
                            prompt = prompt.substring(`${oldPersona.outfitDescription}, `.length);
                        }
                        // 2. Add new prefix if a new persona is assigned
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
            if (!state) return state;
            console.log("DEBUG: SET_IDEAS called with:", action.payload);
            return { ...state, ideas: action.payload };
        }

        case 'ADD_FACEBOOK_POST_IDEAS': {
            if (!state) return state;
            const newIdeas = action.payload;
            if (newIdeas.length === 0) return state;
            const existingIdeas = state.facebookPostIdeas || [];
            return { ...state, facebookPostIdeas: [...existingIdeas, ...newIdeas] };
        }

        default:
            return state;
    }
};

// Helper functions for file serialization

const base64ToFile = (base64Data: string, filename: string, mimeType: string): File => {
    if (!base64Data || typeof base64Data !== 'string') {
        console.error('Invalid base64 data provided to base64ToFile:', filename);
        return new File([], filename, { type: mimeType });
    }
    const parts = base64Data.split(',');
    // Added a check to ensure the data URL is valid before processing.
    if (parts.length < 2 || !parts[1]) {
      console.error('Invalid data URL format in project file:', filename);
      // Return an empty file to prevent a crash on corrupted data.
      return new File([], filename, { type: mimeType });
    }
    // Clean the base64 part by removing any whitespace.
    const cleanedBase64 = parts[1].replace(/\s/g, '');
    const byteString = atob(cleanedBase64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
};

const initialGeneratedAssets: GeneratedAssets = {
    mediaPlans: [],
    personas: [],
    trends: [],
    ideas: [],
    affiliateLinks: [],
    coreMediaAssets: {
        logoConcepts: [],
    },
    unifiedProfileAssets: {
        profilePictureImageKey: null,
        coverPhotoImageKey: null,
    },
    facebookPostIdeas: [],
    selectedPlatforms: []
};

const App: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<'idea' | 'profile' | 'assets'>('idea');
    const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
    const [generatedAssets, dispatchAssets] = useReducer(assetsReducer, null);
    const [loaderContent, setLoaderContent] = useState<{ title: string; steps: string[]; } | null>(null);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [waitMessage, setWaitMessage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
    const [generatedVideos, setGeneratedVideos] = useState<Record<string, string>>({});
    const [generatingImageKeys, setGeneratingImageKeys] = useState<Set<string>>(new Set());
    const [uploadingImageKeys, setUploadingImageKeys] = useState<Set<string>>(new Set());
    const [generatingPromptKeys, setGeneratingPromptKeys] = useState<Set<string>>(new Set());
    const [analyzingPostIds, setAnalyzingPostIds] = useState<Set<string>>(new Set());
    const [khongMinhSuggestions, setKhongMinhSuggestions] = useState<Record<string, AffiliateLink[]>>({});
    const [generatingCommentPostIds, setGeneratingCommentPostIds] = useState<Set<string>>(new Set());
    // Global product images removed, now managed per-plan.
    
    const [settings, setSettings] = useState<Settings>({
        language: 'English',
        totalPostsPerMonth: 30,
        mediaPromptSuffix: '',
        affiliateContentKit: '',
        textGenerationModel: 'gemini-2.5-pro',
        imageGenerationModel: '@cf/stabilityai/stable-diffusion-xl-base-1.0'
    });
    const [adminSettings, setAdminSettings] = useState<Settings | null>(null);
    const [aiModelConfig, setAiModelConfig] = useState<AiModelConfig | null>(null);
    
    // Admin authentication state with persistence
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return checkAdminAuthenticated(); // This is calling the renamed function from adminAuthService
  });
  const [adminPassword, setAdminPassword] = useState<string>('');
  
  // Admin logout function
  const handleAdminLogout = useCallback(() => {
    logoutAdmin();
    setIsAdminAuthenticated(false);
  }, []);
  
  // Periodic check for admin authentication expiration
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    
    const interval = setInterval(() => {
      // Check if admin is still authenticated
      if (!checkAdminAuthenticated()) {
        setIsAdminAuthenticated(false);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [isAdminAuthenticated]);
    
    // Integration States
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
    
    const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
    const [mongoBrandId, setMongoBrandId] = useState<string | null>(null);
    const [integrationsVersion, setIntegrationsVersion] = useState(0);

    // Auto-Save State
    const autoSaveTimeoutRef = useRef<number | null>(null);

    // Ref to store the product trend ID to select in StrategyDisplay
    
    // State to track the product trend to select (for passing to MainDisplay)
    const [productTrendToSelect, setProductTrendToSelect] = useState<string | null>(null);

    

    // Lazy loading callbacks for MainDisplay component
    const handleLoadStrategyHubData = useCallback(async () => {
        console.log("handleLoadStrategyHubData called");
        if (!mongoBrandId) {
            console.log("No MongoDB brand ID, skipping strategy hub data load");
            return;
        }
        
        try {
            const { trends, ideas } = await loadStrategyHub(mongoBrandId);
            console.log("Strategy hub data loaded:", { trends, ideas });
            dispatchAssets({ type: 'SET_STRATEGY_DATA', payload: { trends, ideas } });
        } catch (error) {
            console.error("Failed to load strategy hub data:", error);
            setError(error instanceof Error ? error.message : "Could not load strategy hub data.");
            throw error;
        }
    }, [mongoBrandId, dispatchAssets, setError]);

    const handleLoadAffiliateVaultData = useCallback(async () => {
        console.log("handleLoadAffiliateVaultData called");
        if (!mongoBrandId) {
            console.log("No MongoDB brand ID, skipping affiliate vault data load");
            return;
        }
        
        try {
            const affiliateLinks = await loadAffiliateVault(mongoBrandId);
            dispatchAssets({ type: 'SET_AFFILIATE_LINKS', payload: affiliateLinks });
        } catch (error) {
            console.error("Failed to load affiliate vault data:", error);
            setError(error instanceof Error ? error.message : "Could not load affiliate vault data.");
            throw error;
        }
    }, [mongoBrandId, dispatchAssets, setError]);

    const handleLoadPersonasData = useCallback(async () => {
        console.log("handleLoadPersonasData called");
        if (!mongoBrandId) {
            console.log("No MongoDB brand ID, skipping personas data load");
            return;
        }
        
        try {
            const personas = await loadPersonas(mongoBrandId);
            console.log("Personas data loaded:", personas);
            dispatchAssets({ type: 'SET_PERSONAS', payload: personas });
        } catch (error) {
            console.error("Failed to load personas data:", error);
            setError(error instanceof Error ? error.message : "Could not load personas data.");
            throw error;
        }
    }, [mongoBrandId, dispatchAssets, setError]);

    

    // Media Plan On-Demand Loading State
    const [mediaPlanGroupsList, setMediaPlanGroupsList] = useState<{id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[]}[]>([]);
    const [activePlanId, setActivePlanId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('brandKit');
    
    // Add debug log for tab changes
    const setActiveTabWithLog = (tab: ActiveTab) => {
        console.log("Setting active tab to:", tab);
        setActiveTab(tab);
    };
    
    // Reset productTrendToSelect when we switch away from the strategy tab
    useEffect(() => {
        if (activeTab !== 'strategyHub' && productTrendToSelect) {
            setProductTrendToSelect(null);
        }
    }, [activeTab, productTrendToSelect]);
    
    // Wizard state
    const [initialWizardPrompt, setInitialWizardPrompt] = useState<string | null>(null);
    const [initialProductId, setInitialProductId] = useState<string | null>(null);
    const [personaIdForWizard, setPersonaIdForWizard] = useState<string | null>(null);
    const [optionsForWizard, setOptionsForWizard] = useState<{ tone: string; style: string; length: string } | null>(null);
    const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
    
    // Selection & Scheduling State
    const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
    const [schedulingPost, setSchedulingPost] = useState<SchedulingPost | null>(null);
    const [isBulkScheduleModalOpen, setIsBulkScheduleModalOpen] = useState<boolean>(false);
    const [isScheduling, setIsScheduling] = useState<boolean>(false);

    // Bulk Action State
    const [bulkActionStatus, setBulkActionStatus] = useState<{ title: string; steps: string[]; currentStep: number } | null>(null);

    // Credential Assurance Workflow
    const onModalCloseRef = useRef<(() => void) | null>(null);
    
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Strategy Hub State
    const [isGeneratingFacebookTrends, setIsGeneratingFacebookTrends] = useState(false);
    const [isGeneratingFacebookPostIdeas, setIsGeneratingFacebookPostIdeas] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [areCredentialsSet, setAreCredentialsSet] = useState(false);
    const [viewingPost, setViewingPost] = useState<PostInfo | null>(null);

    const [isConfigLoaded, setIsConfigLoaded] = useState(false);
    const [brands, setBrands] = useState<{ id: string, name: string }[]>([]);
    const [isFetchingBrands, setIsFetchingBrands] = useState(true);

    const configLoadedRef = useRef(false);
    useEffect(() => {
        if (configLoadedRef.current) return;
        configLoadedRef.current = true;

        const loadInitialData = async () => {
            try {
                setIsFetchingBrands(true);
                // Single call to initialize app data
                const { credentialsSet, brands, adminDefaults } = await initializeApp();

                await configService.initializeConfig(adminDefaults);
                setAdminSettings(configService.getAdminDefaults());
                setSettings(configService.getAppSettings());
                setAiModelConfig(configService.getAiModelConfig());

                // Check if admin was previously authenticated
                setIsAdminAuthenticated(checkAdminAuthenticated());

                setAreCredentialsSet(credentialsSet);
                setBrands(brands);

                if (credentialsSet) {
                    setToast({ message: 'Successfully connected to outer services.', type: 'success' });
                } else {
                    setToast({ message: 'Failed to connect to outer services. Please check your credentials.', type: 'error' });
                }
            } catch (error) {
                console.error("Failed to load initial configuration:", error);
                setError("Failed to load initial configuration. Please check your Database setup.");
            } finally {
                setIsConfigLoaded(true);
                setIsFetchingBrands(false);
            }
        };
        loadInitialData();
    }, []);

    const isLoading = !!loaderContent;
    const isPerformingBulkAction = !!bulkActionStatus;


    const updateAutoSaveStatus = useCallback((status: 'saving' | 'saved' | 'error') => {
        console.log('AutoSave status changing to:', status);
        setAutoSaveStatus(status);
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
        if (status === 'saved' || status === 'error') {
            autoSaveTimeoutRef.current = window.setTimeout(() => {
                console.log('AutoSave status resetting to idle');
                setAutoSaveStatus('idle');
            }, 3000);
        }
    }, []);

    const executeTextGenerationWithFallback = useCallback(async <T extends unknown>(
        generationTask: (model: string) => Promise<T>,
        preferredModel: string
    ): Promise<T> => {
        console.log("Preferred model:", preferredModel);
        
        // Use textModelFallbackOrder from aiModelConfig if available, otherwise use an empty array
        const textModelFallbackOrder = aiModelConfig?.textModelFallbackOrder || [];
        const modelsToTry = [
            preferredModel, 
            ...textModelFallbackOrder.filter((m: string) => m !== preferredModel)
        ];
        console.log("Models to try:", modelsToTry);

        let lastError: Error | null = null;
        let rateLimitErrorCount = 0;
        const RATE_LIMIT_THRESHOLD = 2; 

        for (const model of modelsToTry) {
            try {
                console.log(`Attempting text generation with model: ${model}`);
                
                if (model.startsWith('gemini-') && !model.includes('free')) {
                    // This check is now implicit in the backend call
                }
                
                const result = await generationTask(model);
                
                if (model !== preferredModel) {
                    setSettings(prev => ({ ...prev, textGenerationModel: model }));
                }
                
                return result;
            } catch (error: any) {
                console.error(`Text generation failed with model ${model}:`, error);
                lastError = error;
                
                // Special handling for rate limit errors
                if (error.message && (error.message.includes('429') || error.message.includes('rate limit'))) {
                    rateLimitErrorCount++;
                    if (rateLimitErrorCount >= RATE_LIMIT_THRESHOLD) {
                        console.log(`Rate limit threshold (${RATE_LIMIT_THRESHOLD}) reached. Waiting before next attempt...`);
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    }
                }
                
                // If it's a model-specific error (e.g., unsupported model), continue to the next model
                if (error.message && (error.message.includes('not supported') || error.message.includes('invalid model'))) {
                    console.log(`Skipping model ${model} due to model-specific error.`);
                    continue;
                }
                
                // For other errors, we might want to stop trying other models
                // unless it's a rate limit error
                if (!(error.message && (error.message.includes('429') || error.message.includes('rate limit')))) {
                    console.log("Non-rate limit error encountered. Stopping fallback attempts.");
                    break;
                }
            }
        }
        
        // If we get here, all models failed
        console.error("All text generation models failed.", lastError);
        throw lastError || new Error("All text generation models failed.");
    }, [aiModelConfig, setSettings]);

    const ensureMongoProject = useCallback(async (assetsToSave?: GeneratedAssets): Promise<string | null> => {
        console.log("ensureMongoProject: Function started.");
        const assets = assetsToSave || generatedAssets;
        
        if (!areCredentialsSet) {
            console.log("ensureMongoProject: Credentials not set. Returning null.");
            return null;
        }
        console.log("ensureMongoProject: Credentials are set.");

        if (mongoBrandId) {
            console.log("ensureMongoProject: mongoBrandId already exists:", mongoBrandId, ". Returning it.");
            return mongoBrandId;
        }
        console.log("ensureMongoProject: mongoBrandId does not exist. Proceeding to create.");
    
        if (!assets) {
            console.error("ensureMongoProject: Assets are null. Throwing error.");
            throw new Error("Cannot create MongoDB project without assets.");
        }
    
        updateAutoSaveStatus('saving');
        console.log("ensureMongoProject: Auto-save status set to 'saving'. Creating new project record in MongoDB...");
        
        console.log("ensureMongoProject: Uploading media to Cloudinary.");
        const newPublicUrls = await uploadMediaToCloudinary(generatedImages);
        console.log("ensureMongoProject: Cloudinary upload results (newPublicUrls):", newPublicUrls);
        const allImageUrls = { ...generatedImages, ...newPublicUrls };
        
        // Update assets with the new image URLs
        const updatedAssets = JSON.parse(JSON.stringify(assets)); // Deep copy

        if (updatedAssets.coreMediaAssets.logoConcepts) {
            updatedAssets.coreMediaAssets.logoConcepts.forEach((logo: LogoConcept) => {
                if (allImageUrls[logo.imageKey]) {
                    logo.imageUrl = allImageUrls[logo.imageKey];
                }
            });
        }
        if (updatedAssets.unifiedProfileAssets.profilePictureImageKey && allImageUrls[updatedAssets.unifiedProfileAssets.profilePictureImageKey]) {
            updatedAssets.unifiedProfileAssets.profilePictureImageUrl = allImageUrls[updatedAssets.unifiedProfileAssets.profilePictureImageKey];
        }
        if (updatedAssets.unifiedProfileAssets.coverPhotoImageKey && allImageUrls[updatedAssets.unifiedProfileAssets.coverPhotoImageKey]) {
            updatedAssets.unifiedProfileAssets.coverPhotoImageUrl = allImageUrls[updatedAssets.unifiedProfileAssets.coverPhotoImageKey];
        }

        console.log("ensureMongoProject: Media uploaded. Calling createOrUpdateBrandRecord.");
        const newBrandId = await createOrUpdateBrandRecord(
            updatedAssets,
            null
        );
        console.log("ensureMongoProject: createOrUpdateBrandRecord returned newBrandId:", newBrandId);
        
        setMongoBrandId(newBrandId);
        setGeneratedImages(allImageUrls); 

        if (assets.mediaPlans && assets.mediaPlans.length > 0) {
            console.log(`ensureMongoProject: Saving initial media plan...`);
            try {
                await saveMediaPlanGroup(assets.mediaPlans[0], allImageUrls, newBrandId);
                console.log(`ensureMongoProject: Initial media plan saved successfully.`);
            } catch (error) {
                console.error(`ensureMongoProject: Failed to save initial media plan:`, error);
                setError(error instanceof Error ? error.message : "Could not save the initial media plan.");
                throw error; // Re-throw the error
            }
        }

        console.log("ensureMongoProject: New project record created with Brand ID:", newBrandId);
        updateAutoSaveStatus('saved');
        return newBrandId;
    }, [mongoBrandId, generatedAssets, generatedImages, updateAutoSaveStatus, areCredentialsSet]);

    
    const handleSetProductImages = () => {
        // This function is now a stub, as product images are managed locally in the wizard.
        // It could be repurposed for brand-level product images if it needed in the future.
        console.warn("handleSetProductImages is deprecated for plan-specific images.");
    };

    
    const setLanguage = async (lang: string) => {
        await configService.updateAppSettings({ ...settings, language: lang });
        setSettings(configService.getAppSettings());
    }

    const handleGenerateProfile = useCallback(async (idea: string) => {
        setLoaderContent({
            title: settings?.language === 'Việt Nam' ? "AI đang xây dựng hồ sơ..." : "AI is building your profile...",
            steps: [
                "Analyzing your business idea...",
                "Generating a creative brand name...",
                "Defining a powerful mission statement...",
                "Identifying core values and personality...",
                "Finalizing brand profile..."
            ]
        });
        setError(null);
        try {
            const generationTask = (model: string) => {
                return textGenerationService.generateBrandProfile(idea, settings.language, model, settings);
            };
            const profile = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            setBrandInfo(profile);
            setCurrentStep('profile');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to generate brand profile.");
        } finally {
            setLoaderContent(null);
        }
    }, [settings, executeTextGenerationWithFallback]);

        const handleGenerateKit = useCallback(async (info: BrandInfo) => {
        setBrandInfo(info);
        const kitSteps = settings?.language === 'Việt Nam' ? [
            "Phân tích hồ sơ thương hiệu của bạn...",
            "Xây dựng nền tảng thương hiệu cốt lõi...",
            "Thiết kế các ý tưởng logo và bảng màu...",
            "Tạo tài sản hồ sơ mạng xã hội...",
            "Xây dựng kế hoạch truyền thông 4 tuần ban đầu...",
            "Hoàn thiện tài sản..."
        ] : [
            "Analyzing your brand profile...",
            "Crafting core brand foundation...",
            "Designing logo concepts & color palette...",
            "Generating social media profile assets...",
            "Building initial 4-week media plan...",
            "Finalizing assets..."
        ];
        setLoaderContent({
            title: settings?.language === 'Việt Nam' ? "AI đang xây dựng bộ thương hiệu của bạn..." : "AI is building your brand kit...",
            steps: kitSteps
        });
        setError(null);
        try {
            console.log("handleGenerateKit: Starting generation task.");
            const generationTask = (model: string) => {
                return textGenerationService.generateBrandKit(info, settings.language, model, settings);
            };
            const kit = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            console.log("handleGenerateKit: Generation task completed. Kit:", kit);

            const fullAssets: GeneratedAssets = { ...kit, affiliateLinks: [], personas: [], trends: [], ideas: [] };
            dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: fullAssets });

            const firstPlan = kit.mediaPlans[0];
            if (firstPlan) {
                setMediaPlanGroupsList([{ id: firstPlan.id, name: firstPlan.name, prompt: firstPlan.prompt, productImages: firstPlan.productImages || [] }]);
                setActivePlanId(firstPlan.id);
            } else {
                setMediaPlanGroupsList([]);
                setActivePlanId(null);
            }

            setCurrentStep('assets');
            setActiveTab(firstPlan ? 'mediaPlan' : 'brandKit');

            console.log("handleGenerateKit: Calling ensureMongoProject.");
            const newBrandId = await ensureMongoProject(fullAssets);
            console.log("handleGenerateKit: ensureMongoProject completed.");
            if (!newBrandId) {
                setToast({
                    message: "Your brand kit has been generated, but could not be saved. Please configure your database connection in the Integrations panel and then save the project manually.",
                    type: 'error'
                });
            }
        } catch (err) {
            console.error("handleGenerateKit: Error caught:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setLoaderContent(null);
        }
    }, [settings, ensureMongoProject, executeTextGenerationWithFallback]);

    const handleGenerateMediaPlanGroup = useCallback((
        objective: string,
        keywords: string[],
        useSearch: boolean, 
        selectedPlatforms: string[],
        options: { tone: string; style: string; length: string; includeEmojis: boolean; },
        selectedProductId: string | null, 
        personaId: string | null,
        pillar: string // <-- Added
    ) => {
        // Wrap the async logic in an async IIFE
        (async () => {
            if (!generatedAssets?.brandFoundation) {
                setError("Cannot generate plan without a Brand Foundation.");
                return;
            }

            // Use the setting from the state
            const totalPosts = settings.totalPostsPerMonth;
            const userPrompt = `${objective}${keywords.length > 0 ? `\n\nKeywords to include: ${keywords.join(', ')}` : ''}`;
            
            const planSteps = settings?.language === 'Việt Nam' ? [
                `Phân tích mục tiêu của bạn: "${objective.substring(0, 50)}"...`,
                "Thiết lập chủ đề hàng tuần...",
                "Soạn thảo bài đăng...",
                "Tạo các hashtag hấp dẫn và CTA...",
                "Hoàn thiện kế hoạch..."
            ] : [
                `Analyzing your goal: "${objective.substring(0, 50)}"...`,
                "Establishing weekly themes...",
                "Drafting posts...",
                "Generating engaging hashtags and CTAs...",
                "Finalizing plan..."
            ];

            setLoaderContent({ title: settings?.language === 'Việt Nam' ? "Đang tạo kế hoạch truyền thông..." : "Generating media plan...", steps: planSteps });
            setError(null);
            try {
                const persona = personaId ? generatedAssets.personas?.find(p => p.id === personaId) ?? null : null;
                const selectedProduct = selectedProductId ? generatedAssets.affiliateLinks?.find(link => link.id === selectedProductId) ?? null : null;
                
                const generationTask = async (model: string) => {
                    return textGenerationService.generateMediaPlanGroup(
                        generatedAssets.brandFoundation!,
                        userPrompt,
                        settings.language,
                        totalPosts,
                        useSearch,
                        selectedPlatforms,
                        options,
                        settings,
                        model,
                        persona,
                        selectedProduct,
                        pillar // <-- Added
                    );
                };
                const newGroup = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
                
                // Append mediaPromptSuffix to each post's mediaPrompt
                const mediaPromptSuffix = settings.mediaPromptSuffix;
                const updatedPlan = newGroup.plan.map(week => ({
                    ...week,
                    posts: week.posts.map(post => {
                        if (post.mediaPrompt) {
                            if (Array.isArray(post.mediaPrompt)) {
                                // For carousel posts, append suffix to each prompt in the array
                                return {
                                    ...post,
                                    mediaPrompt: post.mediaPrompt.map(prompt => prompt + mediaPromptSuffix)
                                };
                            } else {
                                // For single prompts, append the suffix
                                return {
                                    ...post,
                                    mediaPrompt: post.mediaPrompt + mediaPromptSuffix
                                };
                            }
                        }
                        return post;
                    })
                }));

                const updatedGroup = {
                    ...newGroup,
                    plan: updatedPlan
                };
                

                updateAutoSaveStatus('saving');
                const brandId = await ensureMongoProject();
                if (!brandId) {
                    setAutoSaveStatus('idle');
                    setLoaderContent(null); 
                    setError("MongoDB credentials not configured. Media plan not saved.");
                    return;
                }

                const newPublicUrls = await uploadMediaToCloudinary(generatedImages);
                const allImageUrls = { ...generatedImages, ...newPublicUrls };

                // Save the plan and get the final, database-consistent version back
                const { savedPlan } = await saveMediaPlanGroup(updatedGroup, allImageUrls, brandId);

                if (!savedPlan) {
                    throw new Error("Failed to save media plan group. Received no plan from server.");
                }

                // Now, update the state with the final, correct data
                dispatchAssets({ type: 'ADD_MEDIA_PLAN', payload: savedPlan });
                setMediaPlanGroupsList(prev => [...prev, { id: savedPlan.id, name: savedPlan.name, prompt: savedPlan.prompt, productImages: savedPlan.productImages }]);
                setActivePlanId(savedPlan.id);
                setKhongMinhSuggestions({});
                
                setGeneratedImages(allImageUrls); 
                updateAutoSaveStatus('saved');
                setLoaderContent(null); 

            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : "Failed to generate media plan.");
                updateAutoSaveStatus('error');
                setLoaderContent(null); 
            }
        })();
    }, [generatedAssets, settings, ensureMongoProject, generatedImages, updateAutoSaveStatus, executeTextGenerationWithFallback]);

    // New handler for creating funnel campaign plans
    const handleCreateFunnelCampaignPlan = useCallback(async (planShell: MediaPlanGroup & { wizardData?: any }) => {
        if (!generatedAssets?.brandFoundation) {
            setError("Cannot generate plan without a Brand Foundation.");
            return;
        }

        const { wizardData } = planShell;
        if (!wizardData) {
            setError("Funnel campaign wizard data is missing.");
            return;
        }

        const {
            campaignDuration,
            primaryObjective,
            generalGoal,
            selectedProductId,
            selectedPersonaId,
        } = wizardData;

        const calculateTotalPosts = () => {
            switch (campaignDuration) {
              case '1-week': return 7;
              case '2-weeks': return 14;
              case '1-month': return 30;
              default: return 30;
            }
        };

        const totalPosts = calculateTotalPosts();
        const persona = selectedPersonaId ? generatedAssets.personas?.find(p => p.id === selectedPersonaId) ?? null : null;
        const selectedProduct = selectedProductId ? generatedAssets.affiliateLinks?.find(link => link.id === selectedProductId) ?? null : null;

        const prompt = primaryObjective === 'product' && selectedProduct 
            ? `Generate a full ${campaignDuration} marketing funnel campaign to promote the product \"${selectedProduct.productName}\". The campaign should include awareness, consideration, decision, and action stages, totaling approximately ${totalPosts} posts.` 
            : `Generate a full ${campaignDuration} marketing funnel campaign for the general goal: \"${generalGoal}\". The campaign should include awareness, consideration, decision, and action stages, totaling approximately ${totalPosts} posts.`;

        setLoaderContent({
            title: "Generating Funnel Campaign...",
            steps: [
                "Analyzing campaign goals...",
                "Structuring funnel stages (Awareness, Consideration, Decision)...",
                "Generating content for each stage...",
                "Finalizing campaign plan..."
            ]
        });
        setError(null);

        try {
            const generationTask = (model: string) => {
                return textGenerationService.generateMediaPlanGroup(
                    generatedAssets.brandFoundation,
                    prompt,
                    settings.language,
                    totalPosts,
                    true, // useSearch
                    ['Facebook', 'Instagram', 'TikTok', 'YouTube'], // Default platforms for funnel
                    { tone: 'persuasive', style: 'storytelling', length: 'medium', includeEmojis: true }, // Default options
                    settings,
                    model,
                    persona,
                    selectedProduct,
                    'funnel' // pillar
                );
            };
            const newGeneratedPlan = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);

            const finalPlan: MediaPlanGroup = {
                ...planShell,
                prompt: prompt,
                plan: newGeneratedPlan.plan,
                name: newGeneratedPlan.name || planShell.name, 
            };
            delete (finalPlan as any).wizardData;

            // Add the new plan to the assets
            dispatchAssets({ type: 'ADD_MEDIA_PLAN', payload: finalPlan });
            
            // Update the media plan groups list
            setMediaPlanGroupsList(prev => [...prev, { 
                id: finalPlan.id, 
                name: finalPlan.name, 
                prompt: finalPlan.prompt, 
                productImages: finalPlan.productImages,
                source: finalPlan.source
            }]);
            
            // Set the new plan as the active plan
            setActivePlanId(finalPlan.id);
            
            // Save to MongoDB if connected
            updateAutoSaveStatus('saving');
            const brandId = await ensureMongoProject();
            if (brandId) {
                const newPublicUrls = await uploadMediaToCloudinary(generatedImages);
                const allImageUrls = { ...generatedImages, ...newPublicUrls };
                
                await saveMediaPlanGroup(finalPlan, allImageUrls, brandId);
                setGeneratedImages(allImageUrls);
                updateAutoSaveStatus('saved');
            } else {
                updateAutoSaveStatus('idle');
            }
            
            setSuccessMessage(settings.language === 'Việt Nam' 
                ? "Chiến dịch funnel đã được tạo thành công!" 
                : "Funnel campaign created successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
            
        } catch (err) {
            console.error("Failed to create funnel campaign plan:", err);
            setError(err instanceof Error ? err.message : "Failed to create funnel campaign plan.");
            updateAutoSaveStatus('error');
        } finally {
            setLoaderContent(null);
        }
    }, [generatedAssets, settings, ensureMongoProject, generatedImages, updateAutoSaveStatus, executeTextGenerationWithFallback]);

    const handleBackToIdea = useCallback(() => {
        setCurrentStep('idea');
        setActiveTab('brandKit');
        setBrandInfo(null);
        dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: null! });
        setGeneratedImages({});
        setMongoBrandId(null);
        setMediaPlanGroupsList([]);
        setActivePlanId(null);
        setError(null);
        setSuccessMessage(null);
    }, []);

    const handleSetImage = useCallback(async (dataUrl: string, imageKey: string, postInfo?: PostInfo) => {
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        let baseKey = imageKey;
        
        if (postInfo) {
            baseKey = `media_plan_post_${postInfo.post.id}`;
        } else {
            const keyParts = imageKey.split('_');
            if (keyParts.length >= 2) {
                baseKey = `${keyParts[0]}_${keyParts[1]}`;
            }
        }
        const newImageKey = `${baseKey}_${randomSuffix}`;
        
        setGeneratedImages(prev => ({ ...prev, [newImageKey]: dataUrl }));

        const action: AssetsAction = { type: 'UPDATE_ASSET_IMAGE', payload: { oldImageKey: imageKey, newImageKey, postInfo } };
        dispatchAssets(action);

        if (postInfo) {
            const updatedPost = { ...postInfo.post, imageKey: newImageKey };
            setViewingPost({ ...postInfo, post: updatedPost });
        }
        
        if (mongoBrandId && generatedAssets) {
            updateAutoSaveStatus('saving');
            try {

                const publicUrls = await uploadMediaToCloudinary({ [newImageKey]: dataUrl });
                const publicUrl = publicUrls[newImageKey];

                if (publicUrl) {
                    setGeneratedImages(prev => ({ ...prev, ...publicUrls }));
                    if (postInfo) {
                        const mediaOrder: ('image' | 'video')[] = postInfo.post.mediaOrder?.includes('image') ? postInfo.post.mediaOrder : [...(postInfo.post.mediaOrder || []), 'image'];
                        const updatedPost = { ...postInfo.post, imageKey: newImageKey, imageUrl: publicUrl, mediaOrder };
                        await updateMediaPlanPostInDatabase(updatedPost, mongoBrandId, publicUrl);
                        setViewingPost({ ...postInfo, post: updatedPost });
                    } else {
                        const updatedAssets = assetsReducer(generatedAssets, action);
                        if (updatedAssets && updatedAssets.coreMediaAssets.logoConcepts) {
                            const logo = updatedAssets.coreMediaAssets.logoConcepts.find((l: LogoConcept) => l.imageKey === newImageKey);
                            if (logo) {
                                logo.imageUrl = publicUrl;
                            }
                        }
                        if (updatedAssets && updatedAssets.unifiedProfileAssets.profilePictureImageKey === newImageKey) {
                            updatedAssets.unifiedProfileAssets.profilePictureImageUrl = publicUrl;
                        }
                        if (updatedAssets && updatedAssets.unifiedProfileAssets.coverPhotoImageKey === newImageKey) {
                            updatedAssets.unifiedProfileAssets.coverPhotoImageUrl = publicUrl;
                        }
                        
                        if (updatedAssets) {
                            await syncAssetMedia(mongoBrandId, updatedAssets);
                        }
                    }
                    updateAutoSaveStatus('saved');
                } else {
                    throw new Error("Image upload to Cloudinary failed, public URL not received.");
                }
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Could not save new image.';
                console.error("Explicit image save failed:", e);
                setError(message);
                updateAutoSaveStatus('error');
            }
        }
    }, [generatedAssets, mongoBrandId, updateAutoSaveStatus, setError]);

    const handleSetVideo = useCallback(async (dataUrl: string, key: string, postInfo: PostInfo) => {
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const newVideoKey = `media_plan_post_video_${postInfo.post.id}_${randomSuffix}`;
        
        setGeneratedVideos(prev => ({...prev, [newVideoKey]: dataUrl}));
        
        const mediaOrder: ('image' | 'video')[] = postInfo.post.mediaOrder?.includes('video') ? postInfo.post.mediaOrder : [...(postInfo.post.mediaOrder || []), 'video'];
        const updates: Partial<MediaPlanPost> = { videoKey: newVideoKey, mediaOrder };
        
        dispatchAssets({ type: 'UPDATE_POST', payload: { planId: postInfo.planId, weekIndex: postInfo.weekIndex, postIndex: postInfo.postIndex, updates } });

        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            try {
            

                const publicUrls = await uploadMediaToCloudinary({ [newVideoKey]: dataUrl });
                const publicUrl = publicUrls[newVideoKey];

                if (publicUrl) {
                    await updateMediaPlanPostInDatabase({ ...postInfo.post, ...updates }, mongoBrandId, undefined, publicUrl);
                    setGeneratedVideos(prev => ({ ...prev, ...publicUrls }));
                    updateAutoSaveStatus('saved');
                }
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Could not save new video.';
                console.error("Video save failed:", e);
                setError(message);
                updateAutoSaveStatus('error');
            }
        }
    }, [mongoBrandId, updateAutoSaveStatus, setError]);

    const generateSingleImageCore = useCallback(async (mediaPrompt: string, settings: Settings, aspectRatio: "1:1" | "16:9" = "1:1", postInfo?: PostInfo): Promise<string> => {
        let imagesToUse: File[] = [];
        if (postInfo && 'planId' in postInfo && generatedAssets) {
            const planGroup = generatedAssets.mediaPlans.find(p => p.id === postInfo.planId);
            const serializedImages = planGroup?.productImages || [];
            if (isVisionModel(settings.imageGenerationModel) && serializedImages.length > 0) {
                imagesToUse = serializedImages.map(img => base64ToFile(img.data, img.name, img.type));
            }
        }
    
        const model = settings.imageGenerationModel;
        if (model.startsWith('@cf/')) {
            return generateImageWithCloudflare(mediaPrompt, model, imagesToUse);
        } else if (model.startsWith('banana/')) {
            return generateImageWithBanana(model, mediaPrompt, settings.mediaPromptSuffix, settings);
        } else {
            return generateImageWithOpenRouter(mediaPrompt, settings.mediaPromptSuffix, model, aspectRatio, imagesToUse, settings);
        }
    }, [generatedAssets]);

    const handleGenerateImage = useCallback(async (mediaPrompt: string, imageKey: string, aspectRatio: "1:1" | "16:9" = "1:1", postInfo?: PostInfo) => {
        setGeneratingImageKeys(prev => new Set(prev).add(imageKey));
        setError(null);
    
        try {
            if (!settings) {
                setError("Application settings not loaded.");
                return;
            }
            const dataUrl = await generateSingleImageCore(mediaPrompt, settings, aspectRatio, postInfo);
            
            const randomSuffix = Math.random().toString(36).substring(2, 10);
            let baseKey = imageKey;
            
            if (postInfo) {
                baseKey = `media_plan_post_${postInfo.post.id}`;
            } else {
                const keyParts = imageKey.split('_');
                if (keyParts.length >= 2) {
                    baseKey = `${keyParts[0]}_${keyParts[1]}`;
                }
            }
            const newImageKey = `${baseKey}_${randomSuffix}`;

            setGeneratedImages(prev => ({ ...prev, [newImageKey]: dataUrl }));
            const action: AssetsAction = { type: 'UPDATE_ASSET_IMAGE', payload: { oldImageKey: imageKey, newImageKey, postInfo } };
            dispatchAssets(action);
    
            if (mongoBrandId && dataUrl.startsWith('data:image') && generatedAssets) {
                updateAutoSaveStatus('saving');
                try {
                    // With BFF, we no longer need to check credentials on the frontend
                    // All credential management is handled by the BFF
                    
                    const publicUrls = await uploadMediaToCloudinary({ [newImageKey]: dataUrl });
                    // Even if Cloudinary upload is skipped (due to missing env vars), we should still save the image locally
                    const publicUrl = publicUrls[newImageKey];

                    if (postInfo) {
                        const mediaOrder: ('image' | 'video')[] = postInfo.post.mediaOrder?.includes('image') ? postInfo.post.mediaOrder : [...(postInfo.post.mediaOrder || []), 'image'];
                        const updatedPost = { ...postInfo.post, imageKey: newImageKey, mediaOrder };
                        await updateMediaPlanPostInDatabase(updatedPost, mongoBrandId, publicUrl);
                    } else {
                        const updatedAssets = assetsReducer(generatedAssets, action);
                        if (updatedAssets && updatedAssets.coreMediaAssets.logoConcepts) {
                            const logo = updatedAssets.coreMediaAssets.logoConcepts.find((l: LogoConcept) => l.imageKey === newImageKey);
                            if (logo) {
                                logo.imageUrl = publicUrl;
                            }
                        }
                        if (updatedAssets && updatedAssets.unifiedProfileAssets.profilePictureImageKey === newImageKey) {
                            updatedAssets.unifiedProfileAssets.profilePictureImageUrl = publicUrl;
                        }
                        if (updatedAssets && updatedAssets.unifiedProfileAssets.coverPhotoImageKey === newImageKey) {
                            updatedAssets.unifiedProfileAssets.coverPhotoImageUrl = publicUrl;
                        }
                        
                        if (updatedAssets) {
                            await syncAssetMedia(mongoBrandId, updatedAssets);
                        }
                    }
                    setGeneratedImages(prev => ({ ...prev, ...publicUrls }));
                    updateAutoSaveStatus('saved');
                } catch (e) {
                    const message = e instanceof Error ? e.message : 'Could not save new image.';
                    console.error("Explicit image save failed:", e);
                    setError(message);
                    updateAutoSaveStatus('error');
                }
            }
        } catch (err) {
            console.error(`Failed to generate image for key ${imageKey}:`, err);
            setError(err instanceof Error ? err.message : "Failed to generate image.");
        } finally {
            setGeneratingImageKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageKey);
                return newSet;
            });
        }
    }, [settings, mongoBrandId, generatedAssets, updateAutoSaveStatus, generateSingleImageCore]);
    
    const handleGenerateMediaPrompt = useCallback(async (postInfo: PostInfo): Promise<MediaPlanPost | null> => {
        if (!('planId' in postInfo) || !generatedAssets?.brandFoundation) return null;

        const { planId, weekIndex, postIndex, post } = postInfo;
        const planGroup = generatedAssets.mediaPlans.find(p => p.id === planId);
        const persona = planGroup?.personaId ? (generatedAssets.personas || []).find(p => p.id === planGroup.personaId) ?? null : null;

        const postKey = `${planId}_${weekIndex}_${postIndex}`;
        setGeneratingPromptKeys(prev => new Set(prev).add(postKey));
        setError(null);
        
        try {
            const generationTask = (model: string) => {
                return textGenerationService.generateMediaPromptForPost(
                    { title: post.title, content: post.content, contentType: post.contentType },
                    generatedAssets.brandFoundation!,
                    settings.language,
                    model,
                    persona,
                    settings
                );
            };
            const newPrompt = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            
            const updates = { mediaPrompt: newPrompt };
            dispatchAssets({ type: 'UPDATE_POST', payload: { planId, weekIndex, postIndex, updates } });
            
            const updatedPost = { ...post, ...updates };

            if (mongoBrandId) {
                updateAutoSaveStatus('saving');
                try {
                    await updateMediaPlanPostInDatabase(updatedPost, mongoBrandId);
                    updateAutoSaveStatus('saved');
                } catch (e) {
                    setError(e instanceof Error ? e.message : 'Could not save new prompt.');
                    updateAutoSaveStatus('error');
                }
            }
            return updatedPost;
        } catch (err) {
            console.error("Failed to generate media prompt:", err);
            setError(err instanceof Error ? err.message : "Failed to generate prompt.");
        } finally {
            setGeneratingPromptKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(postKey);
                return newSet;
            });
        }
        return null;
    }, [generatedAssets, settings, mongoBrandId, updateAutoSaveStatus, executeTextGenerationWithFallback]);

    const handleRefinePost = useCallback(async (text: string): Promise<string> => {
        const generationTask = (model: string) => {
            return textGenerationService.refinePostContent(text, model, settings);
        };
        try {
            const refinedText = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            return refinedText;
        } catch (err) {
            console.error("Failed to refine post content:", err);
            setError(err instanceof Error ? err.message : "Failed to refine post content.");
            return text; // Return original text on failure
        }
    }, [settings, executeTextGenerationWithFallback]);

    const [isRefining, setIsRefining] = useState(false);

    const handleGenerateInCharacterPost = useCallback(async (objective: string, platform: string, keywords: string[], pillar: string, postInfo: PostInfo) => {
        setIsRefining(true);
        setError(null);
        try {
            if (!settings || !generatedAssets?.personas) {
                setError("Settings or personas not loaded.");
                return;
            }
            const plan = generatedAssets.mediaPlans.find(p => p.id === postInfo.planId);
            if (!plan?.personaId) {
                setError("No persona is assigned to this media plan. Please assign a persona in the Media Plan tab.");
                return;
            }

            const generationTask = (model: string) => {
                return textGenerationService.generateInCharacterPost(objective, platform, plan.personaId!, model, keywords, pillar, settings);
            };
            
            const newContent = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);

            const updates = { content: newContent, pillar: pillar }; // Also save the pillar
            dispatchAssets({ type: 'UPDATE_POST', payload: { planId: postInfo.planId, weekIndex: postInfo.weekIndex, postIndex: postInfo.postIndex, updates } });
            
            const updatedPost = { ...postInfo.post, ...updates };
            setViewingPost({ ...postInfo, post: updatedPost });

            if (mongoBrandId) {
                updateAutoSaveStatus('saving');
                await updateMediaPlanPostInDatabase(updatedPost, mongoBrandId);
                updateAutoSaveStatus('saved');
            }

        } catch (err) {
            console.error("Failed to generate in-character post:", err);
            setError(err instanceof Error ? err.message : "Failed to generate post.");
        } finally {
            setIsRefining(false);
        }
    }, [settings, generatedAssets, mongoBrandId, executeTextGenerationWithFallback, updateAutoSaveStatus]);

    const handleUpdatePost = useCallback((postInfo: PostInfo) => {
        const { planId, weekIndex, postIndex, post } = postInfo;
        dispatchAssets({ type: 'UPDATE_POST', payload: { planId, weekIndex, postIndex, updates: post } });

        if (mongoBrandId) {
            updateMediaPlanPostInDatabase(postInfo.post, mongoBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
        }
    }, [mongoBrandId, updateAutoSaveStatus]);

    const handleGenerateAffiliateComment = useCallback(async (postInfo: PostInfo): Promise<MediaPlanPost | null> => {
        if (!generatedAssets?.brandFoundation || !('planId' in postInfo)) return null;

        const { planId, weekIndex, postIndex, post } = postInfo;
        
        const productIds = post.promotedProductIds || [];
        const products = (generatedAssets.affiliateLinks || []).filter(link => productIds.includes(link.id));

        if (products.length === 0) {
            setError("No promoted products found to generate a comment.");
            return null;
        }

        setGeneratingCommentPostIds(prev => new Set(prev).add(post.id));
        setError(null);
        try {
            const generationTask = (model: string) => {
                return textGenerationService.generateAffiliateComment(
                    post,
                    products,
                    generatedAssets.brandFoundation!,
                    settings.language,
                    model,
                    settings
                );
            };

            const newComment = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            const updates = { autoComment: newComment };
            dispatchAssets({ type: 'UPDATE_POST', payload: { planId, weekIndex, postIndex, updates } });

            const updatedPost = { ...post, ...updates };
            if (mongoBrandId) {
                updateAutoSaveStatus('saving');
                try {
                    await updateMediaPlanPostInDatabase(updatedPost, mongoBrandId);
                    updateAutoSaveStatus('saved');
                } catch (e) {
                    setError(e instanceof Error ? e.message : 'Could not save new comment.');
                    updateAutoSaveStatus('error');
                }
            }
            return updatedPost;
        } catch (err) {
            console.error("Failed to generate affiliate comment:", err);
            setError(err instanceof Error ? err.message : "Failed to generate comment.");
        } finally {
            setGeneratingCommentPostIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(post.id);
                return newSet;
            });
        }
        return null;
    }, [generatedAssets, settings, mongoBrandId, updateAutoSaveStatus, executeTextGenerationWithFallback]);

    // Trend & Idea Hub Handlers
    const handleSaveTrend = useCallback((trend: Trend) => {
        const payload = { ...trend, brandId: mongoBrandId || '' };
        dispatchAssets({ type: 'SAVE_TREND', payload });
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            saveTrend(payload, mongoBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
        }
    }, [mongoBrandId, updateAutoSaveStatus]);

    const handleDeleteTrend = useCallback((trendId: string) => {
        dispatchAssets({ type: 'DELETE_TREND', payload: trendId });
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            deleteTrendFromDatabase(trendId, mongoBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
        }
    }, [mongoBrandId, updateAutoSaveStatus]);

    const handleGenerateIdeas = useCallback(async (trend: Trend, useSearch: boolean) => {
        setLoaderContent({ title: "Generating Viral Ideas...", steps: ["Analyzing trend...", "Brainstorming concepts...", "Finalizing ideas..."] });
        try {
            const generationTask = (model: string) => {
                return textGenerationService.generateViralIdeas(trend, settings.language, useSearch, model, settings);
            };
            const newIdeaData = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            const newIdeas: Idea[] = newIdeaData.map(idea => ({
                ...idea,
                id: crypto.randomUUID(),
                trendId: trend.id,
            }));
            
            if (mongoBrandId) {
                const savedIdeas = await saveIdeasToDatabase(newIdeas, mongoBrandId);
                dispatchAssets({ type: 'ADD_IDEAS', payload: savedIdeas });
            } else {
                dispatchAssets({ type: 'ADD_IDEAS', payload: newIdeas });
            }
        } catch (err) {
            console.error("Failed to generate ideas:", err);
            setError(err instanceof Error ? err.message : "Failed to generate ideas.");
        } finally {
            setLoaderContent(null);
        }
    }, [settings, mongoBrandId, executeTextGenerationWithFallback]);
    
    const handleGenerateContentPackage = useCallback(async (
        idea: Idea,
        personaId: string | null,
        selectedProductId: string | null,
        options: { tone: string; style: string; length: string; includeEmojis: boolean; }
    ) => {
        if (!generatedAssets?.brandFoundation) return;

        const pillarPlatform = 'YouTube'; // Hardcoded
        
        // Debug logging
        console.log('Content package generation - input:', {
            idea,
            selectedProductId,
            generatedAssets
        });
        
        let selectedProduct = null;
        if (selectedProductId && generatedAssets.affiliateLinks) {
            selectedProduct = generatedAssets.affiliateLinks.find(link => link.id === selectedProductId) ?? null;
        } else if (idea.productId && generatedAssets.affiliateLinks) {
            // If no selectedProductId was passed, try to use the one from the idea
            selectedProduct = generatedAssets.affiliateLinks.find(link => link.id === idea.productId) ?? null;
        }
        
        // Validate selectedProduct
        if (selectedProduct && !selectedProduct.id) {
            console.warn('Selected product has no ID, setting to null:', selectedProduct);
            selectedProduct = null;
        }
        
        console.log('Content package generation - selectedProduct:', selectedProduct);

        // If a product was selected, verify it exists in MongoDB
        if (selectedProduct && mongoBrandId) {
            const productExists = await checkIfProductExistsInDatabase(selectedProduct.id);
            if (!productExists) {
                console.warn(`Selected product ${selectedProduct.id} not found in MongoDB. Saving it now.`);
                // Save the product to MongoDB
                await saveAffiliateLinks([selectedProduct], mongoBrandId);
            }
        }

        setLoaderContent({ 
            title: settings.language === 'Việt Nam' ? "Đang tạo Gói Nội Dung..." : "Generating Content Package...",
            steps: [
                settings.language === 'Việt Nam' ? "Soạn nội dung trụ cột..." : "Crafting pillar content...",
                settings.language === 'Việt Nam' ? "Tạo các gợi ý hình ảnh..." : "Generating image prompts...",
                settings.language === 'Việt Nam' ? "Hoàn thiện gói nội dung..." : "Finalizing content package..."
            ]
        });

        try {
            const newPackage = await textGenerationService.generateContentPackage(
                idea,
                generatedAssets.brandFoundation,
                settings.language,
                settings,
                settings.textGenerationModel,
                personaId ? (generatedAssets.personas || []).find(p => p.id === personaId) ?? null : null,
                pillarPlatform,
                options,
                selectedProduct
            );

            dispatchAssets({ type: 'ADD_CONTENT_PACKAGE', payload: newPackage });
            setMediaPlanGroupsList(prev => [...prev, { id: newPackage.id, name: newPackage.name, prompt: newPackage.prompt, source: newPackage.source, personaId: newPackage.personaId }]);
            setActivePlanId(newPackage.id);
            setActiveTab('mediaPlan');

            // Save to MongoDB if we have a brand ID
            if (mongoBrandId) {
                updateAutoSaveStatus('saving');
                
                // Extract image URLs from posts for saving
                const allImageUrls: Record<string, string> = {};
                newPackage.plan.forEach(week => {
                    week.posts.forEach(post => {
                        if (post.imageKey && generatedImages[post.imageKey]) {
                            allImageUrls[post.imageKey] = generatedImages[post.imageKey];
                        }
                    });
                });

                await saveMediaPlanGroup(newPackage, allImageUrls, mongoBrandId);
                updateAutoSaveStatus('saved');
                
                // Show success message
                setSuccessMessage(settings.language === 'Việt Nam' ? "Gói nội dung đã được lưu thành công!" : "Content package saved successfully!");
                setTimeout(() => setSuccessMessage(null), 4000);
            }

        } catch (err) {
            console.error("Failed to generate content package:", err);
            setError(err instanceof Error ? err.message : "Failed to generate content package.");
            
            // Update auto-save status to error if we were saving
            if (mongoBrandId) {
                updateAutoSaveStatus('error');
            }
        } finally {
            setLoaderContent(null);
        }
    }, [generatedAssets, settings, mongoBrandId, updateAutoSaveStatus, saveMediaPlanGroup, setLoaderContent, setError, setSuccessMessage, dispatchAssets, setMediaPlanGroupsList, setActivePlanId, setActiveTab, generatedImages]);

    const handleGenerateFacebookTrends = useCallback(async (industry: string) => {
        if (!mongoBrandId) {
            setError("Please save your project to MongoDB before generating trends.");
            return;
        }
        setIsGeneratingFacebookTrends(true);
        setError(null);
        try {
            const generationTask = (model: string) => {
                return textGenerationService.generateFacebookTrends(industry, settings.language, model, settings);
            };
            const newTrendsData = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);

            const newTrends: Trend[] = newTrendsData.map(trend => ({
                ...trend,
                id: crypto.randomUUID(),
                brandId: mongoBrandId,
            }));

            for (const trend of newTrends) {
                dispatchAssets({ type: 'SAVE_TREND', payload: trend });
            }
            
            // Save all new trends to MongoDB in one batch
            if (mongoBrandId) {
                updateAutoSaveStatus('saving');
                Promise.all(newTrends.map(trend => saveTrend(trend, mongoBrandId)))
                    .then(() => {
                        updateAutoSaveStatus('saved');
                        setSuccessMessage(`Successfully found and saved ${newTrends.length} new trends.`);
                        setTimeout(() => setSuccessMessage(null), 4000);
                    })
                    .catch(e => {
                        setError(e.message);
                        updateAutoSaveStatus('error');
                    });
            }

        } catch (err) {
            console.error("Failed to generate Facebook trends:", err);
            setError(err instanceof Error ? err.message : "Failed to generate Facebook trends.");
        } finally {
            setIsGeneratingFacebookTrends(false);
        }
    }, [settings, mongoBrandId, executeTextGenerationWithFallback, updateAutoSaveStatus]);

    // New function for generating ideas from a product
    const handleGenerateIdeasFromProduct = useCallback(async (product: AffiliateLink) => {
        setLoaderContent({ title: "Generating Content Ideas...", steps: ["Analyzing product...", "Brainstorming concepts...", "Finalizing ideas..."] });
        try {
            const generationTask = (model: string) => {
                return textGenerationService.generateIdeasFromProduct(product, settings.language, model, settings);
            };
            const newIdeaData = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);

            if (!Array.isArray(newIdeaData) || newIdeaData.length === 0) {
                throw new Error("Failed to generate ideas: No valid ideas returned from AI service.");
            }

            const existingTrends = generatedAssets?.trends || [];
            let productTrend: Trend | undefined = existingTrends.find(t => t.topic === `Ideas for: ${product.productName}`);
            let trendId: string;

            if (!productTrend) {
                const newTrendPayload: Omit<Trend, 'id'> = {
                    brandId: mongoBrandId || '',
                    industry: 'Product Ideas',
                    topic: `Ideas for: ${product.productName}`,
                    keywords: [product.productName, product.providerName],
                    links: [{ title: 'Product Link', url: product.productLink }],
                    notes: `Generated ideas for affiliate product: ${product.productName}`,
                    analysis: `Affiliate product ideas for ${product.productName}`,
                    createdAt: new Date().toISOString(),
                };

                if (mongoBrandId) {
                    updateAutoSaveStatus('saving');
                    try {
                        const newId = await saveTrend(newTrendPayload, mongoBrandId);
                        productTrend = { ...newTrendPayload, id: newId };
                        dispatchAssets({ type: 'SAVE_TREND', payload: productTrend });
                        updateAutoSaveStatus('saved');
                    } catch (e) {
                        console.error("Failed to save trend to MongoDB:", e);
                        setError(e instanceof Error ? e.message : "Failed to save trend to MongoDB.");
                        updateAutoSaveStatus('error');
                    }
                } else {
                    productTrend = { ...newTrendPayload, id: crypto.randomUUID() };
                    dispatchAssets({ type: 'SAVE_TREND', payload: productTrend });
                }
            }
            
            trendId = productTrend!.id;

            const newIdeas: Idea[] = newIdeaData.map(idea => ({
                ...idea,
                id: crypto.randomUUID(),
                trendId: trendId, 
                productId: product.id, 
            }));

            if (mongoBrandId) {
                updateAutoSaveStatus('saving');
                try {
                    const savedIdeas = await saveIdeasToDatabase(newIdeas, mongoBrandId);
                    dispatchAssets({ type: 'ADD_IDEAS', payload: savedIdeas });
                    updateAutoSaveStatus('saved');
                    
                    setSuccessMessage(`Generated ${newIdeas.length} ideas from ${product.productName}`);
                    setTimeout(() => setSuccessMessage(null), 3000);
                    
                    setActiveTab('strategy');
                    setProductTrendToSelect(trendId);
                } catch (e) {
                    console.error("Failed to save ideas to MongoDB:", e);
                    setError(e instanceof Error ? e.message : "Failed to save ideas to MongoDB.");
                    updateAutoSaveStatus('error');
                }
            } else {
                setSuccessMessage(`Generated ${newIdeas.length} ideas from ${product.productName}`);
                setTimeout(() => setSuccessMessage(null), 3000);
                
                setActiveTab('strategy');
                setProductTrendToSelect(trendId);
            }
        } catch (err) {
            console.error("Failed to generate ideas from product:", err);
            let errorMessage = "Failed to generate ideas from product. Please check your API keys and try again.";
            if (err instanceof Error) {
                if (err.message.includes('rate limit')) {
                    errorMessage = "All models are currently rate limited. Please try again later or configure a different model in Settings.";
                } else if (err.message.includes('API Key')) {
                    errorMessage = "Please configure your API keys in the Integrations panel.";
                } else {
                    errorMessage = err.message;
                }
            }
            setError(errorMessage);
        } finally {
            setLoaderContent(null);
        }
    }, [settings, mongoBrandId, executeTextGenerationWithFallback, generatedAssets, setActiveTab, updateAutoSaveStatus]);

    const handleSaveProjectToFile = useCallback(() => {
        if (!generatedAssets) {
            setError("No assets to save.");
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            const projectData = {
                version: '2.0',
                createdAt: new Date().toISOString(),
                assets: generatedAssets,
                settings: settings,
                generatedImages: generatedImages,
                generatedVideos: generatedVideos,
                mongoBrandId: mongoBrandId,
            };

            const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
            const fileName = `${generatedAssets.brandFoundation.brandName.replace(/\s+/g, '_') || 'SocialSync_Project'}.ssproj`;
            saveAs(blob, fileName);
            setSuccessMessage("Project saved successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to save project:", err);
            setError(err instanceof Error ? err.message : "Could not save project to file.");
        } finally {
            setIsSaving(false);
        }
    }, [generatedAssets, settings, generatedImages, generatedVideos, mongoBrandId]);

    const handleLoadProjectFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoaderContent({ title: "Loading Project...", steps: ["Reading file...", "Parsing data...", "Initializing assets..."] });
        setError(null);

        try {
            const text = await file.text();
            const projectData = JSON.parse(text);

            if (!projectData.assets || !projectData.settings) {
                throw new Error("Invalid project file format. Missing 'assets' or 'settings' key.");
            }
            
            dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: projectData.assets });
            setSettings(projectData.settings);
            setGeneratedImages(projectData.generatedImages || {});
            setGeneratedVideos(projectData.generatedVideos || {});
            setMongoBrandId(projectData.mongoBrandId || null);
            
            

            const firstPlan = projectData.assets.mediaPlans?.[0];
            if (firstPlan) {
                setMediaPlanGroupsList(projectData.assets.mediaPlans.map((p: MediaPlanGroup) => ({ id: p.id, name: p.name, prompt: p.prompt, productImages: p.productImages || [] })));
                setActivePlanId(firstPlan.id);
                await handleSelectPlan(firstPlan.id, projectData.assets); // Call handleSelectPlan to load full plan data
                console.log("Loaded project with first plan:", firstPlan.id);
            } else {
                setMediaPlanGroupsList([]);
                setActivePlanId(null);
            }
            const bf = projectData.assets.brandFoundation;
            setBrandInfo({ name: bf.brandName, mission: bf.mission, values: (bf.values || []).join(', '), audience: bf.targetAudience, personality: bf.personality });
            setCurrentStep('assets');
            setActiveTab(firstPlan ? 'mediaPlan' : 'brandKit');

        } catch (err) {
            console.error("Failed to load project file:", err);
            setError(err instanceof Error ? err.message : "Could not read or parse project file.");
        } finally {
            setLoaderContent(null);
            if (event.target) {
                event.target.value = '';
            }
        }
    }, []);

    const handleSelectPlan = useCallback(async (planId: string, assetsToUse?: GeneratedAssets, plansList?: {id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[]}[]) => {
        // Use provided assets or fall back to current generatedAssets
        const currentAssets = assetsToUse || generatedAssets;
        if (!currentAssets?.brandFoundation) {
            setError("Cannot load plan without brand foundation.");
            return;
        }
        
        // Check if the plan is already loaded
        const existingPlan = currentAssets.mediaPlans?.find((p: MediaPlanGroup) => p.id === planId);
        if (existingPlan && existingPlan.plan) {
            // Plan is already loaded, just set it as active
            setActivePlanId(planId);
            return;
        }
        
        // Plan is not loaded yet, show loading indicator and fetch it with pagination
        setLoaderContent({ title: `Loading Plan...`, steps: ["Fetching plan details...", "Loading posts with pagination..."] });
        setError(null);
        try {
            // Load the first page of posts
            const { plan, imageUrls, videoUrls } = await loadMediaPlan(planId);
            if (!currentAssets) {
                throw new Error("Assets are not initialized.");
            }
            
            // Always update the plan with the loaded data
            // Check if the plan already exists in the assets
            const existingPlanIndex = currentAssets.mediaPlans.findIndex((p: MediaPlanGroup) => p.id === planId);

            // console.log(`Handling plan ID selection for ${planId}`);
            // console.log("Current plan:", plan);
            
            if (existingPlanIndex !== -1) {
                // If plan exists, update it with the loaded data
                dispatchAssets({ type: 'UPDATE_PLAN', payload: { planId, plan } });
            } else {
                // If plan doesn't exist, create it with the loaded data
                // Try to find plan metadata in plansList or mediaPlanGroupsList
                const planMetadata = (plansList || mediaPlanGroupsList).find(p => p.id === planId);
                let newPlanGroup: MediaPlanGroup;
                
                if (planMetadata) {
                    newPlanGroup = {
                        ...planMetadata,
                        plan: plan,
                    };
                } else {
                    console.warn(`Could not find metadata for planId ${planId} in plans list.`);
                    newPlanGroup = {
                        id: planId,
                        name: 'Loaded Plan',
                        prompt: 'Loaded on demand',
                        plan: plan,
                    };
                }
                
                dispatchAssets({ type: 'ADD_MEDIA_PLAN', payload: newPlanGroup });
            }
            
            setGeneratedImages(prev => ({...prev, ...imageUrls}));
            setGeneratedVideos(prev => ({...prev, ...videoUrls}));
            setActivePlanId(planId);
        } catch(err) {
            console.error(`Failed to load media plan ${planId}:`, err);
            setError(err instanceof Error ? err.message : "Could not load plan details.");
        } finally {
            setLoaderContent(null);
        }
    }, [generatedAssets, settings.language, mediaPlanGroupsList]);

    const handleLoadFromDatabase = useCallback(async (brandId: string) => {
        setLoaderContent({ title: "Loading from MongoDB...", steps: ["Connecting...", "Fetching project data...", "Loading assets..."] });
        setError(null);
        try {
            // Step 1: Load initial project data for fast rendering
            const { brandSummary, brandKitData, affiliateLinks } = await loadInitialData(brandId);
            
            // Create a minimal assets object with just the brand kit data
            const initialAssets: GeneratedAssets = {
                brandFoundation: brandKitData.brandFoundation,
                coreMediaAssets: brandKitData.coreMediaAssets,
                unifiedProfileAssets: brandKitData.unifiedProfileAssets,
                mediaPlans: [], // Will be loaded lazily
                affiliateLinks: affiliateLinks || [], // Use loaded links
                personas: [], // Will be loaded lazily
                trends: [], // Will be loaded lazily
                ideas: [], // Will be loaded lazily
                facebookTrends: [], // Will be loaded lazily
                facebookPostIdeas: [], // Will be loaded lazily
            };

            // Pre-populate the generatedImages cache with persisted image URLs
            // This ensures images for logo concepts and unified profile assets are displayed immediately
            const initialGeneratedImages: Record<string, string> = {};
            // Populate from logo concepts
            brandKitData.coreMediaAssets.logoConcepts.forEach(logo => {
                if (logo.imageUrl) {
                    initialGeneratedImages[logo.imageKey] = logo.imageUrl;
                }
            });
            // Populate from unified profile assets if URLs exist
            if (brandKitData.unifiedProfileAssets.profilePictureImageUrl && brandKitData.unifiedProfileAssets.profilePictureImageKey) {
                initialGeneratedImages[brandKitData.unifiedProfileAssets.profilePictureImageKey] = brandKitData.unifiedProfileAssets.profilePictureImageUrl;
            }
            if (brandKitData.unifiedProfileAssets.coverPhotoImageUrl && brandKitData.unifiedProfileAssets.coverPhotoImageKey) {
                initialGeneratedImages[brandKitData.unifiedProfileAssets.coverPhotoImageKey] = brandKitData.unifiedProfileAssets.coverPhotoImageUrl;
            }
            
            dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: initialAssets });
            setGeneratedImages(initialGeneratedImages); // Set the pre-populated image cache
            setMongoBrandId(brandId);
            setCurrentStep('assets');
            setActiveTab('brandKit'); // Redirect to brandKit tab for instant rendering

            // Explicitly set the loaded brand's settings into the main settings state
            if (brandKitData.settings && Object.keys(brandKitData.settings).length > 0) {
                setSettings(brandKitData.settings);
            } else {
                // If the brand has no specific settings, fall back to the admin defaults
                setSettings(adminSettings || configService.getAppSettings());
            }

            // Step 2: Load media plan groups list in background
            const loadedPlansList = await loadMediaPlanGroups(brandId);
            setMediaPlanGroupsList(loadedPlansList);
            
            if (loadedPlansList.length > 0) {
                setActivePlanId(loadedPlansList[0].id);
                // We don't load the full plan data yet - that will happen lazily when the user navigates to the media plan tab
            } else {
                setActivePlanId(null);
            }
            
            

        } catch (err) {
            console.error("Failed to load project from MongoDB:", err);
            setError(err instanceof Error ? err.message : "Could not load project from MongoDB.");
        } finally {
            setLoaderContent(null);
        }
    }, []);

    const handleExportBrandKit = useCallback(async () => {
        if (!generatedAssets) {
            setError("No assets to export.");
            return;
        }
        setIsExporting(true);
        setError(null);
        try {
            const blob = await createDocxBlob(generatedAssets, settings.language);
            const fileName = `${generatedAssets.brandFoundation.brandName.replace(/\s+/g, '_') || 'Brand_Kit'}.docx`;
            saveAs(blob, fileName);
            setSuccessMessage("Brand Kit exported successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to export brand kit:", err);
            setError(err instanceof Error ? err.message : "Could not export brand kit.");
        } finally {
            setIsExporting(false);
        }
    }, [generatedAssets, settings.language]);

    const handleExportMediaPlan = useCallback(async () => {
        if (!generatedAssets || !generatedAssets.mediaPlans || generatedAssets.mediaPlans.length === 0) {
            setError("No media plan to export.");
            return;
        }
        setIsExporting(true);
        setError(null);
        try {
            const blob = await createMediaPlanXlsxBlob(generatedAssets.mediaPlans, settings.language);
            const fileName = `${generatedAssets.brandFoundation.brandName.replace(/\s+/g, '_') || 'SocialSync'}_MediaPlan.xlsx`;
            saveAs(blob, fileName);
            setSuccessMessage("Media Plan exported successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to export media plan:", err);
            setError(err instanceof Error ? err.message : "Could not export media plan.");
        } finally {
            setIsExporting(false);
        }
    }, [generatedAssets, settings.language]);

    const handleRegenerateWeekImages = useCallback(async (planId: string, weekIndex: number) => {
        if (!generatedAssets) return;
        const plan = generatedAssets.mediaPlans.find(p => p.id === planId);
        if (!plan) return;

        const week = plan.plan[weekIndex];
        if (!week || !week.posts) return;

        const postsToGenerate = week.posts
            .map((post, postIndex) => ({
                planId,
                weekIndex,
                postIndex,
                post
            }))
            .filter(pInfo => pInfo.post.mediaPrompt && !Array.isArray(pInfo.post.mediaPrompt));

        if (postsToGenerate.length === 0) {
            setSuccessMessage("No posts with image prompts found in this week.");
            setTimeout(() => setSuccessMessage(null), 3000);
            return;
        }

        setBulkActionStatus({
            title: "Regenerating Week Images...",
            steps: postsToGenerate.map(p => `Generating image for "${p.post.title}"`),
            currentStep: 0
        });

        for (let i = 0; i < postsToGenerate.length; i++) {
            const postInfo = postsToGenerate[i];
            setBulkActionStatus(prev => prev ? { ...prev, currentStep: i } : null);
            try {
                if (!settings) {
                    setError("Application settings not loaded.");
                    return;
                }
                await handleGenerateImage(postInfo.post.mediaPrompt as string, postInfo.post.imageKey || postInfo.post.id, '1:1', postInfo);
            } catch (error) {
                console.error(`Failed to regenerate image for post ${postInfo.post.id}`, error);
            }
        }

        setBulkActionStatus(null);
        setSuccessMessage("Finished regenerating week images.");
        setTimeout(() => setSuccessMessage(null), 3000);
    }, [generatedAssets, handleGenerateImage, settings]);

    const handleAssignPersonaToPlan = useCallback(async (planId: string, personaId: string | null) => {
        if (!generatedAssets) return;
        const planToUpdate = generatedAssets.mediaPlans.find(p => p.id === planId);
        if (!planToUpdate) return;
    
        dispatchAssets({ type: 'ASSIGN_PERSONA_TO_PLAN', payload: { planId, personaId } });
    
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            try {
                
                const updatedState = assetsReducer(generatedAssets, { type: 'ASSIGN_PERSONA_TO_PLAN', payload: { planId, personaId } });
                const updatedPlan = updatedState?.mediaPlans.find(p => p.id === planId);
                if (updatedPlan) {
                    const allPostsInPlan = updatedPlan.plan.flatMap(w => w.posts);
                    await assignPersonaToPlanInDatabase(planId, personaId, allPostsInPlan, mongoBrandId);
                }
                updateAutoSaveStatus('saved');
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Could not assign persona.';
                console.error("Failed to assign persona in MongoDB:", e);
                setError(message);
                updateAutoSaveStatus('error');
            }
        }
    }, [generatedAssets, mongoBrandId, updateAutoSaveStatus]);

    const handleLoadIdeasForTrend = useCallback(async (trendId: string) => {
        if (!mongoBrandId) {
            console.warn("DEBUG: No mongoBrandId, cannot load ideas for trend");
            return;
        }
        
        console.log("DEBUG: Loading ideas for trend ID:", trendId);
        try {
            const ideas = await loadIdeasForTrend(trendId, mongoBrandId);
            console.log("DEBUG: Loaded ideas:", ideas);
            dispatchAssets({ type: 'ADD_IDEAS', payload: ideas });
        } catch (error) {
            console.error("DEBUG: Failed to load ideas for trend:", error);
        }
    }, [mongoBrandId]);

    const handleSaveAffiliateLink = useCallback((link: AffiliateLink) => {
        dispatchAssets({ type: 'ADD_OR_UPDATE_AFFILIATE_LINK', payload: link });
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            saveAffiliateLinks([link], mongoBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => {
                    setError(e.message);
                    updateAutoSaveStatus('error');
                });
        }
    }, [mongoBrandId, updateAutoSaveStatus]);

    const handleDeleteAffiliateLink = useCallback((linkId: string) => {
        dispatchAssets({ type: 'DELETE_AFFILIATE_LINK', payload: linkId });
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            deleteAffiliateLinkFromDatabase(linkId, mongoBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => {
                    setError(e.message);
                    updateAutoSaveStatus('error');
                });
        }
    }, [mongoBrandId, updateAutoSaveStatus]);

    const handleImportAffiliateLinks = useCallback((links: AffiliateLink[]) => {
        dispatchAssets({ type: 'IMPORT_AFFILIATE_LINKS', payload: links });
        if (mongoBrandId && links.length > 0) {
            updateAutoSaveStatus('saving');
            saveAffiliateLinks(links, mongoBrandId)
                .then(() => {
                    updateAutoSaveStatus('saved');
                    setSuccessMessage(`${links.length} links imported successfully!`);
                    setTimeout(() => setSuccessMessage(null), 3000);
                })
                .catch(e => {
                    setError(e.message);
                    updateAutoSaveStatus('error');
                });
        }
    }, [mongoBrandId, updateAutoSaveStatus]);

    const handleReloadAffiliateLinks = useCallback(async () => {
        if (!mongoBrandId) {
            setError("Cannot reload affiliate links: No brand selected or MongoDB not connected.");
            return;
        }
        setLoaderContent({ title: "Reloading Affiliate Links...", steps: ["Fetching latest data..."] });
        setError(null);
        try {
            const latestAffiliateLinks = await fetchAffiliateLinksForBrand(mongoBrandId);
            dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: { ...generatedAssets!, affiliateLinks: latestAffiliateLinks } });
            setSuccessMessage("Affiliate links reloaded successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to reload affiliate links:", err);
            setError(err instanceof Error ? err.message : "Could not reload affiliate links.");
        } finally {
            setLoaderContent(null);
        }
    }, [mongoBrandId, generatedAssets, dispatchAssets]);

    const handleAcceptSuggestion = useCallback((postInfo: PostInfo, productId: string) => {
        const currentPromotedIds = postInfo.post.promotedProductIds || [];
        if (currentPromotedIds.includes(productId)) return;
        const updatedPost = {
            ...postInfo.post,
            promotedProductIds: [...currentPromotedIds, productId],
        };
        handleUpdatePost({ ...postInfo, post: updatedPost });
    }, [handleUpdatePost]);

    const handleRunKhongMinhForPost = useCallback(async (postInfo: PostInfo) => {
        if (!generatedAssets?.affiliateLinks || generatedAssets.affiliateLinks.length === 0) {
            setError("No affiliate links available to make suggestions.");
            return;
        }
        setAnalyzingPostIds(prev => new Set(prev).add(postInfo.post.id));
        try {
            const suggestions = await suggestProductsForPost(postInfo.post, generatedAssets.affiliateLinks, 2);
            setKhongMinhSuggestions(prev => ({ ...prev, [postInfo.post.id]: suggestions }));
        } catch (err) {
            console.error("KhongMinh suggestion failed:", err);
            setError(err instanceof Error ? err.message : "Could not get suggestions.");
        } finally {
            setAnalyzingPostIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(postInfo.post.id);
                return newSet;
            });
        }
    }, [generatedAssets?.affiliateLinks]);

    const handleTogglePostSelection = useCallback((postId: string) => {
        setSelectedPostIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAllPosts = useCallback((posts: PostInfo[]) => {
        setSelectedPostIds(new Set(posts.map(p => p.post.id)));
    }, []);

    const handleSchedulePost = useCallback(async (postInfo: SchedulingPost, scheduledAt: string) => {
        const { planId, weekIndex, postIndex, post } = postInfo;
        const updates = { scheduledAt, status: 'scheduled' as PostStatus };
        
        setIsScheduling(true);
        try {
            const currentPlan = generatedAssets?.mediaPlans.find(p => p.id === planId);
            const personaId = currentPlan?.personaId;
            if (!personaId) {
                throw new Error("No persona assigned to this media plan. Cannot schedule post.");
            }
            await socialApiSchedulePost(personaId, post.platform, post, scheduledAt);
            dispatchAssets({ type: 'UPDATE_POST', payload: { planId, weekIndex, postIndex, updates } });
            
            if (mongoBrandId) {
                updateAutoSaveStatus('saving');
                await updateMediaPlanPostInDatabase({ ...post, ...updates }, mongoBrandId);
                updateAutoSaveStatus('saved');
            }
            setSchedulingPost(null);
        } catch (err) {
            console.error("Failed to schedule post:", err);
            setError(err instanceof Error ? err.message : "Failed to schedule post.");
        } finally {
            setIsScheduling(false);
        }
    }, [mongoBrandId, updateAutoSaveStatus, generatedAssets]);

    const handlePublishPost = useCallback(async (postInfo: PostInfo) => {
        const { planId, weekIndex, postIndex, post } = postInfo;
        
        setIsScheduling(true); 
        try {
            const currentPlan = generatedAssets?.mediaPlans.find(p => p.id === planId);
            const personaId = currentPlan?.personaId;
            if (!personaId) {
                throw new Error("No persona assigned to this media plan. Cannot publish post.");
            }

            const imageUrl = post.imageKey ? generatedImages[post.imageKey] : undefined;
            const videoUrl = post.videoKey ? generatedVideos[post.videoKey] : undefined;

            console.log("Calling directPost with:", { personaId, post, imageUrl, videoUrl });
            const { publishedUrl } = await directPost(personaId, post.platform, post, imageUrl, videoUrl);
            
            const updates = { 
                status: 'published' as PostStatus, 
                publishedUrl: publishedUrl,
                publishedAt: new Date().toISOString(),
                scheduledAt: undefined, 
            };

            dispatchAssets({ type: 'UPDATE_POST', payload: { planId, weekIndex, postIndex, updates } });
            
            if (mongoBrandId) {
                updateAutoSaveStatus('saving');
                await updateMediaPlanPostInDatabase({ ...post, ...updates }, mongoBrandId);
                updateAutoSaveStatus('saved');
            }
            setSuccessMessage(`Post published successfully! URL: ${publishedUrl}`);
            setTimeout(() => setSuccessMessage(null), 5000);
            setViewingPost(null);
        } catch (err) {
            console.error("Failed to publish post:", err);
        } finally {
            setIsScheduling(false);
        }
    }, [mongoBrandId, updateAutoSaveStatus, generatedAssets, generatedImages, generatedVideos, setViewingPost]);

    const handlePostDrop = useCallback((postInfo: SchedulingPost, newDate: Date) => {
        const originalDate = postInfo.post.scheduledAt ? new Date(postInfo.post.scheduledAt) : new Date(newDate.setHours(10, 0, 0, 0));
        newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds());
        handleSchedulePost(postInfo, newDate.toISOString());
    }, [handleSchedulePost]);

    

    
            

    const handleBulkSchedule = useCallback(async (startDate: string, intervalDays: number, intervalHours: number, intervalMinutes: number) => {
        if (selectedPostIds.size === 0 || !generatedAssets) return;
    
        setIsScheduling(true);
        setIsBulkScheduleModalOpen(false);
    
        const allPosts: SchedulingPost[] = generatedAssets.mediaPlans.flatMap(plan =>
            plan.plan.flatMap((week, weekIndex) =>
                week.posts.map((post, postIndex) => ({
                    planId: plan.id,
                    weekIndex,
                    postIndex,
                    post
                }))
            )
        ).filter(p => selectedPostIds.has(p.post.id));
    
        const scheduleTime = new Date(startDate);
        const updatesForState: { planId: string, weekIndex: number, postIndex: number, updates: Partial<MediaPlanPost> }[] = [];
        const updatesForDatabase: { postId: string; scheduledAt: string; status: 'scheduled' }[] = [];
    
        for (const postInfo of allPosts) {
            const currentScheduledAt = scheduleTime.toISOString();
            updatesForState.push({ ...postInfo, updates: { scheduledAt: currentScheduledAt, status: 'scheduled' } });
            updatesForDatabase.push({ postId: postInfo.post.id, scheduledAt: currentScheduledAt, status: 'scheduled' });
            scheduleTime.setDate(scheduleTime.getDate() + intervalDays);
            scheduleTime.setHours(scheduleTime.getHours() + intervalHours);
            scheduleTime.setMinutes(scheduleTime.getMinutes() + intervalMinutes);
        }
    
        updatesForState.forEach(u => dispatchAssets({ type: 'UPDATE_POST', payload: u }));
        
        dispatchAssets({ type: 'BULK_SCHEDULE_POSTS', payload: { updates: updatesForDatabase } });
    
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            try {
                await bulkUpdatePostSchedules(updatesForDatabase);
                updateAutoSaveStatus('saved');
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not bulk schedule.');
                updateAutoSaveStatus('error');
            }
        }
    
        setSelectedPostIds(new Set());
        setIsScheduling(false);
    }, [generatedAssets, selectedPostIds, mongoBrandId, updateAutoSaveStatus]);

    const createBulkActionHandler = (
        title: string,
        stepGenerator: (post: MediaPlanPost) => string,
        action: (postInfo: PostInfo) => Promise<any>
    ) => async (posts: PostInfo[]) => {
        if (posts.length === 0) return;
    
        setBulkActionStatus({
            title,
            steps: posts.map(p => stepGenerator(p.post)),
            currentStep: 0,
        });
    
        for (let i = 0; i < posts.length; i++) {
            setBulkActionStatus(prev => prev ? { ...prev, currentStep: i } : null);
            try {
                await action(posts[i]);
            } catch (err) {
                console.error(`Error in bulk action for post ${posts[i].post.id}:`, err);
            }
        }
    
        setBulkActionStatus(null);
        setSelectedPostIds(new Set()); // Clear selection after action
    };

    const handleBulkGenerateImages = createBulkActionHandler(
        "Bulk Generating Images...",
        (post) => `Generating image for "${post.title}"`,
        (postInfo) => handleGenerateImage(postInfo.post.mediaPrompt!, postInfo.post.imageKey || postInfo.post.id, '1:1', postInfo)
    );

    const handleBulkSuggestPromotions = createBulkActionHandler(
        "Bulk Suggesting Promotions...",
        (post) => `Analyzing "${post.title}" for products`,
        handleRunKhongMinhForPost
    );

    const handleBulkGenerateComments = createBulkActionHandler(
        "Bulk Generating Comments...",
        (post) => `Generating comment for "${post.title}"`,
        handleGenerateAffiliateComment
    );
    
    const handleSavePersona = useCallback(async (persona: Persona) => {
        let personaToSave = { ...persona };
        
        updateAutoSaveStatus('saving');
        try {
            if (personaToSave.avatarImageUrl && personaToSave.avatarImageUrl.startsWith('data:') && personaToSave.avatarImageKey) {
                
                const publicUrls = await uploadMediaToCloudinary({ [personaToSave.avatarImageKey]: personaToSave.avatarImageUrl });
                const publicUrl = publicUrls[personaToSave.avatarImageKey];
                if (publicUrl) {
                    personaToSave.avatarImageUrl = publicUrl;
                    setGeneratedImages(prev => ({ ...prev, [personaToSave.avatarImageKey!]: publicUrl }));
                
                }
            }
            
            dispatchAssets({ type: 'SAVE_PERSONA', payload: personaToSave });
            
            if (mongoBrandId) {
                const newId = await savePersona(personaToSave, mongoBrandId);
                if (newId && newId !== personaToSave.id) {
                    dispatchAssets({ type: 'UPDATE_PERSONA_ID', payload: { oldId: personaToSave.id, newId } });
                }
            }
            updateAutoSaveStatus('saved');
        } catch(e: any) {
            setError(e.message);
            updateAutoSaveStatus('error');
        }
    }, [mongoBrandId, updateAutoSaveStatus]);

    const handleUpdatePersona = useCallback(async (persona: Persona) => {
        dispatchAssets({ type: 'SAVE_PERSONA', payload: persona });
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            try {
                await savePersona(persona, mongoBrandId);
                updateAutoSaveStatus('saved');
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not update persona.');
                updateAutoSaveStatus('error');
            }
        }
    }, [mongoBrandId, updateAutoSaveStatus]);

    const handleDeletePersona = useCallback((personaId: string) => {
        dispatchAssets({ type: 'DELETE_PERSONA', payload: personaId });
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            deletePersonaFromDatabase(personaId, mongoBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
        }
    }, [mongoBrandId, updateAutoSaveStatus]);

    const [isAutoPersonasModalOpen, setIsAutoPersonasModalOpen] = useState(false);
    const [autoGeneratedPersonas, setAutoGeneratedPersonas] = useState<Partial<Persona>[] | null>(null);

    const handleAutoGeneratePersona = useCallback(async () => {
        if (!generatedAssets?.brandFoundation) {
            setError("Brand Foundation is not available. Please generate a brand kit first.");
            return;
        }
        const { mission, usp } = generatedAssets.brandFoundation;
        if (!mission || !usp) {
            setError("Brand mission and USP must be defined in the Brand Kit to generate a persona.");
            return;
        }

        setLoaderContent({ title: "AI is Generating Personas...", steps: ["Analyzing brand identity...", "Crafting diverse persona profiles...", "Finalizing results..."] });
        setError(null);
        try {
            const generationTask = (model: string) => {
                return autoGeneratePersonaProfile(mission, usp, model, settings);
            };
            const personaDataArray = await executeTextGenerationWithFallback(generationTask, settings.textGenerationModel);
            setAutoGeneratedPersonas(personaDataArray);
            setIsAutoPersonasModalOpen(true);
        } catch (err) {
            console.error("Failed to auto-generate personas:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during persona generation.");
        } finally {
            setLoaderContent(null);
        }
    }, [generatedAssets?.brandFoundation, settings, executeTextGenerationWithFallback]);

    const handleSaveSelectedPersonas = useCallback((selectedPersonas: Partial<Persona>[]) => {
        if (!selectedPersonas || selectedPersonas.length === 0) {
            setIsAutoPersonasModalOpen(false);
            return;
        }

        const personasToSave = selectedPersonas.map(p => {
            const newId = crypto.randomUUID(); // Keep client-side ID for reducer key, backend will create the final unified ID
            
            // The incoming 'p' is a rich object from the AI. Spread it to preserve all fields.
            const fullPersona: Persona = {
                // Default values for fields that might be missing on a partial object
                demographics: { age: 0, location: '', occupation: '' },
                backstory: '',
                voice: { personalityTraits: [], communicationStyle: { formality: 50, energy: 50 }, linguisticRules: [] },
                knowledgeBase: [],
                brandRelationship: { originStory: '', coreAffinity: '', productUsage: '' },
                outfitDescription: '',
                mainStyle: '',
                activityField: '',
                avatarImageKey: undefined,
                avatarImageUrl: undefined,
                socialAccounts: [],
                contentTone: undefined,
                visualCharacteristics: undefined,
                coreCharacteristics: undefined,
                keyMessages: undefined,
                gender: undefined,

                ...p, // Spread the incoming partial persona to overwrite defaults with AI-generated data

                id: newId, // Ensure a unique client-side ID
                photos: Array.from({ length: 5 }, (_, i) => ({ id: crypto.randomUUID(), imageKey: `persona_${newId}_photo_${i}` })), // Ensure photos array exists
            };
            return fullPersona;
        });

        personasToSave.forEach(p => handleSavePersona(p));
        
        setIsAutoPersonasModalOpen(false);
        setAutoGeneratedPersonas(null);
        setSuccessMessage(`${personasToSave.length} new persona(s) saved successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);

    }, [handleSavePersona]);

    const handleSaveSettings = useCallback(async (newSettings: Settings) => {
        setIsSavingSettings(true);
        setError(null);
        try {
            // Persist settings to the database
            if (mongoBrandId) {
                await saveSettings(newSettings, mongoBrandId);
            } else {
                // If there is no brand context, save as system-wide defaults.
                await saveAdminDefaultsToDatabase(newSettings);
                // Also update the adminSettings state so it's reflected if we open a brand right after.
                setAdminSettings(newSettings);
            }

            // Update local state directly
            setSettings(newSettings);

            setIsSettingsModalOpen(false);
            setSuccessMessage("Settings saved successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (err) {
            console.error("Failed to save settings:", err);
            setError(err instanceof Error ? err.message : "Could not save settings.");
        } finally {
            setIsSavingSettings(false);
        }
    }, [mongoBrandId]);

    const handleSetPersonaImage = useCallback(async (personaId: string, photoId: string, dataUrl: string): Promise<string | undefined> => {
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const newImageKey = `persona_${personaId}_photo_${photoId}_${randomSuffix}`;
    
        setGeneratedImages(prev => ({ ...prev, [newImageKey]: dataUrl }));
        
        return newImageKey;
    }, []);

    
    // --- NEW FACEBOOK STRATEGY HANDLERS ---

    const handleGenerateFacebookPostIdeas = useCallback(async (trend: FacebookTrend) => {
        setIsGeneratingFacebookPostIdeas(true);
        setError(null);
        try {
            const newIdeaData = await textGenerationService.generatePostsForFacebookTrend(trend, settings.language, settings.textGenerationModel, settings);
            const newIdeas: FacebookPostIdea[] = newIdeaData.map(i => ({ ...i, id: crypto.randomUUID(), trendId: trend.id }));
            dispatchAssets({ type: 'ADD_FACEBOOK_POST_IDEAS', payload: newIdeas });
        } catch (err) {
             console.error("Failed to generate Facebook post ideas:", err);
            setError(err instanceof Error ? err.message : "Failed to generate post ideas.");
        } finally {
            setIsGeneratingFacebookPostIdeas(false);
        }
    }, [settings]);

    const handleAddFacebookPostIdeaToPlan = useCallback((idea: FacebookPostIdea) => {
        // This is a placeholder for a more complex feature. For now, it creates a new plan with this single post idea.
        const newPost: MediaPlanPost = {
            id: crypto.randomUUID(),
            platform: 'Facebook',
            contentType: 'Image Post',
            title: idea.title,
            content: idea.content,
            hashtags: [],
            cta: idea.cta,
            mediaPrompt: idea.mediaPrompt,
            status: 'draft',
        };

        const newPlanGroup: MediaPlanGroup = {
            id: crypto.randomUUID(),
            name: `Plan from: ${idea.title.substring(0, 20)}...`,
            prompt: `Generated from Facebook Trend: ${idea.title}`,
            plan: [{
                week: 1,
                theme: 'Generated from Facebook Trend',
                posts: [newPost]
            }],
            source: 'wizard',
        };

        dispatchAssets({ type: 'ADD_MEDIA_PLAN', payload: newPlanGroup });
        setActiveTab('mediaPlan');
        setActivePlanId(newPlanGroup.id);
        setSuccessMessage('Post idea added to a new plan!');
        setTimeout(() => setSuccessMessage(null), 3000);

    }, []);

    // --- RENDER LOGIC ---
    // Check if we're on the admin route
    const isAdminRoute = window.location.pathname === '/admin';
    
    // If on admin route, show admin page if authenticated, otherwise show login
    if (isAdminRoute) {
        if (isAdminAuthenticated) {
            return <AdminPage onLogout={handleAdminLogout} />;
        } else {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
                        <div className="space-y-4">
                            <input
                                type="password"
                                placeholder="Enter admin password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green"
                            />
                            <Button 
                                onClick={() => {
                                    // Use environment variable for admin password, fallback to 'admin123'
                                    if (authenticateAdmin(adminPassword)) {
                                        setIsAdminAuthenticated(true);
                                    } else {
                                        setError('Invalid password');
                                    }
                                }}
                                className="w-full"
                            >
                                Login
                            </Button>
                            {error && <p className="text-red-500 text-center">{error}</p>}
                        </div>
                    </div>
                </div>
            );
        }
    }
    
    if (isLoading || isPerformingBulkAction) {
        const content = isLoading ? loaderContent : bulkActionStatus;
        return <Loader title={content!.title} steps={content!.steps} currentStep={(content as any).currentStep} />;
    }
    
    if (error) {
        // Simple error overlay
        return (
            <div className="fixed inset-0 bg-red-50 flex flex-col items-center justify-center p-4 z-50">
                <div className="bg-white p-8 rounded-lg shadow-2xl border border-red-200 text-center max-w-lg">
                    <h2 className="text-2xl font-bold text-red-700">An Error Occurred</h2>
                    <p className="mt-2 text-gray-600 font-serif">{error}</p>
                    <pre className="mt-4 text-xs text-left bg-gray-100 p-2 rounded overflow-auto max-h-40">{error.toString()}</pre>
                    <Button onClick={() => setError(null)} className="mt-6">Close</Button>
                </div>
            </div>
        );
    }
    
    // Show loading screen while config is loading
    if (!isConfigLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading application configuration...</p>
                </div>
            </div>
        );
    }

    switch (currentStep) {
        case 'idea':
            return (
                <>
                    <Suspense fallback={<Loader title="Loading..." steps={[]} />}>
                        <IdeaProfiler
                            onGenerateProfile={handleGenerateProfile}
                            isLoading={!!loaderContent}
                            onLoadProject={handleLoadProjectFile}
                            onLoadProjectFromDatabase={handleLoadFromDatabase}
                            language={settings.language}
                            setLanguage={setLanguage}
                            integrationsVersion={integrationsVersion}
                            areCredentialsSet={areCredentialsSet}
                            brands={brands}
                            isFetchingBrands={isFetchingBrands}
                        />
                    </Suspense>
                    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                    
                </>
            );
        case 'profile':
            return (
                <Suspense fallback={<Loader title="Loading..." steps={[]} />}>
                    <BrandProfiler
                        initialBrandInfo={brandInfo!}
                        onGenerate={handleGenerateKit}
                        isLoading={!!loaderContent}
                        onBack={handleBackToIdea}
                        language={settings.language}
                    />
                </Suspense>
            );
        case 'assets':
            if (generatedAssets) {
                                  return (
                    <>
                        <Suspense fallback={<Loader title="Loading..." steps={[]} />}>
                            <MainDisplay
                                settings={settings}
                                assets={generatedAssets}
                                onGenerateImage={handleGenerateImage}
                                onSetImage={handleSetImage}
                                generatedImages={generatedImages}
                                isGeneratingImage={(key) => generatingImageKeys.has(key)}
                                isUploadingImage={(key) => uploadingImageKeys.has(key)}
                                onExportBrandKit={handleExportBrandKit}
                                isExportingBrandKit={isExporting}
                                onExportPlan={handleExportMediaPlan}
                                isExportingPlan={isExporting}
                                onGeneratePlan={handleGenerateMediaPlanGroup}
                                isGeneratingPlan={!!loaderContent}
                                onRegenerateWeekImages={handleRegenerateWeekImages}
                                onBulkSuggestPromotions={handleBulkSuggestPromotions}
                                onBulkGenerateComments={handleBulkGenerateComments}
                                onBulkGenerateImages={handleBulkGenerateImages}
                                productImages={[]}
                                onSetProductImages={handleSetProductImages}
                                onSaveProject={handleSaveProjectToFile}
                                isSavingProject={isSaving}
                                onStartOver={handleBackToIdea}
                                autoSaveStatus={autoSaveStatus}
                                onOpenSettings={() => setIsSettingsModalOpen(true)}
                                onOpenIntegrations={() => setIsDatabaseLoadModalOpen(true)}
                                activeTab={activeTab}
                                setActiveTab={setActiveTabWithLog}
                                // Media Plan props
                                mediaPlanGroupsList={mediaPlanGroupsList}
                                onSelectPlan={handleSelectPlan}
                                // New prop to pass brandFoundation
                                brandFoundation={generatedAssets?.brandFoundation}
                                activePlanId={activePlanId}
                                onUpdatePost={handleUpdatePost}
                                onRefinePost={handleRefinePost}
                                onGenerateInCharacterPost={handleGenerateInCharacterPost}
                                onAssignPersonaToPlan={handleAssignPersonaToPlan}
                                // Affiliate Vault props
                                onSaveAffiliateLink={handleSaveAffiliateLink}
                                onDeleteAffiliateLink={handleDeleteAffiliateLink}
                                onImportAffiliateLinks={handleImportAffiliateLinks}
                                onReloadLinks={handleReloadAffiliateLinks}
                                onGenerateIdeasFromProduct={handleGenerateIdeasFromProduct}
                                // KhongMinh
                                analyzingPostIds={analyzingPostIds}
                                isAnyAnalysisRunning={analyzingPostIds.size > 0}
                                khongMinhSuggestions={khongMinhSuggestions}
                                onAcceptSuggestion={handleAcceptSuggestion}
                                onRunKhongMinhForPost={handleRunKhongMinhForPost}
                                // On-demand prompt generation
                                generatingPromptKeys={generatingPromptKeys}
                                onGeneratePrompt={handleGenerateMediaPrompt}
                                // Comment Generation
                                onGenerateAffiliateComment={handleGenerateAffiliateComment}
                                generatingCommentPostIds={generatingCommentPostIds}
                                // Selection & Scheduling
                                selectedPostIds={selectedPostIds}
                                onTogglePostSelection={handleTogglePostSelection}
                                onSelectAllPosts={handleSelectAllPosts}
                                onClearSelection={() => setSelectedPostIds(new Set())}
                                onOpenScheduleModal={setSchedulingPost}
                                onPublishPost={handlePublishPost}
                                isScheduling={isScheduling}
                                onSchedulePost={handleSchedulePost}
                                onPostDrop={handlePostDrop}
                                schedulingPost={schedulingPost}
                                onOpenBulkScheduleModal={() => setIsBulkScheduleModalOpen(true)}
                                isBulkScheduleModalOpen={isBulkScheduleModalOpen}
                                onCloseBulkScheduleModal={() => setIsBulkScheduleModalOpen(false)}
                                onBulkSchedule={handleBulkSchedule}
                                // Personas
                                onSavePersona={handleSavePersona}
                                onDeletePersona={handleDeletePersona}
                                onSetPersonaImage={handleSetPersonaImage}
                                onUpdatePersona={handleUpdatePersona}
                                onAutoGeneratePersona={handleAutoGeneratePersona}
                                // Strategy Hub
                                onSaveTrend={handleSaveTrend}
                                onDeleteTrend={handleDeleteTrend}
                                onGenerateIdeas={handleGenerateIdeas}
                                onGenerateContentPackage={handleGenerateContentPackage}
                                onGenerateFacebookTrends={handleGenerateFacebookTrends}
                                isGeneratingTrendsFromSearch={isGeneratingFacebookTrends}
                                onLoadIdeasForTrend={handleLoadIdeasForTrend}
                                // Video
                                generatedVideos={generatedVideos}
                                onSetVideo={handleSetVideo}
                                 // New Facebook Strategy Props
                                onGenerateFacebookPostIdeas={handleGenerateFacebookPostIdeas}
                                onAddFacebookPostIdeaToPlan={handleAddFacebookPostIdeaToPlan}
                                isGeneratingFacebookPostIdeas={isGeneratingFacebookPostIdeas}
                                // Post Detail Modal State
                                viewingPost={viewingPost}
                                setViewingPost={setViewingPost}
                                // Funnel Campaign Props
                                onCreateFunnelCampaignPlan={handleCreateFunnelCampaignPlan}
                                // Lazy loading props
                                isStrategyHubDataLoaded={!!(generatedAssets?.trends?.length > 0 || generatedAssets?.ideas?.length > 0)}
                                onLoadStrategyHubData={handleLoadStrategyHubData}
                                isLoadingStrategyHubData={false}
                                isAffiliateVaultDataLoaded={!!(generatedAssets?.affiliateLinks?.length > 0)}
                                onLoadAffiliateVaultData={handleLoadAffiliateVaultData}
                                isLoadingAffiliateVaultData={false}
                                isPersonasDataLoaded={!!(generatedAssets?.personas?.length > 0)}
                                onLoadPersonasData={handleLoadPersonasData}
                                isLoadingPersonasData={false}
                            />
                        </Suspense>
                        {successMessage && (
                            <div className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-out">
                                {successMessage}
                            </div>
                        )}
                        {waitMessage && (
                            <div className="fixed bottom-5 left-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                {waitMessage}
                            </div>
                        )}
                        
                        <Suspense fallback={null}>
                            <SettingsModal
                                isOpen={isSettingsModalOpen}
                                onClose={() => setIsSettingsModalOpen(false)}
                                settings={settings}
                                adminSettings={adminSettings}
                                onSave={handleSaveSettings}
                            />
                        </Suspense>

                        <Suspense fallback={null}>
                            <AutoPersonaResultModal
                                isOpen={isAutoPersonasModalOpen}
                                onClose={() => setIsAutoPersonasModalOpen(false)}
                                onSave={handleSaveSelectedPersonas}
                                personaData={autoGeneratedPersonas}
                                language={settings.language}
                            />
                        </Suspense>
                    </>
                );
            }
            // Fallback if assets are somehow null
            return <div>Loading assets...</div>;
        default:
            return <div>Invalid state</div>;
    }
};

export default App;