import { useState, useCallback, useEffect } from 'react';
import { loadMediaPlanPostsWithPagination } from '../services/databaseService';
import type { MediaPlanPost } from '../../types';

/**
 * Hook to handle infinite scrolling for media plan posts
 */
export const useInfiniteScroll = (
    planId: string | null,
    initialPosts: MediaPlanPost[] = []
) => {
    const [posts, setPosts] = useState<MediaPlanPost[]>(initialPosts);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalPosts, setTotalPosts] = useState(0);

    const loadMorePosts = useCallback(async () => {
        if (!planId || !hasMore || loading) return;

        setLoading(true);
        setError(null);

        try {
            const { posts: newPosts, pagination } = await loadMediaPlanPostsWithPagination(
                planId,
                currentPage + 1,
                30 // 30 posts per page
            );

            setPosts(prev => [...prev, ...newPosts]);
            setCurrentPage(pagination.currentPage);
            setHasMore(pagination.hasNextPage);
            setTotalPosts(pagination.totalPosts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load more posts');
        } finally {
            setLoading(false);
        }
    }, [planId, hasMore, loading, currentPage]);

    // Reset when planId changes
    useEffect(() => {
        if (planId) {
            setPosts(initialPosts);
            setCurrentPage(1);
            setHasMore(true);
            setError(null);
            setTotalPosts(0);
        }
    }, [planId, initialPosts]);

    return {
        posts,
        loadMorePosts,
        hasMore,
        loading,
        error,
        totalPosts
    };
};