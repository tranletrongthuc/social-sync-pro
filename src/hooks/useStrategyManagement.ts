import React, { useCallback, Dispatch, useState, useRef, useEffect } from 'react';
import type { Trend, Idea, AffiliateLink, Settings, GeneratedAssets } from '../../types';
import {
    loadStrategyHub,
    loadAffiliateVault
} from '../services/lazyLoadService';
import {
    saveTrendToDatabase,
    deleteTrendFromDatabase,
    saveIdeasToDatabase,
    saveAffiliateLinksToDatabase as saveAffiliateLinks,
    deleteAffiliateLinkFromDatabase,
    loadIdeasForTrendFromDatabase,
    saveTrendsToDatabase // Add the new import
} from '../services/databaseService';
import { textGenerationService } from '../services/textGenerationService';
import { AiModelConfig } from '../services/configService';
import { ActiveTab } from '../components/Header';
import { taskService } from '../services/taskService';

interface useStrategyManagementProps {
    mongoBrandId: string | null;
    dispatchAssets: Dispatch<any>;
    setError: Dispatch<React.SetStateAction<string | null>>;
    setLoaderContent: Dispatch<React.SetStateAction<{ title: string; steps: string[]; } | null>>;
    updateAutoSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
    settings: Settings;
    aiModelConfig: AiModelConfig | null;
    generatedAssets: GeneratedAssets | null;
    setActiveTab: (tab: ActiveTab) => void;
    setProductTrendToSelect: Dispatch<React.SetStateAction<string | null>>;
    setSuccessMessage: (message: string | null) => void;
}

export const useStrategyManagement = ({
    mongoBrandId,
    dispatchAssets,
    setError,
    setLoaderContent,
    updateAutoSaveStatus,
    settings,
    aiModelConfig,
    generatedAssets,
    setActiveTab,
    setProductTrendToSelect,
    setSuccessMessage
}: useStrategyManagementProps) => {
    const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
    const [ideasForSelectedTrend, setIdeasForSelectedTrend] = useState<Idea[]>([]);
    const isStrategyHubLoaded = useRef(false);
    const isAffiliateVaultLoaded = useRef(false);

    const handleSelectTrend = useCallback(async (trend: Trend) => {
        if (!mongoBrandId || selectedTrend?.id === trend.id) return;
        setSelectedTrend(trend);
        setIdeasForSelectedTrend([]); // Clear previous ideas immediately
        try {
            const newIdeas = await loadIdeasForTrendFromDatabase(trend.id, mongoBrandId);
            setIdeasForSelectedTrend(newIdeas);
        } catch (error) {
            setError(error instanceof Error ? error.message : `Could not load ideas for trend ${trend.topic}.`);
            setIdeasForSelectedTrend([]); // Ensure ideas are cleared on error
        }
    }, [mongoBrandId, setError, selectedTrend]);

    const handleLoadStrategyHubData = useCallback(async () => {
        if (!mongoBrandId || isStrategyHubLoaded.current) return;
        isStrategyHubLoaded.current = true;
        try {
            const { trends } = await loadStrategyHub(mongoBrandId);
            dispatchAssets({ type: 'SET_STRATEGY_DATA', payload: { trends, ideas: [] } });
            // DO NOT automatically select the first trend.
            // Let the user click to load ideas.
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not load strategy hub data.");
        }
    }, [mongoBrandId, dispatchAssets, setError]);

    const handleLoadAffiliateVaultData = useCallback(async () => {
        if (!mongoBrandId || isAffiliateVaultLoaded.current) return;
        isAffiliateVaultLoaded.current = true;
        try {
            const affiliateLinks = await loadAffiliateVault(mongoBrandId);
            dispatchAssets({ type: 'SET_AFFILIATE_LINKS', payload: affiliateLinks });
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not load affiliate vault data.");
        }
    }, [mongoBrandId, dispatchAssets, setError]);

    const handleSaveTrend = useCallback(async (trend: Omit<Trend, 'id' | 'brandId'> & { id?: string }) => {
        if (!mongoBrandId) {
            setError("Cannot save trend: No brand selected.");
            return;
        }
        updateAutoSaveStatus('saving');
        try {
            const trendWithBrand = { ...trend, brandId: mongoBrandId };
            const savedId = await saveTrendToDatabase(trendWithBrand, mongoBrandId);
            const finalTrend = { ...trendWithBrand, id: savedId };

            dispatchAssets({ type: 'SAVE_TREND', payload: finalTrend });
            handleSelectTrend(finalTrend);
            updateAutoSaveStatus('saved');
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save trend.");
            updateAutoSaveStatus('error');
        }
    }, [mongoBrandId, updateAutoSaveStatus, dispatchAssets, setError, handleSelectTrend]);

    const handleDeleteTrend = useCallback((trendId: string) => {
        dispatchAssets({ type: 'DELETE_TREND', payload: trendId });
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            deleteTrendFromDatabase(trendId, mongoBrandId)
                .then(() => {
                    updateAutoSaveStatus('saved');
                    if (selectedTrend?.id === trendId) {
                        setSelectedTrend(null);
                        setIdeasForSelectedTrend([]);
                    }
                })
                .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
        }
    }, [mongoBrandId, updateAutoSaveStatus, dispatchAssets, setError, selectedTrend]);

    const handleGenerateIdeas = useCallback(async (trend: Trend, useSearch: boolean) => {
        console.log('[BackgroundTask] handleGenerateIdeas called with:', { trend, useSearch });
        
        setLoaderContent({ title: "Generating Viral Ideas...", steps: ["Analyzing trend...", "Brainstorming concepts...", "Finalizing ideas..."] });
        
        try {
            if (!aiModelConfig || !mongoBrandId) {
                console.error('[BackgroundTask] AI Model configuration not loaded or no brand selected.');
                throw new Error("AI Model configuration not loaded or no brand selected.");
            }
            
            // Create a background task for idea generation
            const taskPayload = {
                trend: { topic: trend.topic, keywords: trend.keywords },
                language: settings.language,
                useSearch: useSearch,
                settings: settings
            };

            console.log('[BackgroundTask] Creating background task for idea generation with payload:', taskPayload);
            
            const { taskId } = await taskService.createBackgroundTask(
                'GENERATE_VIRAL_IDEAS',
                taskPayload,
                mongoBrandId,
                'normal'
            );

            console.log('[BackgroundTask] Background task created successfully for idea generation with ID:', taskId);

            // Notify user that the task has been started
            setSuccessMessage(settings.language === 'Việt Nam' 
                ? "Đang tạo ý tưởng viral trong nền..." 
                : "Generating viral ideas in the background...");

        } catch (err) {
            console.error('[BackgroundTask] Error creating background task for idea generation:', err);
            setError(err instanceof Error ? err.message : "Failed to start idea generation task.");
        } finally {
            setLoaderContent(null);
        }
    }, [aiModelConfig, mongoBrandId, settings, setLoaderContent, setError, setSuccessMessage]);
    
    const handleGenerateIdeasFromProduct = useCallback(async (product: AffiliateLink) => {
        console.log('[BackgroundTask] handleGenerateIdeasFromProduct called with:', { product });
        
        setLoaderContent({ title: "Generating Ideas from Product...", steps: ["Analyzing product...", "Brainstorming concepts...", "Finalizing ideas..."] });
        
        try {
            if (!aiModelConfig || !mongoBrandId) {
                console.error('[BackgroundTask] AI Model configuration not loaded or no brand selected.');
                throw new Error("AI Model configuration not loaded or no brand selected.");
            }
            
            // Create a background task for product idea generation
            const taskPayload = {
                // Extract only the necessary fields from the product
                product: {
                    id: product.id,
                    productName: product.productName,
                    productLink: product.productLink,
                    providerName: product.providerName,
                    commissionRate: product.commissionRate,
                    notes: product.notes,
                    brandId: product.brandId,
                    productId: product.productId,
                    price: product.price,
                    salesVolume: product.salesVolume,
                    promotionLink: product.promotionLink,
                    product_description: product.product_description,
                    features: product.features,
                    use_cases: product.use_cases,
                    customer_reviews: product.customer_reviews,
                    product_rating: product.product_rating,
                    product_avatar: product.product_avatar,
                    product_image_links: product.product_image_links,
                },
                language: settings.language,
                settings: {
                    language: settings.language,
                    totalPostsPerMonth: settings.totalPostsPerMonth,
                    mediaPromptSuffix: settings.mediaPromptSuffix,
                    affiliateContentKit: settings.affiliateContentKit,
                    textGenerationModel: settings.textGenerationModel,
                    imageGenerationModel: settings.imageGenerationModel,
                    textModelFallbackOrder: settings.textModelFallbackOrder,
                    visionModels: settings.visionModels,
                    contentPillars: settings.contentPillars,
                    prompts: settings.prompts,
                    cloudinaryCloudName: settings.cloudinaryCloudName,
                    cloudinaryUploadPreset: settings.cloudinaryUploadPreset,
                }
            };

            console.log('[BackgroundTask] Creating background task for product idea generation with payload:', taskPayload);
            
            const { taskId } = await taskService.createBackgroundTask(
                'GENERATE_IDEAS_FROM_PRODUCT',
                taskPayload,
                mongoBrandId,
                'normal'
            );

            console.log('[BackgroundTask] Background task created successfully for product idea generation with ID:', taskId);

            // Notify user that the task has been started
            setSuccessMessage(settings.language === 'Việt Nam' 
                ? "Đang tạo ý tưởng từ sản phẩm trong nền..." 
                : "Generating ideas from product in the background...");

        } catch (err) {
            console.error('[BackgroundTask] Error creating background task for product idea generation:', err);
            setError(err instanceof Error ? err.message : "Failed to start product idea generation task.");
        } finally {
            setLoaderContent(null);
        }
    }, [aiModelConfig, mongoBrandId, settings, setLoaderContent, setError, setSuccessMessage, setActiveTab, dispatchAssets, handleSelectTrend]);

        const handleSuggestTrends = useCallback(async (trendType: 'industry' | 'global', timePeriod: string) => {
        console.log('[BackgroundTask] handleSuggestTrends called with:', { trendType, timePeriod });
        
        setLoaderContent({ 
            title: trendType === 'industry' 
                ? "Suggesting Industry Trends..." 
                : "Suggesting Global Trends...",
            steps: ["Analyzing current trends...", "Researching new topics...", "Finalizing suggestions..."] 
        });
        
        try {
            if (!aiModelConfig || !mongoBrandId || !generatedAssets?.brandFoundation) {
                console.error('[BackgroundTask] Missing required data for trend suggestion.');
                throw new Error("Missing required data for trend suggestion.");
            }
            
            // Create a background task for trend suggestion
            const taskPayload = {
                trendType: trendType,
                timePeriod: timePeriod,
                // Extract only the necessary fields from brandFoundation
                brandFoundation: generatedAssets.brandFoundation ? {
                    brandName: generatedAssets.brandFoundation.brandName,
                    mission: generatedAssets.brandFoundation.mission,
                    usp: generatedAssets.brandFoundation.usp,
                    targetAudience: generatedAssets.brandFoundation.targetAudience,
                    personality: generatedAssets.brandFoundation.personality,
                    values: generatedAssets.brandFoundation.values,
                    keyMessaging: generatedAssets.brandFoundation.keyMessaging,
                } : null,
                settings: {
                    language: settings.language,
                    totalPostsPerMonth: settings.totalPostsPerMonth,
                    mediaPromptSuffix: settings.mediaPromptSuffix,
                    affiliateContentKit: settings.affiliateContentKit,
                    textGenerationModel: settings.textGenerationModel,
                    imageGenerationModel: settings.imageGenerationModel,
                    textModelFallbackOrder: settings.textModelFallbackOrder,
                    visionModels: settings.visionModels,
                    contentPillars: settings.contentPillars,
                    prompts: settings.prompts,
                    cloudinaryCloudName: settings.cloudinaryCloudName,
                    cloudinaryUploadPreset: settings.cloudinaryUploadPreset,
                }
            };

            console.log('[BackgroundTask] Creating background task for trend suggestion with payload:', taskPayload);
            
            const { taskId } = await taskService.createBackgroundTask(
                trendType === 'industry' ? 'GENERATE_TRENDS' : 'GENERATE_GLOBAL_TRENDS',
                taskPayload,
                mongoBrandId,
                'normal'
            );

            console.log('[BackgroundTask] Background task created successfully for trend suggestion with ID:', taskId);

            // Notify user that the task has been started
            setSuccessMessage(settings.language === 'Việt Nam' 
                ? "Đang đề xuất xu hướng trong nền..." 
                : "Suggesting trends in the background...");

        } catch (err) {
            console.error('[BackgroundTask] Error creating background task for trend suggestion:', err);
            setError(err instanceof Error ? err.message : "Failed to start trend suggestion task.");
        } finally {
            setLoaderContent(null);
        }
    }, [aiModelConfig, mongoBrandId, settings, generatedAssets, setLoaderContent, setError, setSuccessMessage]);

    const handleSaveAffiliateLink = useCallback(async (links: Partial<AffiliateLink>[]) => {
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            try {
                const savedLinks = await saveAffiliateLinks(links as AffiliateLink[], mongoBrandId);
                dispatchAssets({ type: 'ADD_OR_UPDATE_AFFILIATE_LINKS', payload: savedLinks });
                updateAutoSaveStatus('saved');
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not save affiliate links.');
                updateAutoSaveStatus('error');
            }
        }
    }, [mongoBrandId, updateAutoSaveStatus, dispatchAssets, setError]);

    const handleDeleteAffiliateLink = useCallback((linkId: string) => {
        if (mongoBrandId) {
            deleteAffiliateLinkFromDatabase(linkId, mongoBrandId);
        }
    }, [mongoBrandId]);

    const handleImportAffiliateLinks = useCallback((links: AffiliateLink[]) => {
        dispatchAssets({ type: 'IMPORT_AFFILIATE_LINKS', payload: links });
    }, [dispatchAssets]);

    return {
        selectedTrend,
        ideasForSelectedTrend,
        handleSelectTrend,
        handleLoadStrategyHubData,
        handleLoadAffiliateVaultData,
        handleSaveTrend,
        handleDeleteTrend,
        handleGenerateIdeas,
        handleGenerateIdeasFromProduct,
        handleSuggestTrends, // Add the new function
        handleSaveAffiliateLink,
        handleDeleteAffiliateLink,
        handleImportAffiliateLinks,
    };
};