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

    const handleSetImage = useCallback(async (dataUrl: string, imageKey: string, postInfo?: PostInfo, carouselImageIndex?: number) => {
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        let baseKey = imageKey;
        
        if (postInfo) {
            // For carousel posts, include the index in the base key for uniqueness
            if (typeof carouselImageIndex === 'number') {
                baseKey = `media_plan_post_${postInfo.post.id}_${carouselImageIndex}`;
            } else {
                baseKey = `media_plan_post_${postInfo.post.id}`;
            }
        } else {
            const keyParts = imageKey.split('_');
            if (keyParts.length >= 2) {
                baseKey = `${keyParts[0]}_${keyParts[1]}`;
            }
        }
        const newImageKey = `${baseKey}_${randomSuffix}`;
        
        setGeneratedImages(prev => ({ ...prev, [newImageKey]: dataUrl }));
    
        // This action updates the local state via the reducer
        const action: AssetsAction = { type: 'UPDATE_ASSET_IMAGE', payload: { oldImageKey: imageKey, newImageKey, postInfo, carouselImageIndex } };
        dispatchAssets(action);
    
        if (postInfo && generatedAssets) {
            // Also update the viewingPost state if the modal is open
            const tempUpdatedPost = assetsReducer(generatedAssets, action).mediaPlans.find(p => p.id === postInfo.planId)?.plan[postInfo.weekIndex].posts[postInfo.postIndex];
            if (tempUpdatedPost) {
                setViewingPost({ ...postInfo, post: tempUpdatedPost });
            }
        }
        
        if (mongoBrandId && generatedAssets) {
            updateAutoSaveStatus('saving');
            try {
                const publicUrls = await uploadMediaToCloudinary({ [newImageKey]: dataUrl }, settings);
                const publicUrl = publicUrls[newImageKey];
    
                if (publicUrl) {
                    setGeneratedImages(prev => ({ ...prev, ...publicUrls }));
    
                    if (postInfo) {
                        const mediaOrder: ('image' | 'video')[] = postInfo.post.mediaOrder?.includes('image') ? postInfo.post.mediaOrder : [...(postInfo.post.mediaOrder || []), 'image'];
                        
                        // Carousel-specific logic
                        if (typeof carouselImageIndex === 'number') {
                            try {
                                // For carousel posts, we need to be extra careful about race conditions
                                // when updating the imageUrlsArray. 
                                
                                // Get the latest post data from the current state to ensure we're working with up-to-date data
                                const currentPlan = generatedAssets?.mediaPlans.find(p => p.id === postInfo.planId);
                                const currentPost = currentPlan?.plan[postInfo.weekIndex]?.posts[postInfo.postIndex];
                                
                                // Create a copy of the current imageUrlsArray or initialize an empty one
                                const currentUrls = [...(currentPost?.imageUrlsArray || postInfo.post.imageUrlsArray || [])];
                                
                                // Update the specific index with the new URL
                                currentUrls[carouselImageIndex] = publicUrl;
                                
                                // Create the updated post with the new imageUrlsArray
                                const updatedPost = { 
                                    ...postInfo.post, 
                                    imageUrlsArray: currentUrls, 
                                    mediaOrder 
                                };
                                
                                // Update the viewing post state immediately for UI responsiveness
                                setViewingPost({ ...postInfo, post: updatedPost });
                                
                                // Also update the main application state
                                dispatchAssets({ 
                                    type: 'UPDATE_POST', 
                                    payload: { 
                                        planId: postInfo.planId, 
                                        weekIndex: postInfo.weekIndex, 
                                        postIndex: postInfo.postIndex, 
                                        updates: { imageUrlsArray: currentUrls, mediaOrder } 
                                    } 
                                });
                                
                                // Update the database with the new imageUrlsArray
                                // The MongoDB handler will now properly handle individual array element updates
                                await updateMediaPlanPostInDatabase(updatedPost, mongoBrandId, settings, undefined, undefined, currentUrls);
                            } catch (error) {
                                console.error(`Failed to update carousel image at index ${carouselImageIndex}:`, error);
                                setError(`Failed to update carousel image: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                throw error; // Re-throw to be caught by the outer try-catch
                            }
    
                        } else { // Single image post logic
                            const updatedPost = { ...postInfo.post, imageKey: newImageKey, imageUrl: publicUrl, mediaOrder };
                            await updateMediaPlanPostInDatabase(updatedPost, mongoBrandId, settings, publicUrl);
                            setViewingPost({ ...postInfo, post: updatedPost });
                            
                            // Also update the main application state
                            dispatchAssets({ 
                                type: 'UPDATE_POST', 
                                payload: { 
                                    planId: postInfo.planId, 
                                    weekIndex: postInfo.weekIndex, 
                                    postIndex: postInfo.postIndex, 
                                    updates: { imageKey: newImageKey, imageUrl: publicUrl, mediaOrder } 
                                } 
                            });
                        }
    
                    } else { // Logic for non-post images (logos, etc.)
                        const updatedAssets = assetsReducer(generatedAssets, action);
                         if (updatedAssets?.coreMediaAssets.logoConcepts) {
                            const logo = updatedAssets.coreMediaAssets.logoConcepts.find((l: LogoConcept) => l.imageKey === newImageKey);
                            if (logo) {
                                logo.imageUrl = publicUrl;
                            }
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
        }, [generatedAssets, mongoBrandId, settings, updateAutoSaveStatus, dispatchAssets, setGeneratedImages, setViewingPost, setError]);

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
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const newVideoKey = `media_plan_post_video_${postInfo.post.id}_${randomSuffix}`;
        
        setGeneratedVideos(prev => ({...prev, [newVideoKey]: dataUrl}));
        
        const mediaOrder: ('image' | 'video')[] = postInfo.post.mediaOrder?.includes('video') ? postInfo.post.mediaOrder : [...(postInfo.post.mediaOrder || []), 'video'];
        const updates: Partial<MediaPlanPost> = { videoKey: newVideoKey, mediaOrder };
        
        dispatchAssets({ type: 'UPDATE_POST', payload: { planId: postInfo.planId, weekIndex: postInfo.weekIndex, postIndex: postInfo.postIndex, updates } });

        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            try {
                const publicUrls = await uploadMediaToCloudinary({ [newVideoKey]: dataUrl }, settings);
                const publicUrl = publicUrls[newVideoKey];

                if (publicUrl) {
                    await updateMediaPlanPostInDatabase({ ...postInfo.post, ...updates }, mongoBrandId, settings, undefined, publicUrl);
                    setGeneratedVideos(prev => ({ ...prev, ...publicUrls }));
                    updateAutoSaveStatus('saved');
                }
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Could not save new video.';
                setError(message);
                updateAutoSaveStatus('error');
            }
        }
    }, [mongoBrandId, settings, updateAutoSaveStatus, dispatchAssets, setGeneratedVideos, setError]);

    return {
        handleGenerateImage,
        handleSetImage,
        handleSetVideo,
    };
};