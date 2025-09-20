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
    setSuccessMessage
}: useStrategyManagementProps) => {
    const [isSelectingTrend, setIsSelectingTrend] = useState(false);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [generatingIdeasForProductId, setGeneratingIdeasForProductId] = useState<string | null>(null);
    const [isSuggestingTrends, setIsSuggestingTrends] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
    const [ideasForSelectedTrend, setIdeasForSelectedTrend] = useState<Idea[]>([]);
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
        } catch (error) {
            setError(error instanceof Error ? error.message : `Could not load ideas for trend ${trend.topic}.`);
            setIdeasForSelectedTrend([]);
        } finally {
            setIsSelectingTrend(false);
        }
    }, [mongoBrandId, setError, selectedTrend]);

    const handleLoadStrategyHubData = useCallback(async () => {
        if (!mongoBrandId || isStrategyHubLoaded.current) return;
        isStrategyHubLoaded.current = true;
        setIsSelectingTrend(true); // Use this for initial load of the tab
        try {
            const { trends } = await loadStrategyHub(mongoBrandId);
            dispatchAssets({ type: 'SET_STRATEGY_DATA', payload: { trends, ideas: [] } });
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not load strategy hub data.");
        } finally {
            setIsSelectingTrend(false);
        }
    }, [mongoBrandId, dispatchAssets, setError]);

    const handleLoadAffiliateVaultData = useCallback(async () => {
        if (!mongoBrandId || isAffiliateVaultLoaded.current) return;
        isAffiliateVaultLoaded.current = true;
        setIsSaving(true); // Use general saving for this tab load
        try {
            const affiliateLinks = await loadAffiliateVault(mongoBrandId);
            dispatchAssets({ type: 'SET_AFFILIATE_LINKS', payload: affiliateLinks });
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not load affiliate vault data.");
        } finally {
            setIsSaving(false);
        }
    }, [mongoBrandId, dispatchAssets, setError]);

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
        setIsGeneratingIdeas(true);
        try {
            if (!aiModelConfig || !mongoBrandId) {
                throw new Error("AI Model configuration not loaded or no brand selected.");
            }
            
            const newIdeaData = await textGenerationService.generateViralIdeas(
                {
                    trend: { topic: trend.topic, keywords: trend.keywords },
                    language: settings.language,
                    useSearch: useSearch,
                    settings: settings
                },
                aiModelConfig
            );

            if (!Array.isArray(newIdeaData) || newIdeaData.length === 0) {
                throw new Error("AI failed to generate valid ideas. The response was empty or not an array.");
            }

            if (newIdeaData[0].title === 'title here') {
                throw new Error("AI returned placeholder data. Please check the prompt configuration.");
            }

            const newIdeasWithTrendId: Partial<Idea>[] = newIdeaData.map(idea => ({
                ...idea,
                trendId: trend.id,
            }));
            
            const savedIdeas = await saveIdeasToDatabase(newIdeasWithTrendId, mongoBrandId);

            dispatchAssets({ type: 'ADD_IDEAS', payload: savedIdeas });

            setIdeasForSelectedTrend(prevIdeas => [...prevIdeas, ...savedIdeas]);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate ideas.");
        } finally {
            setIsGeneratingIdeas(false);
        }
    }, [settings, mongoBrandId, aiModelConfig, setError, dispatchAssets]);
    
    const handleGenerateIdeasFromProduct = useCallback(async (product: AffiliateLink) => {
        setGeneratingIdeasForProductId(product.id);
        try {
            if (!aiModelConfig || !mongoBrandId) {
                throw new Error("AI Model configuration not loaded or no brand selected.");
            }
            
            const newIdeaData = await textGenerationService.generateIdeasFromProduct(
                {
                    product: product,
                    language: settings.language,
                    settings: settings
                },
                aiModelConfig
            );

            if (!Array.isArray(newIdeaData) || newIdeaData.length === 0 || !newIdeaData[0].title) {
                throw new Error("Failed to generate ideas: No valid ideas returned from AI service.");
            }

            let productTrend: Trend | undefined = (generatedAssets?.trends || []).find(t => t.topic === `Ideas for: ${product.productName}`);
            
            if (!productTrend) {
                const newTrendPayload: Omit<Trend, 'id'> = {
                    topic: `Ideas for: ${product.productName}`,
                    keywords: [product.productName, product.providerName],
                    links: [{ title: 'Product Link', url: product.productLink }],
                    notes: `Generated ideas for affiliate product: ${product.productName}`,
                    analysis: `Affiliate product ideas for ${product.productName}`,
                    createdAt: new Date().toISOString(),
                    brandId: mongoBrandId,
                    industry: 'Affiliate Marketing',
                };
                const newId = await saveTrendToDatabase(newTrendPayload, mongoBrandId);
                productTrend = { ...newTrendPayload, id: newId };
                dispatchAssets({ type: 'SAVE_TREND', payload: productTrend });
            }
            
            const finalTrend = productTrend;
            const ideasWithTrendId: Partial<Idea>[] = newIdeaData.map(idea => ({
                ...idea,
                trendId: finalTrend.id, 
                productId: product.id,
            }));

            const savedIdeas = await saveIdeasToDatabase(ideasWithTrendId, mongoBrandId);
            
            setSuccessMessage(`Generated ${savedIdeas.length} ideas from ${product.productName}`);
            setActiveTab('strategy');
            dispatchAssets({ type: 'ADD_IDEAS', payload: savedIdeas });
            handleSelectTrend(finalTrend);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate ideas from product.");
        } finally {
            setGeneratingIdeasForProductId(null);
        }
    }, [settings, mongoBrandId, generatedAssets, setActiveTab, aiModelConfig, dispatchAssets, setError, setSuccessMessage, handleSelectTrend]);

    const handleSuggestTrends = useCallback(async (trendType: 'industry' | 'global', timePeriod: string) => {
        setIsSuggestingTrends(true);
        try {
            if (!aiModelConfig || !mongoBrandId || !generatedAssets) {
                throw new Error("AI Model configuration not loaded, no brand selected, or assets not loaded.");
            }
            
            let newTrendData: Omit<Trend, 'id' | 'brandId'>[];
            
            if (trendType === 'industry') {
                newTrendData = await textGenerationService.suggestTrends(
                    {
                        brandFoundation: generatedAssets.brandFoundation,
                        timePeriod: timePeriod,
                        settings: settings
                    },
                    aiModelConfig
                );
            } else {
                newTrendData = await textGenerationService.suggestGlobalTrends(
                    {
                        timePeriod: timePeriod,
                        settings: settings
                    },
                    aiModelConfig
                );
            }
            
            if (!Array.isArray(newTrendData) || newTrendData.length === 0) {
                throw new Error("AI failed to generate valid trends. The response was empty or not an array.");
            }
            
            const trendsWithBrand = newTrendData.map(trend => ({ 
                ...trend, 
                brandId: mongoBrandId,
                industry: trendType === 'industry' ? generatedAssets.brandFoundation.brandName || 'General' : 'Global'
            }));
            
            const savedTrends = await saveTrendsToDatabase(trendsWithBrand, mongoBrandId);
            
            dispatchAssets({ 
                type: 'SET_STRATEGY_DATA', 
                payload: { 
                    trends: [...savedTrends, ...(generatedAssets?.trends || [])], 
                    ideas: [] 
                } 
            });
            
            setSuccessMessage(`Generated ${savedTrends.length} ${trendType} trends`);
        } catch (err) {
            console.error('Error in handleSuggestTrends:', err);
            setError(err instanceof Error ? err.message : "Failed to suggest trends.");
        } finally {
            setIsSuggestingTrends(false);
        }
    }, [settings, mongoBrandId, generatedAssets, aiModelConfig, dispatchAssets, setError, setSuccessMessage]);

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
        handleLoadAffiliateVaultData,
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