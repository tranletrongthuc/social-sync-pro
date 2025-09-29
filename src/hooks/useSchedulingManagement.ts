
import React, { useState, useCallback, Dispatch } from 'react';
import type { PostInfo, PostStatus, GeneratedAssets, Settings } from '../../types';
import {
    updateMediaPlanPostInDatabase,
    bulkUpdatePostSchedulesInDatabase
} from '../services/databaseService';

interface useSchedulingManagementProps {
    generatedAssets: GeneratedAssets | null;
    mongoBrandId: string | null;
    settings: Settings;
    dispatchAssets: Dispatch<any>;
    updateAutoSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
    setError: Dispatch<React.SetStateAction<string | null>>;
    setSuccessMessage: (message: string | null) => void;
}

export const useSchedulingManagement = ({
    generatedAssets,
    mongoBrandId,
    settings,
    dispatchAssets,
    updateAutoSaveStatus,
    setError,
    setSuccessMessage,
}: useSchedulingManagementProps) => {
    const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
    const [schedulingPost, setSchedulingPost] = useState<PostInfo | null>(null);
    const [isBulkScheduleModalOpen, setIsBulkScheduleModalOpen] = useState<boolean>(false);
    const [isScheduling, setIsScheduling] = useState<boolean>(false);

    const handleTogglePostSelection = useCallback((postId: string) => {
        setSelectedPostIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAllPosts = useCallback((posts: PostInfo[]) => {
        const allPostIds = new Set(posts.map(p => p.post.id));
        setSelectedPostIds(allPostIds);
    }, []);

    const handleSchedulePost = useCallback((postInfo: PostInfo, scheduledAt: string) => {
        const updates = { scheduledAt, status: 'scheduled' as PostStatus };
        dispatchAssets({ type: 'UPDATE_POST', payload: { ...postInfo, updates } });
        if (mongoBrandId) {
            updateMediaPlanPostInDatabase(postInfo.post.id, mongoBrandId, updates)
                .then(() => updateAutoSaveStatus('saved'))
                .catch(e => { setError(e.message); updateAutoSaveStatus('error'); });
        }
        setSchedulingPost(null);
    }, [mongoBrandId, updateAutoSaveStatus, dispatchAssets, setError]);

    const handlePublishPost = useCallback(async (postInfo: PostInfo): Promise<void> => {
        // Placeholder for direct publishing logic
        setSuccessMessage(`Post "${postInfo.post.title}" published successfully! (Simulated)`);
        setTimeout(() => setSuccessMessage(null), 3000);
    }, [setSuccessMessage]);

    const handlePostDrop = useCallback((postInfo: PostInfo, newDate: Date) => {
        handleSchedulePost(postInfo, newDate.toISOString());
    }, [handleSchedulePost]);

    const handleBulkSchedule = useCallback(async (startDate: Date, intervalDays: number) => {
        if (selectedPostIds.size === 0) {
            setError("No posts selected for bulk scheduling.");
            return;
        }

        const updates: { postId: string; scheduledAt: string; status: 'scheduled' }[] = [];
        let currentDate = new Date(startDate);

        const allPosts: PostInfo[] = [];
        generatedAssets?.mediaPlans.forEach(plan => {
            plan.plan.forEach((week, weekIndex) => {
                week.posts.forEach((post, postIndex) => {
                    allPosts.push({ planId: plan.id, weekIndex, postIndex, post });
                });
            });
        });

        const sortedSelectedPosts = allPosts
            .filter(p => selectedPostIds.has(p.post.id));

        sortedSelectedPosts.forEach(postInfo => {
            updates.push({ postId: postInfo.post.id, scheduledAt: currentDate.toISOString(), status: 'scheduled' });
            currentDate.setDate(currentDate.getDate() + intervalDays);
        });

        dispatchAssets({ type: 'BULK_SCHEDULE_POSTS', payload: { updates } });

        if (mongoBrandId) {
            updateAutoSaveStatus('saving');
            bulkUpdatePostSchedulesInDatabase(updates)
                .then(() => {
                    updateAutoSaveStatus('saved');
                    setSuccessMessage("Posts scheduled successfully!");
                    setTimeout(() => setSuccessMessage(null), 3000);
                })
                .catch(e => {
                    setError(e.message);
                    updateAutoSaveStatus('error');
                });
        }

        setIsBulkScheduleModalOpen(false);
        setSelectedPostIds(new Set());
    }, [selectedPostIds, generatedAssets, mongoBrandId, updateAutoSaveStatus, dispatchAssets, setError, setSuccessMessage]);

    return {
        selectedPostIds,
        schedulingPost,
        isBulkScheduleModalOpen,
        isScheduling,
        setSelectedPostIds,
        setSchedulingPost,
        setIsBulkScheduleModalOpen,
        setIsScheduling,
        handleTogglePostSelection,
        handleSelectAllPosts,
        handleSchedulePost,
        handlePublishPost,
        handlePostDrop,
        handleBulkSchedule,
    };
};