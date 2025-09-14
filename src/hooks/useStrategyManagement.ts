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
        console.log('[Generate Ideas Debug] 1. Starting generation for trend:', trend);
        setLoaderContent({ title: "Generating Viral Ideas...", steps: ["Analyzing trend...", "Brainstorming concepts...", "Finalizing ideas..."] });
        try {
            if (!aiModelConfig || !mongoBrandId) {
                throw new Error("AI Model configuration not loaded or no brand selected.");
            }
            
            console.log('[Generate Ideas Debug] 2. Calling textGenerationService.generateViralIdeas');
            const newIdeaData = await textGenerationService.generateViralIdeas(
                {
                    trend: { topic: trend.topic, keywords: trend.keywords },
                    language: settings.language,
                    useSearch: useSearch,
                    settings: settings
                },
                aiModelConfig
            );
            console.log('[Generate Ideas Debug] 3. Received raw data from AI service:', newIdeaData);

            if (!Array.isArray(newIdeaData) || newIdeaData.length === 0) {
                console.error('[Generate Ideas Debug] 4a. AI response is not a valid array or is empty.');
                throw new Error("AI failed to generate valid ideas. The response was empty or not an array.");
            }

            // Check for the specific placeholder content
            if (newIdeaData[0].title === 'title here') {
                console.error('[Generate Ideas Debug] 4b. AI returned placeholder data.');
                throw new Error("AI returned placeholder data. Please check the prompt configuration.");
            }

            const newIdeasWithTrendId: Partial<Idea>[] = newIdeaData.map(idea => ({
                ...idea,
                trendId: trend.id,
            }));
            console.log('[Generate Ideas Debug] 5. Mapped ideas with trendId:', newIdeasWithTrendId);
            
            const savedIdeas = await saveIdeasToDatabase(newIdeasWithTrendId, mongoBrandId);
            console.log('[Generate Ideas Debug] 6. Ideas saved to database:', savedIdeas);

            dispatchAssets({ type: 'ADD_IDEAS', payload: savedIdeas });
            console.log('[Generate Ideas Debug] 7. Dispatched ADD_IDEAS to reducer.');

            setIdeasForSelectedTrend(prevIdeas => [...prevIdeas, ...savedIdeas]);
            console.log('[Generate Ideas Debug] 8. Updated component state with new ideas.');

        } catch (err) {
            console.error('[Generate Ideas Debug] CRASH! An error occurred:', err);
            setError(err instanceof Error ? err.message : "Failed to generate ideas.");
        } finally {
            setLoaderContent(null);
        }
    }, [settings, mongoBrandId, aiModelConfig, setError, setLoaderContent, dispatchAssets]);
    
    const handleGenerateIdeasFromProduct = useCallback(async (product: AffiliateLink) => {
        setLoaderContent({ title: "Generating Content Ideas...", steps: ["Analyzing product...", "Brainstorming concepts...", "Finalizing ideas..."] });
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
            setLoaderContent(null);
        }
    }, [settings, mongoBrandId, generatedAssets, setActiveTab, aiModelConfig, dispatchAssets, setError, setLoaderContent, setSuccessMessage, handleSelectTrend]);

    const handleSuggestTrends = useCallback(async (trendType: 'industry' | 'global', timePeriod: string) => {
        setLoaderContent({ 
            title: trendType === 'industry' ? "Finding Industry Trends..." : "Finding Global Trends...", 
            steps: ["Analyzing trends...", "Generating insights...", "Finalizing trends..."] 
        });
        
        try {
            if (!aiModelConfig || !mongoBrandId || !generatedAssets) {
                throw new Error("AI Model configuration not loaded, no brand selected, or assets not loaded.");
            }
            
            let newTrendData: Omit<Trend, 'id' | 'brandId'>[];
            
            if (trendType === 'industry') {
                // Industry-specific trends WITH INTERNET SEARCH ENABLED
                newTrendData = await textGenerationService.suggestTrends(
                    {
                        brandFoundation: generatedAssets.brandFoundation,
                        timePeriod: timePeriod,
                        settings: settings
                    },
                    aiModelConfig
                );
            } else {
                // Global hot trends WITH INTERNET SEARCH ENABLED
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
            
            // Prepare trends with brand information for bulk save
            const trendsWithBrand = newTrendData.map(trend => ({ 
                ...trend, 
                brandId: mongoBrandId,
                industry: trendType === 'industry' ? generatedAssets.brandFoundation.brandName || 'General' : 'Global'
            }));
            
            // Save all trends at once using bulk operation
            const savedTrends = await saveTrendsToDatabase(trendsWithBrand, mongoBrandId);
            
            // Update the UI with new trends PREPENDED to existing trends
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
            setLoaderContent(null);
        }
    }, [settings, mongoBrandId, generatedAssets, aiModelConfig, dispatchAssets, setError, setLoaderContent, setSuccessMessage]);

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