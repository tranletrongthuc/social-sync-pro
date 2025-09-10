import React, { useCallback } from 'react';
import {
    GeneratedAssets,
    Settings,
    MediaPlanGroup,
    Idea,
    Persona,
    AffiliateLink,
} from '../../types';
import { AiModelConfig } from '../services/configService';
import { textGenerationService } from '../services/textGenerationService';
import { saveMediaPlanGroupToDatabase as saveMediaPlanGroup } from '../services/databaseService';
import { uploadMediaToCloudinary } from '../services/cloudinaryService';

interface useMediaPlanManagementProps {
    generatedAssets: GeneratedAssets | null;
    settings: Settings;
    aiModelConfig: AiModelConfig | null;
    generatedImages: Record<string, string>;
    mongoBrandId: string | null;
    ensureMongoProject: () => Promise<string | null>;
    dispatchAssets: (action: any) => void;
    setLoaderContent: (content: { title: string; steps: string[] } | null) => void;
    setError: (error: string | null) => void;
    updateAutoSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
    setMediaPlanGroupsList: React.Dispatch<React.SetStateAction<{id: string, name: string, prompt: string, productImages?: { name: string, type: string, data: string }[]}[]>>;
    setActivePlanId: (id: string | null) => void;
    setKhongMinhSuggestions: (suggestions: Record<string, AffiliateLink[]>) => void;
    setGeneratedImages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setSuccessMessage: (message: string | null) => void;
    setActiveTab: (tab: any) => void;
}

export const useMediaPlanManagement = ({
    generatedAssets,
    settings,
    aiModelConfig,
    generatedImages,
    mongoBrandId,
    ensureMongoProject,
    dispatchAssets,
    setLoaderContent,
    setError,
    updateAutoSaveStatus,
    setMediaPlanGroupsList,
    setActivePlanId,
    setKhongMinhSuggestions,
    setGeneratedImages,
    setSuccessMessage,
    setActiveTab,
}: useMediaPlanManagementProps) => {

    const handleGenerateMediaPlanGroup = useCallback(( 
        objective: string,
        keywords: string[],
        useSearch: boolean, 
        selectedPlatforms: string[],
        options: { tone: string; style: string; length: string; includeEmojis: boolean; },
        selectedProductId: string | null, 
        personaId: string | null,
        pillar: string
    ) => {
        (async () => {
            if (!generatedAssets?.brandFoundation) {
                setError("Cannot generate plan without a Brand Foundation.");
                return;
            }

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
                
                if (!aiModelConfig) {
                    throw new Error("AI Model configuration not loaded.");
                }
                
                const newGroup = await textGenerationService.generateMediaPlanGroup(
                    {
                        brandFoundation: generatedAssets.brandFoundation!,
                        userPrompt: userPrompt,
                        language: settings.language,
                        totalPosts: totalPosts,
                        useSearch: useSearch,
                        selectedPlatforms: selectedPlatforms,
                        options: options,
                        settings: settings,
                        persona: persona,
                        selectedProduct: selectedProduct,
                        pillar: pillar
                    },
                    aiModelConfig
                );
                
                const updatedPlan = newGroup.plan.map(week => ({
                    ...week,
                    posts: week.posts.map(post => {
                        if (post.mediaPrompt) {
                            const processPrompt = (p: any) => {
                                const suffix = settings.mediaPromptSuffix || '';
                                let promptText;

                                if (typeof p === 'object' && p !== null) {
                                    promptText = JSON.stringify(p, null, 2);
                                } else {
                                    promptText = String(p);
                                }
                                
                                return suffix ? `${promptText}, ${suffix}` : promptText;
                            };

                            if (Array.isArray(post.mediaPrompt)) {
                                return {
                                    ...post,
                                    mediaPrompt: post.mediaPrompt.map(processPrompt)
                                };
                            } else {
                                return {
                                    ...post,
                                    mediaPrompt: processPrompt(post.mediaPrompt)
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
                    updateAutoSaveStatus('idle');
                    setLoaderContent(null); 
                    setError("MongoDB credentials not configured. Media plan not saved.");
                    return;
                }

                const newPublicUrls = await uploadMediaToCloudinary(generatedImages, settings);
                const allImageUrls = { ...generatedImages, ...newPublicUrls };

                const { savedPlan } = await saveMediaPlanGroup(updatedGroup, allImageUrls, brandId, settings);

                if (!savedPlan) {
                    throw new Error("Failed to save media plan group. Received no plan from server.");
                }

                dispatchAssets({ type: 'ADD_MEDIA_PLAN', payload: savedPlan });
                setMediaPlanGroupsList(prev => [...prev, { id: savedPlan.id, name: savedPlan.name, prompt: savedPlan.prompt, productImages: savedPlan.productImages }]);
                setActivePlanId(savedPlan.id);
                setKhongMinhSuggestions({});
                
                setGeneratedImages(allImageUrls); 
                updateAutoSaveStatus('saved');
                setLoaderContent(null); 

            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to generate media plan.");
                updateAutoSaveStatus('error');
                setLoaderContent(null); 
            }
        })();  
    }, [generatedAssets, settings, ensureMongoProject, generatedImages, updateAutoSaveStatus, aiModelConfig, dispatchAssets, setLoaderContent, setError, setMediaPlanGroupsList, setActivePlanId, setKhongMinhSuggestions, setGeneratedImages]);

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
            ? `Generate a full ${campaignDuration} marketing funnel campaign to promote the product "${selectedProduct.productName}".` 
            : `Generate a full ${campaignDuration} marketing funnel campaign for the general goal: "${generalGoal}".`;

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
            if (!aiModelConfig) {
                throw new Error("AI Model configuration not loaded.");
            }
            
            const newGeneratedPlan = await textGenerationService.generateMediaPlanGroup(
                {
                    brandFoundation: generatedAssets.brandFoundation,
                    userPrompt: prompt,
                    language: settings.language,
                    totalPosts: totalPosts,
                    useSearch: true,
                    selectedPlatforms: ['Facebook', 'Instagram', 'TikTok', 'YouTube'],
                    options: { tone: 'persuasive', style: 'storytelling', length: 'medium', includeEmojis: true },
                    settings: settings,
                    persona: persona,
                    selectedProduct: selectedProduct,
                    pillar: 'funnel'
                },
                aiModelConfig
            );

            const finalPlan: MediaPlanGroup = {
                ...planShell,
                prompt: prompt,
                plan: newGeneratedPlan.plan,
                name: newGeneratedPlan.name || planShell.name, 
            };
            delete (finalPlan as any).wizardData;

            dispatchAssets({ type: 'ADD_MEDIA_PLAN', payload: finalPlan });
            
            setMediaPlanGroupsList(prev => [...prev, { 
                id: finalPlan.id, 
                name: finalPlan.name, 
                prompt: finalPlan.prompt, 
                productImages: finalPlan.productImages,
                source: finalPlan.source
            }]);
            
            setActivePlanId(finalPlan.id);
            
            updateAutoSaveStatus('saving');
            const brandId = await ensureMongoProject();
            if (brandId) {
                const newPublicUrls = await uploadMediaToCloudinary(generatedImages, settings);
                const allImageUrls = { ...generatedImages, ...newPublicUrls };
                
                await saveMediaPlanGroup(finalPlan, allImageUrls, brandId, settings);
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
            setError(err instanceof Error ? err.message : "Failed to create funnel campaign plan.");
            updateAutoSaveStatus('error');
        } finally {
            setLoaderContent(null);
        }
    }, [generatedAssets, settings, ensureMongoProject, generatedImages, updateAutoSaveStatus, aiModelConfig, dispatchAssets, setLoaderContent, setError, setMediaPlanGroupsList, setActivePlanId, setSuccessMessage]);

    const handleGenerateContentPackage = useCallback(async ( 
        idea: Idea,
        personaId: string | null,
        selectedProductId: string | null,
        options: { tone: string; style: string; length: string; includeEmojis: boolean; }
    ) => {
        if (!generatedAssets?.brandFoundation) {
            setError("Cannot generate content package without a Brand Foundation.");
            return;
        }

        let selectedProduct = null;
        if (selectedProductId && generatedAssets.affiliateLinks) {
            selectedProduct = generatedAssets.affiliateLinks.find(link => link.id === selectedProductId) ?? null;
        } else if (idea.productId && generatedAssets.affiliateLinks) {
            selectedProduct = generatedAssets.affiliateLinks.find(link => link.id === idea.productId) ?? null;
        }
        
        if (selectedProduct && !selectedProduct.id) {
            selectedProduct = null;
        }
        
        setLoaderContent({
            title: settings.language === 'Việt Nam' ? "Đang tạo Gói Nội Dung..." : "Generating Content Package...",
            steps: [
                "Crafting pillar content...",
                "Generating image prompts...",
                "Finalizing content package..."
            ]
        });

        try {
            if (!aiModelConfig) {
                throw new Error("AI Model configuration not loaded.");
            }
            
            const newPackage = await textGenerationService.generateContentPackage(
                {
                    idea: idea,
                    brandFoundation: generatedAssets.brandFoundation,
                    language: settings.language,
                    settings: settings,
                    persona: personaId ? (generatedAssets.personas || []).find(p => p.id === personaId) ?? null : null,
                    pillarPlatform: 'YouTube',
                    options: options,
                    selectedProduct: selectedProduct,
                    repurposedPlatforms: ['Facebook', 'Instagram', 'TikTok', 'Pinterest'] // Added missing property
                },
                aiModelConfig
            );

            updateAutoSaveStatus('saving');
            const brandId = await ensureMongoProject();
            if (!brandId) {
                updateAutoSaveStatus('idle');
                setLoaderContent(null);
                setError("MongoDB credentials not configured. Content package not saved.");
                return;
            }

            const newPublicUrls = await uploadMediaToCloudinary(generatedImages, settings);
            const allImageUrls = { ...generatedImages, ...newPublicUrls };

            const { savedPlan } = await saveMediaPlanGroup(newPackage, allImageUrls, brandId, settings);

            if (!savedPlan) {
                throw new Error("Failed to save content package. Received no plan from server.");
            }

            const finalPlan = savedPlan;
            updateAutoSaveStatus('saved');
            setSuccessMessage(`Successfully created and saved content package: ${finalPlan.name}`);
            setTimeout(() => setSuccessMessage(null), 4000);

            dispatchAssets({ type: 'ADD_CONTENT_PACKAGE', payload: finalPlan });
            setMediaPlanGroupsList(prev => [...prev, { id: finalPlan.id, name: finalPlan.name, prompt: finalPlan.prompt, productImages: finalPlan.productImages, source: finalPlan.source }]);
            setActivePlanId(finalPlan.id);
            setActiveTab('mediaPlan');

            if (mongoBrandId) {
                const newPublicUrls = await uploadMediaToCloudinary(generatedImages, settings);
                const allImageUrls = { ...generatedImages, ...newPublicUrls };
                setGeneratedImages(allImageUrls);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate content package.");
            
            if (mongoBrandId) {
                updateAutoSaveStatus('error');
            }
        } finally {
            setLoaderContent(null);
        }
    }, [generatedAssets, settings, mongoBrandId, updateAutoSaveStatus, setLoaderContent, setError, setSuccessMessage, dispatchAssets, setMediaPlanGroupsList, setActivePlanId, setActiveTab, generatedImages, aiModelConfig]);

    return {
        handleGenerateMediaPlanGroup,
        handleCreateFunnelCampaignPlan,
        handleGenerateContentPackage,
    };
};