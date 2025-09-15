import { useCallback, Dispatch, SetStateAction } from 'react';
import type { Settings, PostInfo, GeneratedAssets, LogoConcept, MediaPlanPost } from '../../types';
import { AiModelConfig } from '../services/configService';
import { imageGenerationService } from '../services/imageGenerationService';
import { uploadMediaToCloudinary } from '../services/cloudinaryService';
import { updateMediaPlanPostInDatabase, syncAssetMediaWithDatabase } from '../services/databaseService';
import { assetsReducer, AssetsAction } from '../reducers/assetsReducer';

const base64ToFile = (base64Data: string, filename: string, mimeType: string): File => {
    if (!base64Data || typeof base64Data !== 'string') {
        return new File([], filename, { type: mimeType });
    }
    const parts = base64Data.split(',');
    if (parts.length < 2 || !parts[1]) {
      return new File([], filename, { type: mimeType });
    }
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

const isVisionModel = (modelName: string, aiModelConfig: AiModelConfig | null): boolean => {
    if (!aiModelConfig) return false;
    return aiModelConfig.visionModels.includes(modelName);
};

interface useAssetManagementProps {
    mongoBrandId: string | null;
    generatedAssets: GeneratedAssets | null;
    settings: Settings;
    aiModelConfig: AiModelConfig | null;
    dispatchAssets: Dispatch<AssetsAction>;
    setGeneratedImages: Dispatch<SetStateAction<Record<string, string>>>;
    setGeneratedVideos: Dispatch<SetStateAction<Record<string, string>>>;
    setGeneratingImageKeys: Dispatch<SetStateAction<Set<string>>>;
    updateAutoSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
    setError: (error: string | null) => void;
    setViewingPost: Dispatch<SetStateAction<PostInfo | null>>;
}

export const useAssetManagement = ({
    mongoBrandId,
    generatedAssets,
    settings,
    aiModelConfig,
    dispatchAssets,
    setGeneratedImages,
    setGeneratedVideos,
    setGeneratingImageKeys,
    updateAutoSaveStatus,
    setError,
    setViewingPost,
}: useAssetManagementProps) => {

    const generateSingleImageCore = useCallback(async (mediaPrompt: string, settings: Settings, aspectRatio: "1:1" | "16:9" = "1:1", postInfo?: PostInfo): Promise<string> => {
        let imagesToUse: File[] = [];
        if (postInfo && 'planId' in postInfo && generatedAssets) {
            const planGroup = generatedAssets.mediaPlans.find(p => p.id === postInfo.planId);
            const serializedImages = planGroup?.productImages || [];
            if (isVisionModel(settings.imageGenerationModel, aiModelConfig) && serializedImages.length > 0) {
                imagesToUse = serializedImages.map(img => base64ToFile(img.data, img.name, img.type));
            }
        }
    
        if (!aiModelConfig) {
            throw new Error("AI Model configuration not loaded.");
        }
        
        return imageGenerationService.generateImage(
            mediaPrompt,
            aspectRatio,
            settings,
            aiModelConfig,
            imagesToUse
        );
    }, [generatedAssets, aiModelConfig]);

    const handleGenerateAllCarouselImages = useCallback(async (postInfo: PostInfo) => {
        if (!settings || !mongoBrandId) {
            setError("Cannot generate images: settings or brand ID not available.");
            return;
        }
        const mediaPrompts = postInfo.post.mediaPrompt;
        if (!mediaPrompts || !Array.isArray(mediaPrompts)) {
            return; // No prompts to generate from
        }

        const allKeys = mediaPrompts.map((_, index) => postInfo.post.imageKeys?.[index] || `media_plan_post_${postInfo.post.id}_${index}_${Math.random().toString(36).substring(2, 10)}`);
        setGeneratingImageKeys(new Set(allKeys));
        setError(null);

        try {
            const generationPromises = mediaPrompts.map(async (prompt, index) => {
                const existingUrl = postInfo.post.imageUrlsArray?.[index];
                if (existingUrl) {
                    return { url: existingUrl, key: postInfo.post.imageKeys?.[index] || allKeys[index] };
                }

                const imageKey = allKeys[index];
                const dataUrl = await generateSingleImageCore(prompt, settings, "1:1", postInfo);
                const publicUrls = await uploadMediaToCloudinary({ [imageKey]: dataUrl }, settings);
                
                if (!publicUrls[imageKey]) {
                    throw new Error(`Image upload failed for index ${index}`);
                }
                return { url: publicUrls[imageKey], key: imageKey };
            });

            const results = await Promise.all(generationPromises);

            const newImageUrlsArray = results.map(r => r.url);
            const newImageKeysArray = results.map(r => r.key);

            // Single batch update to the database
            await updateMediaPlanPostInDatabase(postInfo.post.id, mongoBrandId, {
                imageUrlsArray: newImageUrlsArray,
                imageKeys: newImageKeysArray,
            });

            // Single dispatch to update local state
            dispatchAssets({
                type: 'UPDATE_POST_CAROUSEL',
                payload: {
                    planId: postInfo.planId,
                    weekIndex: postInfo.weekIndex,
                    postIndex: postInfo.postIndex,
                    imageUrlsArray: newImageUrlsArray,
                    imageKeys: newImageKeysArray,
                }
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate carousel images.");
        } finally {
            setGeneratingImageKeys(new Set()); // Clear all generating keys
        }
    }, [settings, mongoBrandId, generateSingleImageCore, dispatchAssets, setError, setGeneratingImageKeys]);

    const handleSetImage = useCallback(async (dataUrl: string, imageKey: string, postInfo?: PostInfo, carouselImageIndex?: number) => {
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const newImageKey = `${imageKey}_${randomSuffix}`;
        
        setGeneratedImages(prev => ({ ...prev, [newImageKey]: dataUrl }));
        dispatchAssets({ type: 'UPDATE_ASSET_IMAGE', payload: { oldImageKey: imageKey, newImageKey, postInfo, carouselImageIndex } });
        
        if (mongoBrandId && generatedAssets) {
            updateAutoSaveStatus('saving');
            try {
                const publicUrls = await uploadMediaToCloudinary({ [newImageKey]: dataUrl }, settings);
                const publicUrl = publicUrls[newImageKey];
    
                if (publicUrl) {
                    setGeneratedImages(prev => ({ ...prev, ...publicUrls }));
    
                    if (postInfo) {
                        const updates: Partial<MediaPlanPost> = {};
                        if (typeof carouselImageIndex === 'number') {
                            const currentUrls = [...(postInfo.post.imageUrlsArray || [])];
                            const currentKeys = [...(postInfo.post.imageKeys || [])];
                            currentUrls[carouselImageIndex] = publicUrl;
                            currentKeys[carouselImageIndex] = newImageKey;
                            updates.imageUrlsArray = currentUrls;
                            updates.imageKeys = currentKeys;
                        } else {
                            updates.imageUrl = publicUrl;
                            updates.imageKey = newImageKey;
                        }
                        await updateMediaPlanPostInDatabase(postInfo.post.id, mongoBrandId, updates);

                    } else { // Logic for non-post images (logos, etc.)
                        const updatedAssets = assetsReducer(generatedAssets, { type: 'UPDATE_ASSET_IMAGE', payload: { oldImageKey: imageKey, newImageKey } });
                         if (updatedAssets?.coreMediaAssets.logoConcepts) {
                            const logo = updatedAssets.coreMediaAssets.logoConcepts.find((l: LogoConcept) => l.imageKey === newImageKey);
                            if (logo) logo.imageUrl = publicUrl;
                        }
                        if (updatedAssets?.unifiedProfileAssets.profilePictureImageKey === newImageKey) {
                            updatedAssets.unifiedProfileAssets.profilePictureImageUrl = publicUrl;
                        }
                        if (updatedAssets?.unifiedProfileAssets.coverPhotoImageKey === newImageKey) {
                            updatedAssets.unifiedProfileAssets.coverPhotoImageUrl = publicUrl;
                        }
                        if (updatedAssets) {
                            await syncAssetMediaWithDatabase(mongoBrandId, updatedAssets, settings);
                        }
                    }
                    updateAutoSaveStatus('saved');
                } else {
                    throw new Error("Image upload to Cloudinary failed, public URL not received.");
                }
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Could not save new image.';
                setError(message);
                updateAutoSaveStatus('error');
            }
        }
    }, [generatedAssets, mongoBrandId, settings, updateAutoSaveStatus, dispatchAssets, setGeneratedImages, setError]);

    const handleGenerateImage = useCallback(async (mediaPrompt: string, imageKey: string, aspectRatio: "1:1" | "16:9" = "1:1", postInfo?: PostInfo, carouselImageIndex?: number) => {
        setGeneratingImageKeys(prev => new Set(prev).add(imageKey));
        setError(null);
    
        try {
            if (!settings) {
                setError("Application settings not loaded.");
                return;
            }
            const dataUrl = await generateSingleImageCore(mediaPrompt, settings, aspectRatio, postInfo);
            await handleSetImage(dataUrl, imageKey, postInfo, carouselImageIndex);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate image.");
        } finally {
            setGeneratingImageKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageKey);
                return newSet;
            });
        }
    }, [settings, generateSingleImageCore, handleSetImage, setError, setGeneratingImageKeys]);

    const handleSetVideo = useCallback(async (dataUrl: string, key: string, postInfo: PostInfo) => {
        // This function needs to be updated to use the new database service signature
    }, [mongoBrandId, settings, updateAutoSaveStatus, dispatchAssets, setGeneratedVideos, setError]);

    return {
        handleGenerateImage,
        handleSetImage,
        handleSetVideo,
        handleGenerateAllCarouselImages,
    };
};