import React, { useCallback, Dispatch, SetStateAction } from 'react';
import saveAs from 'file-saver';
import type { BrandInfo, GeneratedAssets, Settings, MediaPlanGroup } from '../../types';
import { createDocxBlob, createMediaPlanXlsxBlob } from '../services/exportService';
import {
    loadInitialProjectData as loadInitialData,
    loadMediaPlanGroupsList as loadMediaPlanGroups,
    loadMediaPlanFromDatabase as loadMediaPlan,
    loadProjectFromDatabase,
    createOrUpdateBrandRecordInDatabase
} from '../services/databaseService';
import { configService } from '../services/configService';
import { ActiveTab } from '../components/Header';

interface useProjectIOProps {
    dispatchAssets: Dispatch<any>;
    setGeneratedImages: Dispatch<SetStateAction<Record<string, string>>>;
    setGeneratedVideos: Dispatch<SetStateAction<Record<string, string>>>;
    setMongoBrandId: Dispatch<SetStateAction<string | null>>;
    setCurrentStep: Dispatch<SetStateAction<'idea' | 'profile' | 'assets'>>;
    setActiveTab: Dispatch<SetStateAction<ActiveTab>>;
    setLoaderContent: Dispatch<SetStateAction<{ title: string; steps: string[]; } | null>>;
    setError: Dispatch<SetStateAction<string | null>>;
    setSuccessMessage: (message: string | null) => void;
    setMediaPlanGroupsList: Dispatch<SetStateAction<{id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[]}[]>>;
    setActivePlanId: Dispatch<SetStateAction<string | null>>;
    setBrandInfo: Dispatch<SetStateAction<BrandInfo | null>>;
    generatedAssets: GeneratedAssets | null;
    settings: Settings;
    generatedImages: Record<string, string>;
    generatedVideos: Record<string, string>;
    mongoBrandId: string | null;
    adminSettings: Settings | null;
    mediaPlanGroupsList: {id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[]}[];
    syncLastSaved: (assets: GeneratedAssets) => void;
}

export const useProjectIO = ({
    dispatchAssets,
    setGeneratedImages,
    setGeneratedVideos,
    setMongoBrandId,
    setCurrentStep,
    setActiveTab,
    setLoaderContent,
    setError,
    setSuccessMessage,
    setMediaPlanGroupsList,
    setActivePlanId,
    setBrandInfo,
    generatedAssets,
    settings,
    generatedImages,
    generatedVideos,
    mongoBrandId,
    adminSettings,
    mediaPlanGroupsList,
    syncLastSaved
}: useProjectIOProps) => {

    const handleSelectPlan = useCallback(async (planId: string, assetsToUse?: GeneratedAssets, plansList?: {id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[]}[]) => {
        const currentAssets = assetsToUse || generatedAssets;
        if (!currentAssets?.brandFoundation) {
            setError("Cannot load plan without brand foundation.");
            return;
        }
        
        const existingPlan = currentAssets.mediaPlans?.find((p: MediaPlanGroup) => p.id === planId);
        if (existingPlan && existingPlan.plan) {
            setActivePlanId(planId);
            return;
        }
        
        setLoaderContent({ title: `Loading Plan...`, steps: ["Fetching plan details...", "Loading posts with pagination..."] });
        setError(null);
        try {
            const { plan, imageUrls, videoUrls } = await loadMediaPlan(planId);
            if (!currentAssets) {
                throw new Error("Assets are not initialized.");
            }
            
            // Update generatedImages with the loaded imageUrls
            setGeneratedImages(prev => ({ ...prev, ...imageUrls }));
            
            const existingPlanIndex = currentAssets.mediaPlans.findIndex((p: MediaPlanGroup) => p.id === planId);

            if (existingPlanIndex !== -1) {
                dispatchAssets({ type: 'UPDATE_PLAN', payload: { planId, plan } });
            } else {
                const planMetadata = (plansList || mediaPlanGroupsList).find(p => p.id === planId);
                let newPlanGroup: MediaPlanGroup;
                
                if (planMetadata) {
                    newPlanGroup = {
                        ...planMetadata,
                        plan: plan,
                    };
                } else {
                    newPlanGroup = {
                        id: planId,
                        name: 'Loaded Plan',
                        prompt: 'Loaded on demand',
                        plan: plan,
                    };
                }
                
                dispatchAssets({ type: 'ADD_MEDIA_PLAN', payload: newPlanGroup });
            }
            
            setActivePlanId(planId);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Could not load media plan with ID: ${planId}`);
        } finally {
            setLoaderContent(null);
        }
    }, [generatedAssets, dispatchAssets, mediaPlanGroupsList, setActivePlanId, setError, setLoaderContent, loadMediaPlan, setGeneratedImages]);

    const handleSaveProjectToFile = useCallback(() => {
        if (!generatedAssets) {
            setError("No assets to save.");
            return;
        }

        setError(null);
        try {
            const projectData = {
                version: '2.0',
                createdAt: new Date().toISOString(),
                assets: generatedAssets,
                // settings is already in generatedAssets
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
            setError(err instanceof Error ? err.message : "Could not save project to file.");
        }
    }, [generatedAssets, generatedImages, generatedVideos, mongoBrandId, setError, setSuccessMessage]);

    const handleLoadProjectFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoaderContent({ title: "Loading Project...", steps: ["Reading file...", "Parsing data...", "Initializing assets..."] });
        setError(null);

        try {
            const text = await file.text();
            const projectData = JSON.parse(text);

            if (!projectData.assets) { // settings are now inside assets
                throw new Error("Invalid project file format.");
            }
            
            dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: projectData.assets });
            setGeneratedImages(projectData.generatedImages || {});
            setGeneratedVideos(projectData.generatedVideos || {});
            setMongoBrandId(projectData.mongoBrandId || null);
            
            const firstPlan = projectData.assets.mediaPlans?.[0];
            if (firstPlan) {
                setMediaPlanGroupsList(projectData.assets.mediaPlans.map((p: MediaPlanGroup) => ({ id: p.id, name: p.name, prompt: p.prompt, productImages: p.productImages || [] })));
                setActivePlanId(firstPlan.id);
                await handleSelectPlan(firstPlan.id, projectData.assets);
            } else {
                setMediaPlanGroupsList([]);
                setActivePlanId(null);
            }
            const bf = projectData.assets.brandFoundation;
            setBrandInfo({ name: bf.brandName, mission: bf.mission, values: (bf.values || []).join(', '), audience: bf.targetAudience, personality: bf.personality });
            setCurrentStep('assets');
            setActiveTab(firstPlan ? 'mediaPlan' : 'brandKit');

        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read or parse project file.");
        } finally {
            setLoaderContent(null);
            if (event.target) {
                event.target.value = '';
            }
        }
    }, [dispatchAssets, setGeneratedImages, setGeneratedVideos, setMongoBrandId, setMediaPlanGroupsList, setActivePlanId, handleSelectPlan, setBrandInfo, setCurrentStep, setActiveTab, setError, setLoaderContent]);

    const handleLoadFromDatabase = useCallback(async (brandId: string) => {
        setLoaderContent({ title: "Loading from MongoDB...", steps: ["Connecting...", "Fetching project data...", "Loading assets..."] });
        setError(null);
        try {
            const { brandSummary, brandKitData, affiliateLinks } = await loadInitialData(brandId);
            
            const loadedSettings = (brandKitData.settings && Object.keys(brandKitData.settings).length > 0) 
                ? brandKitData.settings 
                : adminSettings || configService.getAppSettings();

            const initialAssets: GeneratedAssets = {
                ...generatedAssets,
                brandFoundation: brandKitData.brandFoundation,
                coreMediaAssets: brandKitData.coreMediaAssets,
                unifiedProfileAssets: brandKitData.unifiedProfileAssets,
                affiliateLinks: affiliateLinks || [],
                mediaPlans: [],
                personas: [],
                trends: [],
                ideas: [],
                settings: loadedSettings,
            } as GeneratedAssets;

            const initialGeneratedImages: Record<string, string> = {};
            brandKitData.coreMediaAssets.logoConcepts.forEach(logo => {
                if (logo.imageUrl) {
                    initialGeneratedImages[logo.imageKey] = logo.imageUrl;
                }
            });
            if (brandKitData.unifiedProfileAssets.profilePictureImageUrl && brandKitData.unifiedProfileAssets.profilePictureImageKey) {
                initialGeneratedImages[brandKitData.unifiedProfileAssets.profilePictureImageKey] = brandKitData.unifiedProfileAssets.profilePictureImageUrl;
            }
            if (brandKitData.unifiedProfileAssets.coverPhotoImageUrl && brandKitData.unifiedProfileAssets.coverPhotoImageKey) {
                initialGeneratedImages[brandKitData.unifiedProfileAssets.coverPhotoImageKey] = brandKitData.unifiedProfileAssets.coverPhotoImageUrl;
            }
            
            dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: initialAssets });
            setGeneratedImages(initialGeneratedImages);
            setMongoBrandId(brandId);

            syncLastSaved(initialAssets);

            setCurrentStep('assets');
            setActiveTab('brandKit');

            const loadedPlansList = await loadMediaPlanGroups(brandId);
            setMediaPlanGroupsList(loadedPlansList);
            
            if (loadedPlansList.length > 0) {
                setActivePlanId(loadedPlansList[0].id);
            } else {
                setActivePlanId(null);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load project from MongoDB.");
        } finally {
            setLoaderContent(null);
        }
    }, [adminSettings, generatedAssets, dispatchAssets, setGeneratedImages, setMongoBrandId, setCurrentStep, setActiveTab, setMediaPlanGroupsList, setActivePlanId, setError, setLoaderContent, syncLastSaved]);

    const handleCreateNewBrand = useCallback(async (assets: GeneratedAssets): Promise<string | null> => {
        setLoaderContent({ title: "Creating new brand...", steps: ["Saving initial data to database..."] });
        setError(null);
        try {
            const newBrandId = await createOrUpdateBrandRecordInDatabase(assets, null);
            if (!newBrandId) {
                throw new Error("Database did not return a new brand ID.");
            }
            setMongoBrandId(newBrandId);
            setSuccessMessage("Successfully created and saved new brand!");
            return newBrandId;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Could not create new brand in database.";
            setError(errorMessage);
            console.error('[useProjectIO] handleCreateNewBrand failed:', errorMessage);
            return null;
        } finally {
            setLoaderContent(null);
        }
    }, [setLoaderContent, setError, setMongoBrandId, setSuccessMessage]);

    const handleLoadCompleteProject = useCallback(async (brandId: string) => {
        setLoaderContent({ title: "Loading Complete Project...", steps: ["Fetching all brand data...", "Initializing application state..."] });
        setError(null);
        try {
            const { assets } = await loadProjectFromDatabase(brandId);

            if (!assets) {
                throw new Error("Failed to load complete project assets.");
            }

            // Initialize all assets from the single response
            dispatchAssets({ type: 'INITIALIZE_ASSETS', payload: assets });

            // Set the brand ID
            setMongoBrandId(brandId);

            // Sync auto-save with the newly loaded assets
            syncLastSaved(assets);

            // Set UI state
            setCurrentStep('assets');
            setActiveTab('brandKit');

            // Derive and set the list of media plan groups for the UI
            if (assets.mediaPlans && assets.mediaPlans.length > 0) {
                setMediaPlanGroupsList(assets.mediaPlans.map((p: MediaPlanGroup) => ({ id: p.id, name: p.name, prompt: p.prompt, productImages: p.productImages || [] })));
                setActivePlanId(assets.mediaPlans[0].id);
            } else {
                setMediaPlanGroupsList([]);
                setActivePlanId(null);
            }

            setSuccessMessage("Project loaded successfully!");

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Could not load complete project from MongoDB.";
            setError(errorMessage);
            console.error('[useProjectIO] handleLoadCompleteProject failed:', errorMessage);
        } finally {
            setLoaderContent(null);
        }
    }, [dispatchAssets, setMongoBrandId, syncLastSaved, setCurrentStep, setActiveTab, setMediaPlanGroupsList, setActivePlanId, setLoaderContent, setError, setSuccessMessage]);

    return {
        handleSaveProjectToFile,
        handleLoadProjectFile,
        handleLoadFromDatabase,
        handleSelectPlan,
        handleCreateNewBrand,
        handleLoadCompleteProject, // Export the new function
    };
};