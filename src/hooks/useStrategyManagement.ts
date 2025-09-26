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
    saveTrendsToDatabase
} from '../services/databaseService';
import { textGenerationService } from '../services/textGenerationService';
import { AiModelConfig } from '../services/configService';
import { ActiveTab } from '../components/Header';
import { taskService } from '../services/taskService';
import { dataCache } from '../services/databaseService';

interface useStrategyManagementProps {
    mongoBrandId: string | null;
    dispatchAssets: Dispatch<any>;
    setError: Dispatch<React.SetStateAction<string | null>>;
    updateAutoSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
    settings: Settings;
    aiModelConfig: AiModelConfig | null;
    generatedAssets: GeneratedAssets | null;
    setActiveTab: (tab: ActiveTab) => void;
    setProductTrendToSelect: Dispatch<React.SetStateAction<string | null>>;
    setSuccessMessage: (message: string | null) => void;
    onTaskCreated?: () => void;
}

export const useStrategyManagement = ({
    mongoBrandId,
    dispatchAssets,
    setError,
    updateAutoSaveStatus,
    settings,
    aiModelConfig,
    generatedAssets,
    setActiveTab,
    setProductTrendToSelect,
    setSuccessMessage,
    onTaskCreated
}: useStrategyManagementProps) => {
    const [isSelectingTrend, setIsSelectingTrend] = useState(false);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [generatingIdeasForProductId, setGeneratingIdeasForProductId] = useState<string | null>(null);
    const [isSuggestingTrends, setIsSuggestingTrends] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
    const [ideasForSelectedTrend, setIdeasForSelectedTrend] = useState<Idea[]>([]);
    const [isStrategyHubLoading, setIsStrategyHubLoading] = useState(false);
    const [isAffiliateVaultLoading, setIsAffiliateVaultLoading] = useState(false);
    const isStrategyHubLoaded = useRef(false);
    const isAffiliateVaultLoaded = useRef(false);

    const handleSelectTrend = useCallback(async (trend: Trend) => {
        if (!mongoBrandId || selectedTrend?.id === trend.id) return;
        setSelectedTrend(trend);
        setIdeasForSelectedTrend([]);
        setIsSelectingTrend(true);
        try {
            const newIdeas = await loadIdeasForTrendFromDatabase(trend.id, mongoBrandId);
            setIdeasForSelectedTrend(newIdeas);
            dispatchAssets({ type: 'ADD_IDEAS', payload: newIdeas });
        } catch (error) {
            setError(error instanceof Error ? error.message : `Could not load ideas for trend ${trend.topic}.`);
            setIdeasForSelectedTrend([]);
        } finally {
            setIsSelectingTrend(false);
        }
    }, [mongoBrandId, setError, selectedTrend]);

    const handleLoadStrategyHubData = useCallback(async () => {
        if (!mongoBrandId || isStrategyHubLoaded.current || isStrategyHubLoading) return;
        isStrategyHubLoaded.current = true;
        setIsStrategyHubLoading(true);
        setIsSelectingTrend(true); // Use this for initial load of the tab
        try {
            const { trends } = await loadStrategyHub(mongoBrandId);
            dispatchAssets({ type: 'SET_STRATEGY_DATA', payload: { trends, ideas: [] } });
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not load strategy hub data.");
        } finally {
            setIsSelectingTrend(false);
            setIsStrategyHubLoading(false);
        }
    }, [mongoBrandId, isStrategyHubLoading, dispatchAssets, setError]);
    
    const handleRefreshStrategyHubData = useCallback(async () => {
        if (!mongoBrandId || isStrategyHubLoading) return;
        setIsStrategyHubLoading(true);
        setIsSelectingTrend(true); // Use this for refresh
        try {
            // Clear cache to force a fresh database fetch
            const cacheKey = `strategy-hub-${mongoBrandId}`;
            delete dataCache[cacheKey];
            
            const { trends } = await loadStrategyHub(mongoBrandId);
            dispatchAssets({ type: 'SET_STRATEGY_DATA', payload: { trends, ideas: [] } });
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not load strategy hub data.");
        } finally {
            setIsSelectingTrend(false);
            setIsStrategyHubLoading(false);
        }
    }, [mongoBrandId, isStrategyHubLoading, dispatchAssets, setError]);

    const handleLoadAffiliateVaultData = useCallback(async () => {
        if (!mongoBrandId || isAffiliateVaultLoaded.current || isAffiliateVaultLoading) return;
        isAffiliateVaultLoaded.current = true;
        setIsAffiliateVaultLoading(true);
        setIsSaving(true); // Use general saving for this tab load
        try {
            const affiliateLinks = await loadAffiliateVault(mongoBrandId);
            dispatchAssets({ type: 'SET_AFFILIATE_LINKS', payload: affiliateLinks });
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not load affiliate vault data.");
        } finally {
            setIsSaving(false);
            setIsAffiliateVaultLoading(false);
        }
    }, [mongoBrandId, isAffiliateVaultLoading, dispatchAssets, setError]);
    
    const handleRefreshAffiliateVaultData = useCallback(async () => {
        if (!mongoBrandId || isAffiliateVaultLoading) return;
        setIsAffiliateVaultLoading(true);
        setIsSaving(true); // Use general saving for this tab load
        try {
            // Clear cache to force a fresh database fetch
            const cacheKey = `affiliate-vault-${mongoBrandId}`;
            delete dataCache[cacheKey];
            
            const affiliateLinks = await loadAffiliateVault(mongoBrandId);
            dispatchAssets({ type: 'SET_AFFILIATE_LINKS', payload: affiliateLinks });
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not load affiliate vault data.");
        } finally {
            setIsSaving(false);
            setIsAffiliateVaultLoading(false);
        }
    }, [mongoBrandId, isAffiliateVaultLoading, dispatchAssets, setError]);

    const handleSaveTrend = useCallback(async (trend: Omit<Trend, 'id' | 'brandId'> & { id?: string }) => {
        if (!mongoBrandId) {
            setError("Cannot save trend: No brand selected.");
            return;
        }
        updateAutoSaveStatus('saving');
        setIsSaving(true);
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
        } finally {
            setIsSaving(false);
        }
    }, [mongoBrandId, updateAutoSaveStatus, dispatchAssets, setError, handleSelectTrend]);

    const handleDeleteTrend = useCallback(async (trendId: string) => {
        if (!mongoBrandId) return;
        dispatchAssets({ type: 'DELETE_TREND', payload: trendId });
        updateAutoSaveStatus('saving');
        setIsSaving(true);
        try {
            await deleteTrendFromDatabase(trendId, mongoBrandId);
            updateAutoSaveStatus('saved');
            if (selectedTrend?.id === trendId) {
                setSelectedTrend(null);
                setIdeasForSelectedTrend([]);
            }
        } catch (e) {
            setError(e.message);
            updateAutoSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    }, [mongoBrandId, updateAutoSaveStatus, dispatchAssets, setError, selectedTrend]);

    const handleGenerateIdeas = useCallback(async (trend: Trend, useSearch: boolean) => {
        console.log('[BackgroundTask] handleGenerateIdeas called with:', { trend, useSearch });
        
        setIsGeneratingIdeas(true);
        
        try {
            if (!aiModelConfig || !mongoBrandId) {
                console.error('[BackgroundTask] AI Model configuration not loaded or no brand selected.');
                throw new Error("AI Model configuration not loaded or no brand selected.");
            }
            
            // Create a background task for idea generation
            const taskPayload = {
                trend: { id: trend.id, topic: trend.topic, keywords: trend.keywords },
                language: settings.language,
                useSearch: useSearch,
                modelUsed: settings.textGenerationModel, // Include the model used
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
            onTaskCreated?.();
        } catch (err) {
            console.error('[BackgroundTask] Error creating background task for idea generation:', err);
            setError(err instanceof Error ? err.message : "Failed to start idea generation task.");
        } finally {
            setIsGeneratingIdeas(false);
        }
    }, [aiModelConfig, mongoBrandId, settings, setError, setSuccessMessage]);
    
    const handleGenerateIdeasFromProduct = useCallback(async (product: AffiliateLink) => {
        console.log('[BackgroundTask] handleGenerateIdeasFromProduct called with:', { product });
        
        setGeneratingIdeasForProductId(product.id);
        
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
                modelUsed: settings.textGenerationModel, // Include the model used
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
            onTaskCreated?.();

        } catch (err) {
            console.error('[BackgroundTask] Error creating background task for product idea generation:', err);
            setError(err instanceof Error ? err.message : "Failed to start product idea generation task.");
        } finally {
            setGeneratingIdeasForProductId(null);
        }
    }, [aiModelConfig, mongoBrandId, settings, setError, setSuccessMessage, setActiveTab, dispatchAssets, handleSelectTrend]);

        const handleSuggestTrends = useCallback(async (trendType: 'industry' | 'global', timePeriod: string) => {
        console.log('[BackgroundTask] handleSuggestTrends called with:', { trendType, timePeriod });
        
        setIsSuggestingTrends(true);
        
        try {
            if (!aiModelConfig || !mongoBrandId || !generatedAssets?.brandFoundation) {
                console.error('[BackgroundTask] Missing required data for trend suggestion.');
                throw new Error("Missing required data for trend suggestion.");
            }
            
            // Create a background task for trend suggestion
            const taskPayload = {
                trendType: trendType,
                timePeriod: timePeriod,
                modelUsed: settings.textGenerationModel, // Include the model used
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
            onTaskCreated?.();

        } catch (err) {
            console.error('[BackgroundTask] Error creating background task for trend suggestion:', err);
            setError(err instanceof Error ? err.message : "Failed to start trend suggestion task.");
        } finally {
            setIsSuggestingTrends(false);
        }
    }, [aiModelConfig, mongoBrandId, settings, generatedAssets, setError, setSuccessMessage]);

    const handleSaveAffiliateLink = useCallback(async (links: Partial<AffiliateLink>[]) => {
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            setIsSaving(true);
            try {
                const savedLinks = await saveAffiliateLinks(links as AffiliateLink[], mongoBrandId);
                dispatchAssets({ type: 'ADD_OR_UPDATE_AFFILIATE_LINKS', payload: savedLinks });
                updateAutoSaveStatus('saved');
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not save affiliate links.');
                updateAutoSaveStatus('error');
            } finally {
                setIsSaving(false);
            }
        }
    }, [mongoBrandId, updateAutoSaveStatus, dispatchAssets, setError]);

    const handleDeleteAffiliateLink = useCallback(async (linkId: string) => {
        if (mongoBrandId) {
            setIsSaving(true);
            try {
                await deleteAffiliateLinkFromDatabase(linkId, mongoBrandId);
            } catch (e) {
                setError(e.message);
            } finally {
                setIsSaving(false);
            }
        }
    }, [mongoBrandId, setError]);

    const handleImportAffiliateLinks = useCallback(async (links: Partial<AffiliateLink>[]) => {
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            setIsSaving(true);
            try {
                const savedLinks = await saveAffiliateLinks(links as AffiliateLink[], mongoBrandId);
                dispatchAssets({ type: 'ADD_OR_UPDATE_AFFILIATE_LINKS', payload: savedLinks });
                setSuccessMessage(`${savedLinks.length} links imported successfully.`);
                updateAutoSaveStatus('saved');
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not import affiliate links.');
                updateAutoSaveStatus('error');
            } finally {
                setIsSaving(false);
            }
        }
    }, [mongoBrandId, updateAutoSaveStatus, dispatchAssets, setError, setSuccessMessage]);

    return {
        isSelectingTrend,
        isGeneratingIdeas,
        generatingIdeasForProductId,
        isSuggestingTrends,
        isSaving,
        selectedTrend,
        ideasForSelectedTrend,
        handleSelectTrend,
        handleLoadStrategyHubData,
        handleRefreshStrategyHubData,
        handleLoadAffiliateVaultData,
        handleRefreshAffiliateVaultData,
        handleSaveTrend,
        handleDeleteTrend,
        handleGenerateIdeas,
        handleGenerateIdeasFromProduct,
        handleSuggestTrends,
        handleSaveAffiliateLink,
        handleDeleteAffiliateLink,
        handleImportAffiliateLinks,
    };
};