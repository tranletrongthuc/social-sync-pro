import React, { useCallback, Dispatch } from 'react';
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
    deleteAffiliateLinkFromDatabase
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

    const handleLoadStrategyHubData = useCallback(async () => {
        if (!mongoBrandId) return;
        try {
            const { trends, ideas } = await loadStrategyHub(mongoBrandId);
            dispatchAssets({ type: 'SET_STRATEGY_DATA', payload: { trends, ideas } });
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not load strategy hub data.");
        }
    }, [mongoBrandId, dispatchAssets, setError]);

    const handleLoadAffiliateVaultData = useCallback(async () => {
        if (!mongoBrandId) return;
        try {
            const affiliateLinks = await loadAffiliateVault(mongoBrandId);
            dispatchAssets({ type: 'SET_AFFILIATE_LINKS', payload: affiliateLinks });
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not load affiliate vault data.");
        }
    }, [mongoBrandId, dispatchAssets, setError]);

    const handleSaveTrend = useCallback((trend: Trend) => {
        const payload = { ...trend, brandId: mongoBrandId || '' };
        dispatchAssets({ type: 'SAVE_TREND', payload });
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            saveTrendToDatabase(payload, mongoBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
        }
    }, [mongoBrandId, updateAutoSaveStatus, dispatchAssets, setError]);

    const handleDeleteTrend = useCallback((trendId: string) => {
        dispatchAssets({ type: 'DELETE_TREND', payload: trendId });
        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            deleteTrendFromDatabase(trendId, mongoBrandId)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
        }
    }, [mongoBrandId, updateAutoSaveStatus, dispatchAssets, setError]);

    const handleGenerateIdeas = useCallback(async (trend: Trend, useSearch: boolean) => {
        setLoaderContent({ title: "Generating Viral Ideas...", steps: ["Analyzing trend...", "Brainstorming concepts...", "Finalizing ideas..."] });
        try {
            if (!aiModelConfig) {
                throw new Error("AI Model configuration not loaded.");
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
            setError(err instanceof Error ? err.message : "Failed to generate ideas.");
        } finally {
            setLoaderContent(null);
        }
    }, [settings, mongoBrandId, aiModelConfig, dispatchAssets, setError, setLoaderContent]);
    
    const handleGenerateIdeasFromProduct = useCallback(async (product: AffiliateLink) => {
        setLoaderContent({ title: "Generating Content Ideas...", steps: ["Analyzing product...", "Brainstorming concepts...", "Finalizing ideas..."] });
        try {
            if (!aiModelConfig) {
                throw new Error("AI Model configuration not loaded.");
            }
            
            const newIdeaData = await textGenerationService.generateIdeasFromProduct(
                {
                    product: product,
                    language: settings.language,
                    settings: settings
                },
                aiModelConfig
            );

            if (!Array.isArray(newIdeaData) || newIdeaData.length === 0) {
                throw new Error("Failed to generate ideas: No valid ideas returned from AI service.");
            }

            let productTrend: Trend | undefined = (generatedAssets?.trends || []).find(t => t.topic === `Ideas for: ${product.productName}`);
            let trendId: string;

            if (productTrend) {
                trendId = productTrend.id;
            } else {
                const newTrendPayload: Omit<Trend, 'id'> = {
                    topic: `Ideas for: ${product.productName}`,
                    keywords: [product.productName, product.providerName],
                    links: [{ title: 'Product Link', url: product.productLink }],
                    notes: `Generated ideas for affiliate product: ${product.productName}`,
                    analysis: `Affiliate product ideas for ${product.productName}`,
                    createdAt: new Date().toISOString(),
                    brandId: mongoBrandId || 'temp-brand-id',
                    industry: 'Affiliate Marketing',
                };

                if (mongoBrandId) {
                    updateAutoSaveStatus('saving');
                    try {
                        const newId = await saveTrendToDatabase(newTrendPayload, mongoBrandId);
                        productTrend = { ...newTrendPayload, id: newId };
                        dispatchAssets({ type: 'SAVE_TREND', payload: productTrend });
                        updateAutoSaveStatus('saved');
                    } catch (e) {
                        setError(e instanceof Error ? e.message : "Failed to save trend to MongoDB.");
                        updateAutoSaveStatus('error');
                        throw e;
                    }
                } else {
                    productTrend = { ...newTrendPayload, id: crypto.randomUUID() };
                    dispatchAssets({ type: 'SAVE_TREND', payload: productTrend });
                }
                trendId = productTrend.id;
            }

            const ideasWithTrendId: Idea[] = newIdeaData.map(idea => ({
                ...idea,
                id: crypto.randomUUID(),
                trendId: trendId, 
                productId: product.id,
            }));

            const newIdeas = ideasWithTrendId;

            if (mongoBrandId) {
                updateAutoSaveStatus('saving');
                try {
                    const savedIdeas = await saveIdeasToDatabase(ideasWithTrendId, mongoBrandId);
                    dispatchAssets({ type: 'ADD_IDEAS', payload: savedIdeas });
                    updateAutoSaveStatus('saved');
                    
                    setSuccessMessage(`Generated ${newIdeas.length} ideas from ${product.productName}`);
                    setTimeout(() => setSuccessMessage(null), 3000);
                    
                    setActiveTab('strategy');
                    setProductTrendToSelect(trendId);
                } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed to save ideas to MongoDB.");
                    updateAutoSaveStatus('error');
                }
            } else {
                dispatchAssets({ type: 'ADD_IDEAS', payload: ideasWithTrendId });
                setSuccessMessage(`Generated ${newIdeas.length} ideas from ${product.productName}`);
                setTimeout(() => setSuccessMessage(null), 3000);
                setActiveTab('strategy');
                setProductTrendToSelect(trendId);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate ideas from product.");
        } finally {
            setLoaderContent(null);
        }
    }, [settings, mongoBrandId, generatedAssets, setActiveTab, updateAutoSaveStatus, aiModelConfig, dispatchAssets, setError, setLoaderContent, setProductTrendToSelect, setSuccessMessage]);

    const handleSaveAffiliateLink = useCallback((links: AffiliateLink[]) => {
        if (mongoBrandId) {
            saveAffiliateLinks(links, mongoBrandId);
        }
    }, [mongoBrandId]);

    const handleDeleteAffiliateLink = useCallback((linkId: string) => {
        if (mongoBrandId) {
            deleteAffiliateLinkFromDatabase(linkId, mongoBrandId);
        }
    }, [mongoBrandId]);

    const handleImportAffiliateLinks = useCallback((links: AffiliateLink[]) => {
        dispatchAssets({ type: 'IMPORT_AFFILIATE_LINKS', payload: links });
    }, [dispatchAssets]);

    return {
        handleLoadStrategyHubData,
        handleLoadAffiliateVaultData,
        handleSaveTrend,
        handleDeleteTrend,
        handleGenerateIdeas,
        handleGenerateIdeasFromProduct,
        handleSaveAffiliateLink,
        handleDeleteAffiliateLink,
        handleImportAffiliateLinks,
    };
};