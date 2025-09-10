
import React, { useCallback, Dispatch, SetStateAction } from 'react';
import saveAs from 'file-saver';
import type { BrandInfo, GeneratedAssets, Settings, MediaPlanGroup } from '../../types';
import { createDocxBlob, createMediaPlanXlsxBlob } from '../services/exportService';
import {
    loadInitialProjectData as loadInitialData,
    loadMediaPlanGroupsList as loadMediaPlanGroups,
    loadMediaPlanFromDatabase as loadMediaPlan
} from '../services/databaseService';
import { configService } from '../services/configService';
import { ActiveTab } from '../components/Header';

interface useProjectIOProps {
    dispatchAssets: Dispatch<any>;
    setSettings: Dispatch<SetStateAction<Settings>>;
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
}

export const useProjectIO = ({
    dispatchAssets,
    setSettings,
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
    mediaPlanGroupsList
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
            
            setGeneratedImages(prev => ({...prev, ...imageUrls}));
            setGeneratedVideos(prev => ({...prev, ...videoUrls}));
            setActivePlanId(planId);
        } catch(err) {
            setError(err instanceof Error ? err.message : "Could not load plan details.");
        } finally {
            setLoaderContent(null);
        }
    }, [generatedAssets, settings.language, mediaPlanGroupsList, dispatchAssets, setActivePlanId, setLoaderContent, setError, setGeneratedImages, setGeneratedVideos]);

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
            setError(err instanceof Error ? err.message : "Could not save project to file.");
        }
    }, [generatedAssets, settings, generatedImages, generatedVideos, mongoBrandId, setError, setSuccessMessage]);

    const handleLoadProjectFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoaderContent({ title: "Loading Project...", steps: ["Reading file...", "Parsing data...", "Initializing assets..."] });
        setError(null);

        try {
            const text = await file.text();
            const projectData = JSON.parse(text);

            if (!projectData.assets || !projectData.settings) {
                throw new Error("Invalid project file format.");
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
    }, [dispatchAssets, setSettings, setGeneratedImages, setGeneratedVideos, setMongoBrandId, setMediaPlanGroupsList, setActivePlanId, handleSelectPlan, setBrandInfo, setCurrentStep, setActiveTab, setError, setLoaderContent]);

    const handleLoadFromDatabase = useCallback(async (brandId: string) => {
        setLoaderContent({ title: "Loading from MongoDB...", steps: ["Connecting...", "Fetching project data...", "Loading assets..."] });
        setError(null);
        try {
            const { brandSummary, brandKitData, affiliateLinks } = await loadInitialData(brandId);
            
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
            setCurrentStep('assets');
            setActiveTab('brandKit');

            if (brandKitData.settings && Object.keys(brandKitData.settings).length > 0) {
                setSettings(brandKitData.settings);
            } else {
                setSettings(adminSettings || configService.getAppSettings());
            }

            const loadedPlansList = await loadMediaPlanGroups(brandId);
            console.log('[useProjectIO] Loaded media plan groups list:', loadedPlansList);
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
    }, [adminSettings, generatedAssets, dispatchAssets, setGeneratedImages, setMongoBrandId, setCurrentStep, setActiveTab, setSettings, setMediaPlanGroupsList, setActivePlanId, setError, setLoaderContent]);

    return {
        handleSaveProjectToFile,
        handleLoadProjectFile,
        handleLoadFromDatabase,
        handleSelectPlan,
    };
};