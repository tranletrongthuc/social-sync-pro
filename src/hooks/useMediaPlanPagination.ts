import { useCallback } from 'react';
import { MediaPlanPost, PostInfo } from '../types';
import { loadMediaPlanPostsWithPagination } from '../services/databaseService';

/**
 * Hook to handle loading additional pages of posts for a media plan with pagination
 */
export const useMediaPlanPagination = (
    activePlanId: string | null,
    generatedImages: Record<string, string>,
    setGeneratedImages: (images: Record<string, string>) => void,
    dispatchAssets: (action: any) => void
) => {
    const loadAdditionalPosts = useCallback(async (
        planId: string,
        page: number = 1,
        limit: number = 30
    ) => {
        if (!activePlanId) return;

        try {
            // Load posts with pagination
            const { posts, pagination } = await loadMediaPlanPostsWithPagination(planId, page, limit);
            
            // Update generated images with new image URLs
            const newImageUrls: Record<string, string> = {};
            posts.forEach(post => {
                if (post.imageKey && post.imageKey.startsWith('data:')) {
                    newImageUrls[post.imageKey] = post.imageKey;
                }
            });
            
            setGeneratedImages(prev => ({...prev, ...newImageUrls}));
            
            // Update the plan with the new posts
            dispatchAssets({ 
                type: 'UPDATE_PLAN_POSTS', 
                payload: { 
                    planId, 
                    posts,
                    pagination
                } 
            });
            
            return { posts, pagination };
        } catch (error) {
            console.error(`Failed to load additional posts for plan ${planId}:`, error);
            throw error;
        }
    }, [activePlanId, generatedImages, setGeneratedImages, dispatchAssets]);

    return { loadAdditionalPosts };
};