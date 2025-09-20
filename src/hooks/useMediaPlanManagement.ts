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
import { taskService } from '../services/taskService';

interface useMediaPlanManagementProps {
    generatedAssets: GeneratedAssets | null;
    settings: Settings;
    adminSettings: Settings | null;
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
    adminSettings,
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
            console.log('[BackgroundTask] handleGenerateMediaPlanGroup called with:', {
                objective,
                keywords,
                useSearch,
                selectedPlatforms,
                options,
                selectedProductId,
                personaId,
                pillar
            });
            
            if (!generatedAssets?.brandFoundation || !adminSettings) {
                console.error('[BackgroundTask] Cannot generate plan without Brand Foundation or Admin Settings');
                setError("Cannot generate plan without a Brand Foundation or Admin Settings.");
                return;
            }

            try {
                // Create a background task for media plan generation
                // Only send the necessary data instead of the entire generatedAssets object
                const taskPayload = {
                    objective,
                    keywords,
                    useSearch,
                    selectedPlatforms,
                    generationOptions: {
                        tone: options.tone,
                        style: options.style,
                        length: options.length,
                        includeEmojis: options.includeEmojis,
                    },
                    selectedProductId,
                    personaId,
                    pillar,
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
                    language: settings.language,
                    totalPosts: settings.totalPostsPerMonth,
                    // Extract only the necessary fields from settings
                    brandSettings: {
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
                    },
                    // Extract only the necessary fields from adminSettings
                    adminSettings: adminSettings ? {
                        language: adminSettings.language,
                        totalPostsPerMonth: adminSettings.totalPostsPerMonth,
                        mediaPromptSuffix: adminSettings.mediaPromptSuffix,
                        affiliateContentKit: adminSettings.affiliateContentKit,
                        textGenerationModel: adminSettings.textGenerationModel,
                        imageGenerationModel: adminSettings.imageGenerationModel,
                        textModelFallbackOrder: adminSettings.textModelFallbackOrder,
                        visionModels: adminSettings.visionModels,
                        contentPillars: adminSettings.contentPillars,
                        prompts: adminSettings.prompts,
                    } : null,
                };

                console.log('[BackgroundTask] Creating background task with payload:', taskPayload);
                
                const { taskId } = await taskService.createBackgroundTask(
                    'GENERATE_MEDIA_PLAN',
                    taskPayload,
                    mongoBrandId || '',
                    'normal'
                );

                console.log('[BackgroundTask] Background task created successfully with ID:', taskId);

                // Notify user that the task has been started
                setSuccessMessage(settings?.language === 'Việt Nam' 
                    ? "Đang tạo kế hoạch truyền thông trong nền..." 
                    : "Generating media plan in the background...");
                
                // Close the modal
                setLoaderContent(null);
                
                // In a real implementation, you would add the taskId to a global task tracking system
                console.log(`[BackgroundTask] Media plan generation task started with ID: ${taskId}`);
            } catch (err) {
                console.error('[BackgroundTask] Error creating background task:', err);
                setError(err instanceof Error ? err.message : "Failed to start media plan generation task.");
                setLoaderContent(null);
            }
        })();  
    }, [generatedAssets, settings, adminSettings, mongoBrandId, setLoaderContent, setError, setSuccessMessage]);

    const handleCreateFunnelCampaignPlan = useCallback(async (planShell: MediaPlanGroup & { wizardData?: any }) => {
        if (!generatedAssets?.brandFoundation || !adminSettings) {
            setError("Cannot generate plan without a Brand Foundation or Admin Settings.");
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

        try {
            // Create a background task for funnel campaign generation
            const taskPayload = {
                planName: planShell.name,
                wizardData,
                brandFoundation: {
                    brandName: generatedAssets.brandFoundation.brandName,
                    mission: generatedAssets.brandFoundation.mission,
                    usp: generatedAssets.brandFoundation.usp,
                    targetAudience: generatedAssets.brandFoundation.targetAudience,
                    personality: generatedAssets.brandFoundation.personality,
                    values: generatedAssets.brandFoundation.values,
                    keyMessaging: generatedAssets.brandFoundation.keyMessaging,
                },
                language: settings.language,
                totalPosts: totalPosts,
                useSearch: true,
                selectedPlatforms: ['Facebook', 'Instagram', 'TikTok', 'YouTube'],
                options: { tone: 'persuasive', style: 'storytelling', length: 'medium', includeEmojis: true },
                brandSettings: {
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
                },
                adminSettings: adminSettings ? {
                    language: adminSettings.language,
                    totalPostsPerMonth: adminSettings.totalPostsPerMonth,
                    mediaPromptSuffix: adminSettings.mediaPromptSuffix,
                    affiliateContentKit: adminSettings.affiliateContentKit,
                    textGenerationModel: adminSettings.textGenerationModel,
                    imageGenerationModel: adminSettings.imageGenerationModel,
                    textModelFallbackOrder: adminSettings.textModelFallbackOrder,
                    visionModels: adminSettings.visionModels,
                    contentPillars: adminSettings.contentPillars,
                    prompts: adminSettings.prompts,
                } : null,
                personaId: persona?.id ?? null,
                selectedProductId: selectedProduct?.id ?? null,
                pillar: 'funnel'
            };

            const { taskId } = await taskService.createBackgroundTask(
                'GENERATE_FUNNEL_CAMPAIGN',
                taskPayload,
                mongoBrandId || '',
                'normal'
            );

            // Notify user that the task has been started
            setSuccessMessage("Generating funnel campaign in the background...");
            
            // Close the modal
            setLoaderContent(null);
            
            // In a real implementation, you would add the taskId to a global task tracking system
            console.log(`Funnel campaign generation task started with ID: ${taskId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to start funnel campaign generation task.");
            setLoaderContent(null);
        }
    }, [generatedAssets, settings, adminSettings, mongoBrandId, setLoaderContent, setError, setSuccessMessage]);

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
        
        try {
            // Create a background task for content package generation
            const taskPayload = {
                idea,
                brandFoundation: {
                    brandName: generatedAssets.brandFoundation.brandName,
                    mission: generatedAssets.brandFoundation.mission,
                    usp: generatedAssets.brandFoundation.usp,
                    targetAudience: generatedAssets.brandFoundation.targetAudience,
                    personality: generatedAssets.brandFoundation.personality,
                    values: generatedAssets.brandFoundation.values,
                    keyMessaging: generatedAssets.brandFoundation.keyMessaging,
                },
                language: settings.language,
                brandSettings: {
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
                },
                personaId: personaId,
                pillarPlatform: 'YouTube',
                options: options,
                selectedProductId: selectedProduct?.id ?? null,
                repurposedPlatforms: ['Facebook', 'Instagram', 'TikTok', 'Pinterest']
            };

            const { taskId } = await taskService.createBackgroundTask(
                'GENERATE_CONTENT_PACKAGE',
                taskPayload,
                mongoBrandId || '',
                'normal'
            );

            // Notify user that the task has been started
            setSuccessMessage(settings.language === 'Việt Nam' 
                ? "Đang tạo Gói Nội Dung trong nền..." 
                : "Generating Content Package in the background...");
            
            // Close the modal
            setLoaderContent(null);
            
            // In a real implementation, you would add the taskId to a global task tracking system
            console.log(`Content package generation task started with ID: ${taskId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to start content package generation task.");
            setLoaderContent(null);
        }
    }, [generatedAssets, settings, mongoBrandId, setLoaderContent, setError, setSuccessMessage]);

    return {
        handleGenerateMediaPlanGroup,
        handleCreateFunnelCampaignPlan,
        handleGenerateContentPackage,
    };
};