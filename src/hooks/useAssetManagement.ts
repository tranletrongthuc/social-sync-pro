import { useCallback, Dispatch, SetStateAction } from 'react';
import type { Settings, PostInfo, GeneratedAssets, LogoConcept, MediaPlanPost } from '../../types';
import { AiModelConfig } from '../services/configService';
import { taskService } from '../services/taskService';
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
    onTaskCreated: () => void;
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
    onTaskCreated,
}: useAssetManagementProps) => {

    const handleGenerateImage = useCallback(async (mediaPrompt: string, imageKey: string, aspectRatio: "1:1" | "16:9" = "1:1", postInfo?: PostInfo, carouselImageIndex?: number) => {
        if (!mongoBrandId) {
            setError("Cannot generate image: brand ID not available.");
            return;
        }
        setGeneratingImageKeys(prev => new Set(prev).add(imageKey));
        setError(null);
    
        try {
            const payload = {
                mediaPrompt,
                imageKey,
                aspectRatio,
                settings,
                postInfo,
                carouselImageIndex,
            };
            await taskService.createBackgroundTask('GENERATE_IMAGE', payload, mongoBrandId);
            onTaskCreated();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create image generation task.");
            setGeneratingImageKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageKey);
                return newSet;
            });
        }
    }, [mongoBrandId, settings, setError, setGeneratingImageKeys, onTaskCreated]);

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
            const generationPromises = mediaPrompts.map((prompt, index) => {
                const imageKey = allKeys[index];
                const payload = {
                    mediaPrompt: prompt,
                    imageKey,
                    aspectRatio: "1:1",
                    postInfo,
                    carouselImageIndex: index,
                };
                return taskService.createBackgroundTask('GENERATE_IMAGE', payload, mongoBrandId);
            });

            await Promise.all(generationPromises);
            onTaskCreated();

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create carousel image generation tasks.");
        } finally {
            // The generating keys will be cleared by the task system once tasks are complete
        }
    }, [settings, mongoBrandId, setError, setGeneratingImageKeys, onTaskCreated]);

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
                            
                            dispatchAssets({
                                type: 'UPDATE_POST_CAROUSEL',
                                payload: {
                                    planId: postInfo.planId,
                                    weekIndex: postInfo.weekIndex,
                                    postIndex: postInfo.postIndex,
                                    imageUrlsArray: currentUrls,
                                    imageKeys: currentKeys,
                                }
                            });
                        } else {
                            updates.imageUrl = publicUrl;
                            updates.imageKey = newImageKey;
                            
                            dispatchAssets({
                                type: 'UPDATE_POST',
                                payload: {
                                    planId: postInfo.planId,
                                    weekIndex: postInfo.weekIndex,
                                    postIndex: postInfo.postIndex,
                                    updates: { imageUrl: publicUrl, imageKey: newImageKey }
                                }
                            });
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
